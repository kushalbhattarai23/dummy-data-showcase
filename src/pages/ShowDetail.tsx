import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface Show {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  slug: string;
  created_at: string;
}

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
  is_watched?: boolean;
}

interface Season {
  number: number;
  episodes: Episode[];
  totalEpisodes: number;
  watchedEpisodes: number;
}

export const ShowDetail: React.FC = () => {
  const { showSlug } = useParams<{ showSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [show, setShow] = useState<Show | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [updatingAll, setUpdatingAll] = useState(false);
  const [updatingSeason, setUpdatingSeason] = useState<number | null>(null);

  useEffect(() => {
    if (showSlug) {
      fetchShow();
    }
  }, [showSlug, user]);

  const fetchShow = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('slug', showSlug)
        .single();

      if (error) throw error;
      setShow(data);
      fetchEpisodes(data.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load show details",
        variant: "destructive",
      });
      navigate('/shows/public');
    }
  };

  const fetchEpisodes = async (showId: string) => {
    try {
      const { data: episodesData, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('show_id', showId)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });

      if (error) throw error;

      let episodes = episodesData || [];

      // If user is logged in, fetch watch status more efficiently
      if (user) {
        // Get all watched episodes for this user, then filter by show episodes
        const { data: watchStatus, error: watchError } = await supabase
          .from('user_episode_status')
          .select('episode_id')
          .eq('user_id', user.id)
          .eq('status', 'watched');

        if (!watchError) {
          const watchedEpisodeIds = new Set(watchStatus?.map(ws => ws.episode_id) || []);
          episodes = episodes.map(episode => ({
            ...episode,
            is_watched: watchedEpisodeIds.has(episode.id)
          }));
        }
      }

      // Group episodes by season
      const seasonsMap = new Map<number, Episode[]>();
      episodes.forEach(episode => {
        if (!seasonsMap.has(episode.season_number)) {
          seasonsMap.set(episode.season_number, []);
        }
        seasonsMap.get(episode.season_number)?.push(episode);
      });

      const seasonsList = Array.from(seasonsMap.entries()).map(([number, episodes]) => ({
        number,
        episodes,
        totalEpisodes: episodes.length,
        watchedEpisodes: episodes.filter(ep => ep.is_watched).length
      }));

      // Sort seasons to prioritize those with unwatched episodes
      const sortedSeasons = seasonsList.sort((a, b) => {
        const aHasUnwatched = a.watchedEpisodes < a.totalEpisodes;
        const bHasUnwatched = b.watchedEpisodes < b.totalEpisodes;
        
        // If both have unwatched episodes or both are complete, sort by season number
        if (aHasUnwatched === bHasUnwatched) {
          return a.number - b.number;
        }
        
        // Prioritize seasons with unwatched episodes
        return bHasUnwatched ? 1 : -1;
      });

      // Sort episodes within each season to show unwatched first
      const seasonsWithSortedEpisodes = sortedSeasons.map(season => ({
        ...season,
        episodes: season.episodes.sort((a, b) => {
          const aWatched = a.is_watched || false;
          const bWatched = b.is_watched || false;
          
          // If both have same watch status, sort by episode number
          if (aWatched === bWatched) {
            return a.episode_number - b.episode_number;
          }
          
          // Unwatched episodes first
          return aWatched ? 1 : -1;
        })
      }));

      setSeasons(seasonsWithSortedEpisodes);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load episodes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchStatus = async (episodeId: string, currentlyWatched: boolean) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to track episodes",
        variant: "destructive",
      });
      return;
    }

    setUpdating(episodeId);
    try {
      if (currentlyWatched) {
        const { error } = await supabase
          .from('user_episode_status')
          .delete()
          .eq('user_id', user.id)
          .eq('episode_id', episodeId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_episode_status')
          .upsert({
            user_id: user.id,
            episode_id: episodeId,
            status: 'watched' as const,
            watched_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      // Update local state
      setSeasons(prevSeasons => 
        prevSeasons.map(season => ({
          ...season,
          episodes: season.episodes.map(ep => 
            ep.id === episodeId 
              ? { ...ep, is_watched: !currentlyWatched }
              : ep
          ),
          watchedEpisodes: season.episodes.reduce((count, ep) => 
            count + (ep.id === episodeId ? (!currentlyWatched ? 1 : -1) : (ep.is_watched ? 1 : 0)), 
            0
          )
        }))
      );

      toast({
        title: "Success",
        description: `Episode marked as ${currentlyWatched ? 'unwatched' : 'watched'}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update watch status",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  const markAllEpisodesWatched = async (seasonNumber?: number) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to track episodes",
        variant: "destructive",
      });
      return;
    }

    const targetEpisodes = seasonNumber !== undefined
      ? seasons.find(s => s.number === seasonNumber)?.episodes || []
      : seasons.flatMap(s => s.episodes);

    const unwatchedEpisodes = targetEpisodes.filter(ep => !ep.is_watched);

    if (unwatchedEpisodes.length === 0) {
      toast({
        title: "Info",
        description: "All episodes are already marked as watched",
      });
      return;
    }

    if (seasonNumber !== undefined) {
      setUpdatingSeason(seasonNumber);
    } else {
      setUpdatingAll(true);
    }

    try {
      // Process in batches to avoid URL length issues
      const batchSize = 100;
      for (let i = 0; i < unwatchedEpisodes.length; i += batchSize) {
        const batch = unwatchedEpisodes.slice(i, i + batchSize);
        const statusUpdates = batch.map(episode => ({
          user_id: user.id,
          episode_id: episode.id,
          status: 'watched' as const,
          watched_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('user_episode_status')
          .upsert(statusUpdates);

        if (error) throw error;
      }

      // Update local state
      setSeasons(prevSeasons =>
        prevSeasons.map(season => {
          if (seasonNumber === undefined || season.number === seasonNumber) {
            const updatedEpisodes = season.episodes.map(ep => ({ ...ep, is_watched: true }));
            return {
              ...season,
              episodes: updatedEpisodes,
              watchedEpisodes: updatedEpisodes.length
            };
          }
          return season;
        })
      );

      toast({
        title: "Success",
        description: `Marked all episodes${seasonNumber !== undefined ? ` in season ${seasonNumber}` : ''} as watched!`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update watch status",
        variant: "destructive",
      });
    } finally {
      setUpdatingAll(false);
      setUpdatingSeason(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading show...</div>;
  }

  if (!show) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Show not found</p>
        <Button onClick={() => navigate('/shows/public')} className="mt-4">
          Back to Shows
        </Button>
      </div>
    );
  }

  const totalEpisodes = seasons.reduce((sum, season) => sum + season.totalEpisodes, 0);
  const watchedEpisodes = seasons.reduce((sum, season) => sum + season.watchedEpisodes, 0);
  const progressPercentage = totalEpisodes > 0 ? (watchedEpisodes / totalEpisodes) * 100 : 0;
  const showStatus = 
    watchedEpisodes === 0 ? 'not_started' :
    watchedEpisodes === totalEpisodes ? 'completed' :
    'watching';

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <Button variant="ghost" onClick={() => navigate('/shows/public')} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Shows
        </Button>
        <div className="min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold truncate">{show.title}</h1>
          {show.description && (
            <p className="text-gray-600 text-sm md:text-base">{show.description}</p>
          )}
        </div>
      </div>

      {/* Progress Card */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
            <CardTitle className="flex items-center space-x-2 text-lg md:text-xl text-purple-900">
              <span>Watch Progress</span>
              <Badge 
                variant={
                  showStatus === 'completed' ? 'default' :
                  showStatus === 'watching' ? 'secondary' :
                  'outline'
                }
                className={`text-xs ${
                  showStatus === 'completed' ? 'bg-purple-600 text-white' :
                  showStatus === 'watching' ? 'bg-purple-200 text-purple-800' :
                  'border-purple-300 text-purple-700'
                }`}
              >
                {showStatus === 'completed' ? 'Completed' :
                 showStatus === 'watching' ? 'Watching' :
                 'Not Started'}
              </Badge>
            </CardTitle>
            {user && (
              <Button
                onClick={() => markAllEpisodesWatched()}
                disabled={updatingAll || watchedEpisodes === totalEpisodes}
                size="sm"
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
              >
                {updatingAll ? (
                  'Updating...'
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Mark All as Watched</span>
                    <span className="sm:hidden">Mark All</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs md:text-sm text-purple-700 mb-2">
                <span>{watchedEpisodes} / {totalEpisodes} episodes watched</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full [&>div]:bg-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seasons Accordion */}
      <Card className="border-purple-200">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl text-purple-900">Seasons</CardTitle>
          <CardDescription className="text-sm text-purple-600">Track your progress through each season</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {seasons.map((season) => (
              <AccordionItem key={season.number} value={`season-${season.number}`} className="border-purple-100">
                <AccordionTrigger className="hover:no-underline hover:text-purple-700">
                  <div className="flex items-center justify-between w-full pr-4">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 text-left">
                      <span className="text-sm md:text-lg font-semibold text-purple-900">Season {season.number}</span>
                      <Badge 
                        variant="secondary" 
                        className={`text-xs self-start sm:self-auto ${
                          season.watchedEpisodes === season.totalEpisodes 
                            ? 'bg-purple-200 text-purple-800' 
                            : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {season.watchedEpisodes} / {season.totalEpisodes} Episodes
                      </Badge>
                    </div>
                    <Progress 
                      value={(season.watchedEpisodes / season.totalEpisodes) * 100} 
                      className="w-20 sm:w-32 hidden sm:block [&>div]:bg-purple-600"
                    />
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3 md:space-y-4 pt-4">
                    {user && (
                      <div className="flex justify-end">
                        <Button
                          onClick={() => markAllEpisodesWatched(season.number)}
                          disabled={updatingSeason === season.number || season.watchedEpisodes === season.totalEpisodes}
                          size="sm"
                          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {updatingSeason === season.number ? (
                            'Updating...'
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              <span className="hidden sm:inline">Mark Season as Watched</span>
                              <span className="sm:hidden">Mark Season</span>
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                    <div className="space-y-2">
                      {season.episodes.map((episode) => (
                        <div
                          key={episode.id}
                          className={`flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-lg hover:bg-purple-50 space-y-2 sm:space-y-0 ${
                            !episode.is_watched ? 'bg-purple-25 border border-purple-200' : 'bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 min-w-0">
                            <span className="text-xs md:text-sm font-medium flex-shrink-0 text-purple-700">
                              Episode {episode.episode_number}
                            </span>
                            <span className={`font-medium text-sm md:text-base truncate ${
                              !episode.is_watched ? 'text-purple-900' : 'text-gray-700'
                            }`}>
                              {episode.title}
                            </span>
                            {episode.air_date && (
                              <span className="text-xs md:text-sm text-gray-500 flex-shrink-0">
                                {new Date(episode.air_date).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                          {user && (
                            <Button
                              variant={episode.is_watched ? "default" : "outline"}
                              size="sm"
                              onClick={() => toggleWatchStatus(episode.id, episode.is_watched)}
                              disabled={updating === episode.id}
                              className={`w-full sm:w-auto flex-shrink-0 ${
                                episode.is_watched 
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                                  : 'border-purple-300 text-purple-700 hover:bg-purple-50'
                              }`}
                            >
                              {updating === episode.id ? (
                                'Updating...'
                              ) : episode.is_watched ? (
                                <>
                                  <Eye className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                  <span className="hidden sm:inline">Watched</span>
                                  <span className="sm:hidden">✓</span>
                                </>
                              ) : (
                                <>
                                  <EyeOff className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                                  <span className="hidden sm:inline">Not Watched</span>
                                  <span className="sm:hidden">○</span>
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          {seasons.length === 0 && (
            <p className="text-center text-gray-500 py-8 text-sm md:text-base">
              No seasons found for this show.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

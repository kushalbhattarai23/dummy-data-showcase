import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Play, CheckCircle, Clock, Eye } from 'lucide-react';

interface Show {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  created_at: string;
}

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  season_number: number;
  air_date: string | null;
}

interface ShowTrackerProps {
  show: Show;
  onStatusChange?: () => void;
}

export const ShowTracker: React.FC<ShowTrackerProps> = ({ show, onStatusChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [watchedEpisodes, setWatchedEpisodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchEpisodes();
    if (user) {
      fetchWatchStatus();
    }
  }, [show.id, user]);

  const fetchEpisodes = async () => {
    try {
      const { data, error } = await supabase
        .from('episodes')
        .select('*')
        .eq('show_id', show.id)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });

      if (error) throw error;
      setEpisodes(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load episodes",
        variant: "destructive",
      });
    }
  };

  const fetchWatchStatus = async () => {
    if (!user) return;

    try {
      // Get all watched episodes for this user, then filter by show episodes
      const { data, error } = await supabase
        .from('user_episode_status')
        .select('episode_id')
        .eq('user_id', user.id)
        .eq('status', 'watched');

      if (error) throw error;
      
      // Get episode IDs for this show
      const { data: showEpisodes, error: episodesError } = await supabase
        .from('episodes')
        .select('id')
        .eq('show_id', show.id);

      if (episodesError) throw episodesError;

      const showEpisodeIds = new Set(showEpisodes?.map(ep => ep.id) || []);
      const watchedInThisShow = (data || [])
        .filter(ws => showEpisodeIds.has(ws.episode_id))
        .map(ws => ws.episode_id);

      setWatchedEpisodes(watchedInThisShow);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load watch status",
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
        // Remove watch status
        const { error } = await supabase
          .from('user_episode_status')
          .delete()
          .eq('user_id', user.id)
          .eq('episode_id', episodeId);

        if (error) throw error;
        setWatchedEpisodes(prev => prev.filter(id => id !== episodeId));
      } else {
        // Add watch status
        const { error } = await supabase
          .from('user_episode_status')
          .upsert({
            user_id: user.id,
            episode_id: episodeId,
            status: 'watched' as const,
            watched_at: new Date().toISOString()
          });

        if (error) throw error;
        setWatchedEpisodes(prev => [...prev, episodeId]);
      }

      onStatusChange?.();
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

  const markAllWatched = async () => {
    if (!user) return;

    setUpdating('all');
    try {
      const unwatchedEpisodes = episodes.filter(ep => !watchedEpisodes.includes(ep.id));
      
      if (unwatchedEpisodes.length > 0) {
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

        setWatchedEpisodes(episodes.map(ep => ep.id));
        
        toast({
          title: "Success",
          description: "Marked all episodes as watched!",
        });
      }

      onStatusChange?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to mark all as watched",
        variant: "destructive",
      });
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Loading episodes...</div>;
  }

  const progressPercentage = episodes.length > 0 ? (watchedEpisodes.length / episodes.length) * 100 : 0;
  const showStatus = 
    watchedEpisodes.length === 0 ? 'not_started' :
    watchedEpisodes.length === episodes.length ? 'completed' :
    'watching';

  return (
    <div className="space-y-6">
      {/* Show Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <span>{show.title}</span>
                <Badge 
                  variant={
                    showStatus === 'completed' ? 'default' :
                    showStatus === 'watching' ? 'secondary' :
                    'outline'
                  }
                >
                  {showStatus === 'completed' ? 'Completed' :
                   showStatus === 'watching' ? 'Watching' :
                   'Not Started'}
                </Badge>
              </CardTitle>
              {show.description && (
                <CardDescription>{show.description}</CardDescription>
              )}
            </div>
            {user && episodes.length > 0 && (
              <Button 
                onClick={markAllWatched}
                disabled={updating === 'all' || watchedEpisodes.length === episodes.length}
                variant="outline"
              >
                {updating === 'all' ? 'Updating...' : 'Mark All Watched'}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>{watchedEpisodes.length} / {episodes.length} episodes watched</span>
                <span>{Math.round(progressPercentage)}%</span>
              </div>
              <Progress value={progressPercentage} className="w-full" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Episodes List */}
      <Card>
        <CardHeader>
          <CardTitle>Episodes</CardTitle>
          <CardDescription>Track your progress through the series</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {episodes.map((episode) => {
              const isWatched = watchedEpisodes.includes(episode.id);
              return (
                <div key={episode.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-600">
                        S{episode.season_number}E{episode.episode_number}
                      </span>
                      <span className="font-medium">{episode.title}</span>
                      {isWatched && <CheckCircle className="h-4 w-4 text-green-600" />}
                    </div>
                    {episode.air_date && (
                      <p className="text-sm text-gray-500">
                        Aired: {new Date(episode.air_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  {user && (
                    <Button
                      variant={isWatched ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleWatchStatus(episode.id, isWatched)}
                      disabled={updating === episode.id}
                    >
                      {updating === episode.id ? (
                        'Updating...'
                      ) : isWatched ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Watched
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Mark Watched
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
            {episodes.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No episodes found for this show.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

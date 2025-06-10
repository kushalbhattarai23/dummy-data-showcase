import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tv, Play, CheckCircle, Clock, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Universe {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  is_public: boolean;
  creator_id: string;
}

interface DashboardStats {
  totalShows: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  watchingShows: number;
  notStartedShows: number;
  completedShows: number;
}

interface ShowProgress {
  id: string;
  title: string;
  totalEpisodes: number;
  watchedEpisodes: number;
  status: 'watching' | 'not_started' | 'completed';
}

export const UniverseDashboard: React.FC = () => {
  const { universeSlug } = useParams<{ universeSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showProgress, setShowProgress] = useState<ShowProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (universeSlug) {
      fetchUniverse();
    }
  }, [universeSlug, user]);

  const fetchUniverse = async () => {
    try {
      const { data, error } = await supabase
        .from('universes')
        .select('*')
        .eq('slug', universeSlug)
        .single();

      if (error) throw error;
      setUniverse(data);
      if (user) {
        fetchDashboardData(data.id);
      } else {
        setLoading(false);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load universe details",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const fetchDashboardData = async (universeId: string) => {
    try {
      // Get shows in this universe
      const { data: universeShows, error: universeShowsError } = await supabase
        .from('show_universes')
        .select(`
          show_id,
          shows (
            id,
            title
          )
        `)
        .eq('universe_id', universeId);

      if (universeShowsError) throw universeShowsError;

      const showIds = (universeShows || []).map(item => item.show_id);

      if (showIds.length === 0) {
        setStats({
          totalShows: 0,
          totalEpisodes: 0,
          watchedEpisodes: 0,
          watchingShows: 0,
          notStartedShows: 0,
          completedShows: 0,
        });
        setShowProgress([]);
        setLoading(false);
        return;
      }

      // Check if user is tracking any of these shows
      const { data: trackedShows, error: trackedError } = await supabase
        .from('user_show_tracking')
        .select('show_id')
        .eq('user_id', user.id)
        .in('show_id', showIds);

      if (trackedError) throw trackedError;

      const trackedShowIds = (trackedShows || []).map(item => item.show_id);

      if (trackedShowIds.length === 0) {
        setStats({
          totalShows: showIds.length,
          totalEpisodes: 0,
          watchedEpisodes: 0,
          watchingShows: 0,
          notStartedShows: showIds.length,
          completedShows: 0,
        });
        
        // Set show progress for non-tracked shows
        const nonTrackedProgress = (universeShows || []).map(item => ({
          id: item.show_id,
          title: item.shows.title,
          totalEpisodes: 0,
          watchedEpisodes: 0,
          status: 'not_started' as const
        }));
        setShowProgress(nonTrackedProgress);
        setLoading(false);
        return;
      }

      // Get episodes for tracked shows in this universe
      const { data: episodeData, error: episodeError } = await supabase
        .from('episodes')
        .select(`
          id,
          show_id,
          title,
          shows!inner(id, title)
        `)
        .in('show_id', trackedShowIds);

      if (episodeError) throw episodeError;

      // Get watched episodes for the user using batch processing
      if (episodeData && episodeData.length > 0) {
        const episodeIds = episodeData.map(ep => ep.id);
        console.log(`Fetching watch status for ${episodeIds.length} episodes in dashboard`);
        
        // Process episodes in batches of 20 to avoid URL length limits
        const batchSize = 20;
        const allWatchedEpisodeIds = new Set<string>();
        
        for (let i = 0; i < episodeIds.length; i += batchSize) {
          const batchIds = episodeIds.slice(i, i + batchSize);
          console.log(`Dashboard: Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(episodeIds.length / batchSize)} with ${batchIds.length} episodes`);
          
          try {
            const { data: watchedData, error: watchedError } = await supabase
              .from('user_episode_status')
              .select('episode_id')
              .eq('user_id', user.id)
              .eq('status', 'watched')
              .in('episode_id', batchIds);

            if (watchedError) {
              console.error(`Dashboard: Error fetching batch ${Math.floor(i / batchSize) + 1}:`, watchedError);
              continue;
            }

            // Add watched episode IDs to the set
            watchedData?.forEach(ws => allWatchedEpisodeIds.add(ws.episode_id));
          } catch (batchError) {
            console.error(`Dashboard: Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError);
          }
        }
        
        console.log(`Dashboard: Found ${allWatchedEpisodeIds.size} watched episodes out of ${episodeIds.length} total episodes`);

        // Calculate stats
        const totalEpisodes = episodeData.length;
        const watchedEpisodes = allWatchedEpisodeIds.size;

        // Group by shows
        const showsMap = new Map();
        episodeData.forEach(episode => {
          const showId = episode.show_id;
          if (!showsMap.has(showId)) {
            showsMap.set(showId, {
              id: showId,
              title: episode.shows.title,
              totalEpisodes: 0,
              watchedEpisodes: 0
            });
          }
          const show = showsMap.get(showId);
          show.totalEpisodes++;
          if (allWatchedEpisodeIds.has(episode.id)) {
            show.watchedEpisodes++;
          }
        });

        // Add non-tracked shows to the map
        universeShows?.forEach(item => {
          if (!trackedShowIds.includes(item.show_id)) {
            showsMap.set(item.show_id, {
              id: item.show_id,
              title: item.shows.title,
              totalEpisodes: 0,
              watchedEpisodes: 0
            });
          }
        });

        const shows = Array.from(showsMap.values());
        const totalShows = shows.length;
        const watchingShows = shows.filter(show => show.watchedEpisodes > 0 && show.watchedEpisodes < show.totalEpisodes).length;
        const completedShows = shows.filter(show => show.watchedEpisodes === show.totalEpisodes && show.totalEpisodes > 0).length;
        const notStartedShows = shows.filter(show => show.watchedEpisodes === 0).length;

        setStats({
          totalShows,
          totalEpisodes,
          watchedEpisodes,
          watchingShows,
          notStartedShows,
          completedShows,
        });

        // Set show progress with status
        const progressWithStatus = shows.map(show => ({
          ...show,
          status: show.watchedEpisodes === 0 ? 'not_started' as const :
                  show.watchedEpisodes === show.totalEpisodes ? 'completed' as const :
                  'watching' as const
        }));

        setShowProgress(progressWithStatus);
      } else {
        // No episodes found for tracked shows
        const allShows = (universeShows || []).map(item => ({
          id: item.show_id,
          title: item.shows.title,
          totalEpisodes: 0,
          watchedEpisodes: 0,
          status: 'not_started' as const
        }));

        setStats({
          totalShows: allShows.length,
          totalEpisodes: 0,
          watchedEpisodes: 0,
          watchingShows: 0,
          notStartedShows: allShows.length,
          completedShows: 0,
        });

        setShowProgress(allShows);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading universe dashboard...</div>;
  }

  if (!universe) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Universe not found</p>
        <Button onClick={() => navigate('/')} className="mt-4">
          Back to Universes
        </Button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view your universe dashboard.</p>
      </div>
    );
  }

  const completionPercentage = stats?.totalEpisodes ? Math.round((stats.watchedEpisodes / stats.totalEpisodes) * 100) : 0;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-0">
      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <Button variant="ghost" onClick={() => navigate(`/universe/${universeSlug}`)} className="self-start">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Universe
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{universe.name} Dashboard</h1>
          {universe.description && (
            <p className="text-gray-600 text-sm md:text-base">{universe.description}</p>
          )}
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Shows in Universe</CardTitle>
            <Tv className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats?.totalShows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Episodes</CardTitle>
            <Play className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats?.totalEpisodes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Watched Episodes</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{stats?.watchedEpisodes || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Progress</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl md:text-2xl font-bold">{completionPercentage}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Overall Progress</CardTitle>
          <CardDescription className="text-sm">
            {stats?.watchedEpisodes || 0} of {stats?.totalEpisodes || 0} episodes watched in this universe
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={completionPercentage} className="w-full" />
          <p className="text-xs md:text-sm text-muted-foreground mt-2">
            {completionPercentage}% complete - {((stats?.totalEpisodes || 0) - (stats?.watchedEpisodes || 0))} episodes left
          </p>
        </CardContent>
      </Card>

      {/* Show Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <Play className="h-4 md:h-5 w-4 md:w-5 text-blue-600" />
              <span>Watching</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-blue-600">{stats?.watchingShows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <Clock className="h-4 md:h-5 w-4 md:w-5 text-yellow-600" />
              <span>Not Started</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-yellow-600">{stats?.notStartedShows || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-base md:text-lg">
              <CheckCircle className="h-4 md:h-5 w-4 md:w-5 text-green-600" />
              <span>Completed</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl md:text-3xl font-bold text-green-600">{stats?.completedShows || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Show Progress List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg md:text-xl">Show Progress in Universe</CardTitle>
          <CardDescription className="text-sm">Track your progress across all shows in this universe</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 md:space-y-4">
            {showProgress.map((show) => (
              <div key={show.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 md:p-4 border rounded-lg space-y-2 sm:space-y-0">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm md:text-base truncate">{show.title}</h3>
                  <p className="text-xs md:text-sm text-gray-600">
                    {show.watchedEpisodes} / {show.totalEpisodes} episodes
                  </p>
                  <Progress 
                    value={show.totalEpisodes > 0 ? (show.watchedEpisodes / show.totalEpisodes) * 100 : 0} 
                    className="w-full mt-2" 
                  />
                </div>
                <div className="sm:ml-4 flex justify-end">
                  <Badge 
                    variant={
                      show.status === 'completed' ? 'default' :
                      show.status === 'watching' ? 'secondary' :
                      'outline'
                    }
                    className="text-xs"
                  >
                    {show.status === 'completed' ? 'Completed' :
                     show.status === 'watching' ? 'Watching' :
                     'Not Started'}
                  </Badge>
                </div>
              </div>
            ))}
            {showProgress.length === 0 && (
              <p className="text-center text-gray-500 py-8 text-sm md:text-base">
                No shows found in this universe.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

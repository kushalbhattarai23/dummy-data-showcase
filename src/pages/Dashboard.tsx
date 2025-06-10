import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tv, Play, CheckCircle, Clock, TrendingUp, Globe } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalShows: number;
  totalEpisodes: number;
  watchedEpisodes: number;
  watchingShows: number;
  notStartedShows: number;
  completedShows: number;
  totalUniverses: number;
}

interface ShowProgress {
  id: string;
  title: string;
  slug: string;
  totalEpisodes: number;
  watchedEpisodes: number;
  status: 'watching' | 'not_started' | 'completed';
}

type FilterType = 'all' | 'watching' | 'not_started' | 'completed';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [showProgress, setShowProgress] = useState<ShowProgress[]>([]);
  const [filteredShows, setFilteredShows] = useState<ShowProgress[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  useEffect(() => {
    filterShows(currentFilter);
  }, [showProgress, currentFilter]);

  const filterShows = (filter: FilterType) => {
    if (filter === 'all') {
      setFilteredShows(showProgress);
    } else {
      setFilteredShows(showProgress.filter(show => show.status === filter));
    }
  };

  const handleFilterClick = (filter: FilterType) => {
    setCurrentFilter(filter);
  };

  const handleShowClick = (showSlug: string) => {
    navigate(`/tracker/show/${showSlug}`);
  };

  const fetchDashboardData = async () => {
    try {
      // Get tracked shows with their slugs
      const { data: trackedShows, error: trackedError } = await supabase
        .from('user_show_tracking')
        .select(`
          show_id,
          shows (
            id,
            title,
            slug
          )
        `)
        .eq('user_id', user.id);

      if (trackedError) throw trackedError;

      const trackedShowIds = (trackedShows || []).map(item => item.show_id);

      if (trackedShowIds.length === 0) {
        setStats({
          totalShows: 0,
          totalEpisodes: 0,
          watchedEpisodes: 0,
          watchingShows: 0,
          notStartedShows: 0,
          completedShows: 0,
          totalUniverses: 0
        });
        setShowProgress([]);
        setLoading(false);
        return;
      }

      // Get episodes for tracked shows
      const { data: episodeData, error: episodeError } = await supabase
        .from('episodes')
        .select(`
          id,
          show_id,
          title,
          shows!inner(id, title, slug)
        `)
        .in('show_id', trackedShowIds);

      if (episodeError) throw episodeError;

      // Get watched episodes
      const { data: watchedData, error: watchedError } = await supabase
        .from('user_episode_status')
        .select('episode_id')
        .eq('user_id', user.id)
        .eq('status', 'watched');

      if (watchedError) throw watchedError;

      const watchedEpisodeIds = new Set((watchedData || []).map(item => item.episode_id));

      // Get universes count
      const { data: universesData, error: universesError } = await supabase
        .from('universes')
        .select('id')
        .eq('is_public', true);

      if (universesError) throw universesError;

      // Calculate stats
      const totalEpisodes = episodeData?.length || 0;
      const watchedEpisodes = episodeData?.filter(ep => watchedEpisodeIds.has(ep.id)).length || 0;

      // Group by shows
      const showsMap = new Map();
      episodeData?.forEach(episode => {
        const showId = episode.show_id;
        if (!showsMap.has(showId)) {
          showsMap.set(showId, {
            id: showId,
            title: episode.shows.title,
            slug: episode.shows.slug,
            totalEpisodes: 0,
            watchedEpisodes: 0
          });
        }
        const show = showsMap.get(showId);
        show.totalEpisodes++;
        if (watchedEpisodeIds.has(episode.id)) {
          show.watchedEpisodes++;
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
        totalUniverses: universesData?.length || 0
      });

      // Set show progress with status
      const progressWithStatus = shows.map(show => ({
        ...show,
        status: show.watchedEpisodes === 0 ? 'not_started' as const :
                show.watchedEpisodes === show.totalEpisodes ? 'completed' as const :
                'watching' as const
      }));

      setShowProgress(progressWithStatus);
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

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view your dashboard.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading dashboard...</div>;
  }

  const completionPercentage = stats?.totalEpisodes ? Math.round((stats.watchedEpisodes / stats.totalEpisodes) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50">
      {/* Header */}
      <div className="bg-purple-600 text-white py-8 -mx-4 -mt-8 mb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <Tv className="w-8 h-8" />
            <h1 className="text-3xl font-bold">TV Show Dashboard</h1>
          </div>
          <p className="text-purple-100">Track your favorite shows and episodes</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Tracked Shows</CardTitle>
              <Tv className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats?.totalShows || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Total Episodes</CardTitle>
              <Play className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats?.totalEpisodes || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Watched Episodes</CardTitle>
              <CheckCircle className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats?.watchedEpisodes || 0}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-700">Universes</CardTitle>
              <Globe className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-900">{stats?.totalUniverses || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Progress Bar */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">Overall Progress</CardTitle>
            <CardDescription className="text-purple-600">
              {stats?.watchedEpisodes || 0} of {stats?.totalEpisodes || 0} episodes watched
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={completionPercentage} className="w-full [&>div]:bg-purple-600" />
            <p className="text-sm text-purple-600 mt-2">
              {completionPercentage}% complete - {((stats?.totalEpisodes || 0) - (stats?.watchedEpisodes || 0))} episodes left
            </p>
          </CardContent>
        </Card>

        {/* Show Status Summary - Now clickable */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card 
            className={`border-purple-200 cursor-pointer transition-all hover:shadow-lg ${
              currentFilter === 'all' ? 'ring-2 ring-purple-600' : ''
            }`}
            onClick={() => handleFilterClick('all')}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-900">
                <Tv className="h-5 w-5 text-purple-600" />
                <span>All Shows</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-600">{stats?.totalShows || 0}</div>
            </CardContent>
          </Card>

          <Card 
            className={`border-purple-200 cursor-pointer transition-all hover:shadow-lg ${
              currentFilter === 'watching' ? 'ring-2 ring-blue-600' : ''
            }`}
            onClick={() => handleFilterClick('watching')}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-900">
                <Play className="h-5 w-5 text-blue-600" />
                <span>Watching</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats?.watchingShows || 0}</div>
            </CardContent>
          </Card>

          <Card 
            className={`border-purple-200 cursor-pointer transition-all hover:shadow-lg ${
              currentFilter === 'not_started' ? 'ring-2 ring-yellow-600' : ''
            }`}
            onClick={() => handleFilterClick('not_started')}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-900">
                <Clock className="h-5 w-5 text-yellow-600" />
                <span>Not Started</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-600">{stats?.notStartedShows || 0}</div>
            </CardContent>
          </Card>

          <Card 
            className={`border-purple-200 cursor-pointer transition-all hover:shadow-lg ${
              currentFilter === 'completed' ? 'ring-2 ring-green-600' : ''
            }`}
            onClick={() => handleFilterClick('completed')}
          >
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-purple-900">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Completed</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats?.completedShows || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Show Progress Table */}
        <Card className="border-purple-200">
          <CardHeader>
            <CardTitle className="text-purple-900">
              Show Progress {currentFilter !== 'all' && `- ${currentFilter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`}
            </CardTitle>
            <CardDescription className="text-purple-600">
              Click on show names to view details. Filter by status using the cards above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-purple-700">Show Name</TableHead>
                  <TableHead className="text-purple-700">Progress</TableHead>
                  <TableHead className="text-purple-700">Episodes</TableHead>
                  <TableHead className="text-purple-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShows.map((show) => (
                  <TableRow key={show.id} className="hover:bg-purple-50">
                    <TableCell>
                      <button
                        onClick={() => handleShowClick(show.slug)}
                        className="font-medium text-purple-900 hover:text-purple-600 text-left underline-offset-4 hover:underline"
                      >
                        {show.title}
                      </button>
                    </TableCell>
                    <TableCell>
                      <div className="w-full">
                        <Progress 
                          value={show.totalEpisodes > 0 ? (show.watchedEpisodes / show.totalEpisodes) * 100 : 0} 
                          className="w-full [&>div]:bg-purple-600" 
                        />
                        <p className="text-xs text-purple-600 mt-1">
                          {show.totalEpisodes > 0 ? Math.round((show.watchedEpisodes / show.totalEpisodes) * 100) : 0}%
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-purple-600">
                      {show.watchedEpisodes} / {show.totalEpisodes}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={
                          show.status === 'completed' ? 'default' :
                          show.status === 'watching' ? 'secondary' :
                          'outline'
                        }
                        className={
                          show.status === 'completed' ? 'bg-green-600 text-white' :
                          show.status === 'watching' ? 'bg-blue-200 text-blue-800' :
                          'border-yellow-300 text-yellow-700'
                        }
                      >
                        {show.status === 'completed' ? 'Completed' :
                         show.status === 'watching' ? 'Watching' :
                         'Not Started'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredShows.length === 0 && (
              <div className="text-center text-purple-500 py-8">
                {currentFilter === 'all' 
                  ? "No tracked shows found. Start tracking some shows to see your progress!"
                  : `No ${currentFilter.replace('_', ' ')} shows found.`
                }
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

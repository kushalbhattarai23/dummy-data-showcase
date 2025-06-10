
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ShowCard } from '@/components/shows/ShowCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Search, Plus, CheckCircle, BarChart3, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

interface Universe {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  is_public: boolean;
  creator_id: string;
}

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
  show_id: string;
  show_title: string;
  is_watched?: boolean;
}

export const UniverseDetail: React.FC = () => {
  const { universeSlug } = useParams<{ universeSlug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [shows, setShows] = useState<Show[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [availableShows, setAvailableShows] = useState<Show[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [episodesLoading, setEpisodesLoading] = useState(true);
  const [addingShow, setAddingShow] = useState<string | null>(null);
  
  // Episode filter states
  const [episodeSearchTerm, setEpisodeSearchTerm] = useState('');
  const [showFilter, setShowFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

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
      
      // Load shows first, then episodes asynchronously
      await fetchShows(data.id);
      fetchAvailableShows(data.id);
      fetchEpisodesProgressively(data.id);
      setLoading(false);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load universe details",
        variant: "destructive",
      });
      navigate('/');
    }
  };

  const fetchShows = async (universeId: string) => {
    try {
      const { data, error } = await supabase
        .from('show_universes')
        .select(`
          shows (
            id,
            title,
            description,
            poster_url,
            slug,
            created_at
          )
        `)
        .eq('universe_id', universeId);

      if (error) throw error;
      
      const showsData = (data || []).map(item => item.shows).filter(Boolean);
      setShows(showsData);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load shows",
        variant: "destructive",
      });
    }
  };

  const fetchEpisodesProgressively = async (universeId: string) => {
    try {
      // First get all episodes without watch status
      const { data, error } = await supabase
        .from('episodes')
        .select(`
          *,
          shows!inner(
            title,
            show_universes!inner(universe_id)
          )
        `)
        .eq('shows.show_universes.universe_id', universeId)
        .order('air_date', { ascending: true });

      if (error) throw error;
      
      let episodesWithShowTitle = (data || []).map(episode => ({
        ...episode,
        show_title: episode.shows.title,
        is_watched: false // Start with false, will update progressively
      }));

      // Display episodes immediately
      setEpisodes(episodesWithShowTitle);
      setEpisodesLoading(false);

      // If user is logged in, fetch watch status progressively
      if (user && episodesWithShowTitle.length > 0) {
        const episodeIds = episodesWithShowTitle.map(ep => ep.id);
        console.log(`Loading watch status for ${episodeIds.length} episodes progressively`);
        
        // Process episodes in batches of 50 to balance speed and performance
        const batchSize = 50;
        
        for (let i = 0; i < episodeIds.length; i += batchSize) {
          const batchIds = episodeIds.slice(i, i + batchSize);
          console.log(`Loading batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(episodeIds.length / batchSize)}`);
          
          try {
            const { data: watchStatus, error: watchError } = await supabase
              .from('user_episode_status')
              .select('episode_id')
              .eq('user_id', user.id)
              .eq('status', 'watched')
              .in('episode_id', batchIds);

            if (watchError) {
              console.error(`Error loading batch ${Math.floor(i / batchSize) + 1}:`, watchError);
              continue;
            }

            // Update episodes with watch status for this batch
            const watchedInBatch = new Set(watchStatus?.map(ws => ws.episode_id) || []);
            
            setEpisodes(prevEpisodes => 
              prevEpisodes.map(episode => 
                batchIds.includes(episode.id) 
                  ? { ...episode, is_watched: watchedInBatch.has(episode.id) }
                  : episode
              )
            );
          } catch (batchError) {
            console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, batchError);
          }
        }
        
        console.log('Finished loading all watch statuses');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load episodes",
        variant: "destructive",
      });
      setEpisodesLoading(false);
    }
  };

  const fetchAvailableShows = async (universeId: string) => {
    try {
      // Get shows that are NOT in this universe
      const { data: showsInUniverse, error: universeShowsError } = await supabase
        .from('show_universes')
        .select('show_id')
        .eq('universe_id', universeId);

      if (universeShowsError) throw universeShowsError;

      const showIdsInUniverse = (showsInUniverse || []).map(item => item.show_id);

      let query = supabase
        .from('shows')
        .select('*')
        .order('created_at', { ascending: false });

      if (showIdsInUniverse.length > 0) {
        query = query.not('id', 'in', `(${showIdsInUniverse.join(',')})`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailableShows(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load available shows",
        variant: "destructive",
      });
    }
  };

  const handleShowSelect = (showId: string) => {
    const show = [...shows, ...availableShows].find(s => s.id === showId);
    if (show?.slug) {
      navigate(`/show/${show.slug}`);
    }
  };

  const handleAddShow = async (showId: string) => {
    if (!universe) return;

    setAddingShow(showId);
    try {
      const { error } = await supabase
        .from('show_universes')
        .insert({
          show_id: showId,
          universe_id: universe.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Show added to universe successfully!",
      });

      // Refresh the shows list
      await Promise.all([
        fetchShows(universe.id),
        fetchAvailableShows(universe.id)
      ]);
      
      // Refresh episodes for the new show
      fetchEpisodesProgressively(universe.id);
      setSearchTerm('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add show to universe",
        variant: "destructive",
      });
    } finally {
      setAddingShow(null);
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

    try {
      if (currentlyWatched) {
        const { error } = await supabase
          .from('user_episode_status')
          .delete()
          .eq('user_id', user.id)
          .eq('episode_id', episodeId);

        if (error) throw error;
        
        setEpisodes(prev => prev.map(ep => 
          ep.id === episodeId ? { ...ep, is_watched: false } : ep
        ));
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
        
        setEpisodes(prev => prev.map(ep => 
          ep.id === episodeId ? { ...ep, is_watched: true } : ep
        ));
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update watch status",
        variant: "destructive",
      });
    }
  };

  // Filter and sort episodes
  const filteredAndSortedEpisodes = episodes
    .filter(episode => {
      const matchesSearch = episode.title.toLowerCase().includes(episodeSearchTerm.toLowerCase()) ||
                           episode.show_title.toLowerCase().includes(episodeSearchTerm.toLowerCase());
      
      const matchesShow = showFilter === 'all' || episode.show_title === showFilter;
      
      const matchesStatus = statusFilter === 'all' ||
                           (statusFilter === 'watched' && episode.is_watched) ||
                           (statusFilter === 'unwatched' && !episode.is_watched);
      
      return matchesSearch && matchesShow && matchesStatus;
    })
    .sort((a, b) => {
      // First, sort by watch status (unwatched first)
      if (a.is_watched !== b.is_watched) {
        return a.is_watched ? 1 : -1;
      }
      
      // Then sort by air date
      const dateA = a.air_date ? new Date(a.air_date).getTime() : 0;
      const dateB = b.air_date ? new Date(b.air_date).getTime() : 0;
      
      if (dateA !== dateB) {
        return dateA - dateB;
      }
      
      // Finally sort by season and episode number
      if (a.season_number !== b.season_number) {
        return a.season_number - b.season_number;
      }
      
      return a.episode_number - b.episode_number;
    });

  // Get unique shows for filter
  const uniqueShows = Array.from(new Set(episodes.map(ep => ep.show_title))).sort();

  const filteredAvailableShows = availableShows.filter(show =>
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading universe...</div>;
  }

  if (!universe) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Universe not found</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          Back to Universes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Universes
        </Button>
        <div className="flex items-center space-x-4">
          <Button
            onClick={() => navigate(`/universe/${universe.slug}/dashboard`)}
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Universe Dashboard
          </Button>
          <h1 className="text-3xl font-bold">{universe.name}</h1>
        </div>
      </div>
      
      {universe.description && (
        <p className="text-gray-600">{universe.description}</p>
      )}

      {/* Episodes Table */}
      <div>
        <div className="flex items-center space-x-2 mb-4">
          <h2 className="text-2xl font-semibold">All Episodes</h2>
          {episodesLoading && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading watch statuses...</span>
            </div>
          )}
        </div>
        
        {/* Episode Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search episodes or shows..."
              value={episodeSearchTerm}
              onChange={(e) => setEpisodeSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={showFilter} onValueChange={setShowFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filter by show" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Shows</SelectItem>
              {uniqueShows.map(show => (
                <SelectItem key={show} value={show}>{show}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="watched">Watched</SelectItem>
              <SelectItem value="unwatched">Unwatched</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedEpisodes.length > 0 ? (
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Show</TableHead>
                  <TableHead>Season</TableHead>
                  <TableHead>Episode</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Air Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAndSortedEpisodes.map((episode) => {
                  const isWatched = episode.is_watched;
                  return (
                    <TableRow key={episode.id}>
                      <TableCell className="font-medium">{episode.show_title}</TableCell>
                      <TableCell>S{episode.season_number}</TableCell>
                      <TableCell>E{episode.episode_number}</TableCell>
                      <TableCell>{episode.title}</TableCell>
                      <TableCell>
                        {episode.air_date 
                          ? new Date(episode.air_date).toLocaleDateString()
                          : 'TBA'
                        }
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          {isWatched ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-600" />
                              <span className="text-green-600">Watched</span>
                            </>
                          ) : (
                            <span className="text-gray-500">Unwatched</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleWatchStatus(episode.id, isWatched)}
                          className={`px-2 py-1 text-sm rounded font-medium transition-colors duration-200 ${
                            isWatched
                              ? 'bg-purple-700 text-white hover:bg-purple-800'
                              : 'bg-purple-300 text-purple-900 hover:bg-purple-400'
                          }`}
                        >
                          {isWatched ? 'Mark Unwatched' : 'Mark Watched'}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {episodeSearchTerm || showFilter !== 'all' || statusFilter !== 'all' 
              ? 'No episodes found matching your filters.'
              : 'No episodes found in this universe.'
            }
          </div>
        )}
      </div>

      {/* Shows in Universe */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Shows in Universe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {shows.map((show) => (
            <ShowCard key={show.id} show={show} onSelect={handleShowSelect} />
          ))}
        </div>

        {shows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No shows found in this universe.
          </div>
        )}
      </div>

      {/* Add Shows Section */}
      <div className="border-t pt-6">
        <h2 className="text-2xl font-semibold mb-4">Add Shows to Universe</h2>
        
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search shows to add..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Available Shows */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAvailableShows.map((show) => (
            <div key={show.id} className="relative">
              <ShowCard show={show} onSelect={() => {}} />
              <Button
                onClick={() => handleAddShow(show.id)}
                disabled={addingShow === show.id}
                className="absolute top-2 right-2"
                size="sm"
              >
                {addingShow === show.id ? (
                  'Adding...'
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        {searchTerm && filteredAvailableShows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No shows found matching "{searchTerm}".
          </div>
        )}

        {!searchTerm && availableShows.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            All shows are already in this universe.
          </div>
        )}
      </div>
    </div>
  );
};

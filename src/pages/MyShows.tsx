
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ShowCard } from '@/components/shows/ShowCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Show {
  id: string;
  title: string;
  description: string | null;
  poster_url: string | null;
  slug: string;
  created_at: string;
}

export const MyShows: React.FC = () => {
  const { user } = useAuth();
  const [myShows, setMyShows] = useState<Show[]>([]);
  const [availableShows, setAvailableShows] = useState<Show[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [myShowsSearchTerm, setMyShowsSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMyShows();
      fetchAvailableShows();
    }
  }, [user]);

  const fetchMyShows = async () => {
    if (!user) return;
    
    try {
      // Get shows that user is tracking
      const { data: trackingData, error: trackingError } = await supabase
        .from('user_show_tracking')
        .select(`
          show_id,
          shows (
            id,
            title,
            description,
            poster_url,
            slug,
            created_at
          )
        `)
        .eq('user_id', user.id);

      if (trackingError) throw trackingError;
      
      const trackedShows = (trackingData || []).map(item => item.shows).filter(Boolean);

      // Get shows where user has watched episodes (auto-track these)
      const { data: episodeData, error: episodeError } = await supabase
        .from('user_episode_status')
        .select(`
          episode_id,
          episodes!inner (
            show_id,
            shows!inner (
              id,
              title,
              description,
              poster_url,
              slug,
              created_at
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'watched');

      if (episodeError) throw episodeError;

      // Extract unique shows from watched episodes
      const watchedShows = new Map();
      (episodeData || []).forEach(item => {
        const show = item.episodes.shows;
        if (show && !watchedShows.has(show.id)) {
          watchedShows.set(show.id, show);
        }
      });

      // Combine tracked shows and shows with watched episodes
      const allMyShows = new Map();
      trackedShows.forEach(show => allMyShows.set(show.id, show));
      watchedShows.forEach((show, id) => allMyShows.set(id, show));

      setMyShows(Array.from(allMyShows.values()));

      // Auto-track shows with watched episodes that aren't already tracked
      const trackedShowIds = new Set(trackedShows.map(show => show.id));
      const showsToAutoTrack = Array.from(watchedShows.values()).filter(
        show => !trackedShowIds.has(show.id)
      );

      if (showsToAutoTrack.length > 0) {
        const trackingInserts = showsToAutoTrack.map(show => ({
          user_id: user.id,
          show_id: show.id
        }));

        await supabase
          .from('user_show_tracking')
          .insert(trackingInserts);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your tracked shows",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableShows = async () => {
    if (!user) return;
    
    try {
      // Get all public shows
      const { data: allShows, error: showsError } = await supabase
        .from('shows')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (showsError) throw showsError;

      // Get shows user is already tracking
      const { data: trackingData, error: trackingError } = await supabase
        .from('user_show_tracking')
        .select('show_id')
        .eq('user_id', user.id);

      if (trackingError) throw trackingError;

      // Get shows where user has watched episodes
      const { data: episodeData, error: episodeError } = await supabase
        .from('user_episode_status')
        .select(`
          episodes!inner (show_id)
        `)
        .eq('user_id', user.id)
        .eq('status', 'watched');

      if (episodeError) throw episodeError;

      const trackedShowIds = new Set((trackingData || []).map(item => item.show_id));
      const watchedShowIds = new Set((episodeData || []).map(item => item.episodes.show_id));
      
      // Combine tracked and watched show IDs
      const myShowIds = new Set([...trackedShowIds, ...watchedShowIds]);
      
      // Filter out shows user is already tracking or has watched episodes of
      const available = (allShows || []).filter(show => !myShowIds.has(show.id));
      setAvailableShows(available);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load available shows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddShow = async (showId: string) => {
    if (!user) return;

    setAdding(showId);
    try {
      const { error } = await supabase
        .from('user_show_tracking')
        .insert({
          user_id: user.id,
          show_id: showId
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Show added to your tracking list!",
      });

      // Refresh both lists
      await Promise.all([fetchMyShows(), fetchAvailableShows()]);
      setSearchTerm('');
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to add show to tracking list",
        variant: "destructive",
      });
    } finally {
      setAdding(null);
    }
  };

  const handleShowSelect = (showId: string) => {
    const show = [...myShows, ...availableShows].find(s => s.id === showId);
    if (show?.slug) {
      navigate(`/show/${show.slug}`);
    }
  };

  // Filter functions
  const filteredMyShows = myShows.filter(show =>
    show.title.toLowerCase().includes(myShowsSearchTerm.toLowerCase())
  );

  const filteredAvailableShows = availableShows.filter(show =>
    show.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-purple-600">Please sign in to view your tracked shows.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading your shows...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 -mx-4 -mt-8 px-4 pt-8">
      <div className="space-y-8">
        {/* My Tracked Shows Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-900">My Tracked Shows</h1>
              <p className="text-purple-700">Shows you're currently tracking</p>
            </div>
            <Button onClick={() => navigate('/admin')} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New Show
            </Button>
          </div>

          {/* Search for My Shows */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
            <Input
              placeholder="Search your tracked shows..."
              value={myShowsSearchTerm}
              onChange={(e) => setMyShowsSearchTerm(e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-400"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMyShows.map((show) => (
              <ShowCard key={show.id} show={show} onSelect={handleShowSelect} />
            ))}
          </div>

          {myShowsSearchTerm && filteredMyShows.length === 0 && (
            <div className="text-center py-8 text-purple-500">
              No tracked shows found matching "{myShowsSearchTerm}".
            </div>
          )}

          {!myShowsSearchTerm && myShows.length === 0 && (
            <div className="text-center py-8 text-purple-500">
              <p>You're not tracking any shows yet.</p>
              <p className="text-sm mt-2">Add shows from the section below to start tracking.</p>
            </div>
          )}
        </div>

        {/* Add Shows Section */}
        <div className="border-t border-purple-200 pt-8 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-purple-900">Add Shows to Track</h2>
            <p className="text-purple-700">Browse and add existing shows to your tracking list</p>
          </div>
          
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-400 h-4 w-4" />
            <Input
              placeholder="Search shows to add..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-purple-200 focus:border-purple-400"
            />
          </div>

          {/* Available Shows */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAvailableShows.map((show) => (
              <div key={show.id} className="relative">
                <ShowCard show={show} onSelect={() => {}} />
                <Button
                  onClick={() => handleAddShow(show.id)}
                  disabled={adding === show.id}
                  className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700"
                  size="sm"
                >
                  {adding === show.id ? (
                    'Adding...'
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Track
                    </>
                  )}
                </Button>
              </div>
            ))}
          </div>

          {searchTerm && filteredAvailableShows.length === 0 && (
            <div className="text-center py-8 text-purple-500">
              No shows found matching "{searchTerm}".
            </div>
          )}

          {!searchTerm && availableShows.length === 0 && (
            <div className="text-center py-8 text-purple-500">
              You're already tracking all available shows!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

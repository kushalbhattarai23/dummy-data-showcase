import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { ShowCard } from '@/components/shows/ShowCard';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
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

export const PublicShows: React.FC = () => {
  const { user } = useAuth();
  const [shows, setShows] = useState<Show[]>([]);
  const [trackedShowIds, setTrackedShowIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicShows();
    if (user) {
      fetchTrackedShows();
    }
  }, [user]);

  const fetchPublicShows = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setShows(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load public shows",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTrackedShows = async () => {
    if (!user) return;
    
    try {
      const { data: trackingData, error } = await supabase
        .from('user_show_tracking')
        .select('show_id')
        .eq('user_id', user.id);

      if (error) throw error;
      
      const trackedIds = new Set((trackingData || []).map(item => item.show_id));
      setTrackedShowIds(trackedIds);
    } catch (error: any) {
      console.error('Error fetching tracked shows:', error);
    }
  };

  const handleAddShow = async (showId: string) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to track shows",
        variant: "destructive",
      });
      return;
    }

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

      // Update tracked shows
      setTrackedShowIds(prev => new Set([...prev, showId]));
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
    const show = shows.find(s => s.id === showId);
    if (show?.slug) {
      navigate(`/show/${show.slug}`);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading shows...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-violet-50 -mx-4 -mt-8 px-4 pt-8">
      <div className="space-y-4 md:space-y-6 p-4 md:p-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-purple-900">Public Shows</h1>
          <p className="text-purple-700 text-sm md:text-base">Browse all public TV shows</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {shows.map((show) => (
            <div key={show.id} className="relative">
              <ShowCard show={show} onSelect={handleShowSelect} />
              {user && !trackedShowIds.has(show.id) && (
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
                      <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                      <span className="hidden sm:inline">Track</span>
                      <span className="sm:hidden">+</span>
                    </>
                  )}
                </Button>
              )}
              {user && trackedShowIds.has(show.id) && (
                <div className="absolute top-2 right-2 bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                  <span className="hidden sm:inline">Tracked</span>
                  <span className="sm:hidden">✓</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {shows.length === 0 && (
          <div className="text-center py-8 text-purple-500">
            <p className="text-sm md:text-base">No public shows found.</p>
          </div>
        )}
      </div>
    </div>
  );
};

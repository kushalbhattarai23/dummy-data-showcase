import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { UniverseCard } from '@/components/universes/UniverseCard';
import { Button } from '@/components/ui/button';
import { Trash2, Eye, EyeOff } from 'lucide-react';
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

export const UniversePage: React.FC = () => {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUniverses();
  }, [user]);

  const fetchUniverses = async () => {
    try {
      const { data, error } = await supabase
        .from('universes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUniverses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load universes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUniverseSelect = (universeId: string) => {
    const universe = universes.find(u => u.id === universeId);
    if (universe?.slug) {
      navigate(`/universe/${universe.slug}`);
    }
  };

  const handleDeleteUniverse = async (universeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to delete a universe",
        variant: "destructive",
      });
      return;
    }

    if (!confirm('Are you sure you want to delete this universe? This action cannot be undone.')) {
      return;
    }

    setDeleting(universeId);
    try {
      // First delete show_universes relationships
      const { error: showUniversesError } = await supabase
        .from('show_universes')
        .delete()
        .eq('universe_id', universeId);

      if (showUniversesError) throw showUniversesError;

      // Then delete the universe
      const { error } = await supabase
        .from('universes')
        .delete()
        .eq('id', universeId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Universe deleted successfully!",
      });

      fetchUniverses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete universe",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleTogglePrivacy = async (universeId: string, currentIsPublic: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to change universe privacy",
        variant: "destructive",
      });
      return;
    }

    setToggling(universeId);
    try {
      const { error } = await supabase
        .from('universes')
        .update({ is_public: !currentIsPublic })
        .eq('id', universeId)
        .eq('creator_id', user.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Universe is now ${!currentIsPublic ? 'public' : 'private'}!`,
      });

      fetchUniverses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update universe privacy",
        variant: "destructive",
      });
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">TV Show Universes</h1>
      <p className="text-gray-600">
        Explore different universes and track your favorite shows and episodes.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {universes.map((universe) => (
          <div key={universe.id} className="relative">
            <UniverseCard universe={universe} onSelect={handleUniverseSelect} />
            {user && user.id === universe.creator_id && (
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  onClick={(e) => handleTogglePrivacy(universe.id, universe.is_public, e)}
                  disabled={toggling === universe.id}
                  size="sm"
                  variant="outline"
                  className="bg-white"
                >
                  {toggling === universe.id ? (
                    '...'
                  ) : universe.is_public ? (
                    <Eye className="h-4 w-4" />
                  ) : (
                    <EyeOff className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={(e) => handleDeleteUniverse(universe.id, e)}
                  disabled={deleting === universe.id}
                  size="sm"
                  variant="destructive"
                >
                  {deleting === universe.id ? (
                    '...'
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {universes.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No universes found.
        </div>
      )}
    </div>
  );
};

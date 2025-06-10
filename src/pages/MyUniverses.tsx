
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { UniverseCard } from '@/components/universes/UniverseCard';
import { CreateUniverseForm } from '@/components/forms/CreateUniverseForm';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface Universe {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  is_public: boolean;
  creator_id: string | null;
}

export const MyUniverses: React.FC = () => {
  const { user } = useAuth();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchMyUniverses();
    }
  }, [user]);

  const fetchMyUniverses = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('universes')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUniverses(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load your universes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMyUniverseSelect = (universeId: string) => {
    const universe = universes.find(u => u.id === universeId);
    if (universe?.slug) {
      navigate(`/universe/${universe.slug}`);
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    fetchMyUniverses();
  };

  const handleDeleteUniverse = async (universeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
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

      fetchMyUniverses();
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

      fetchMyUniverses();
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

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view your universes.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading your universes...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-indigo-900 text-white p-6">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-purple-100">My Universes</h1>
            <p className="text-purple-200">Manage your created universes</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)} className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Universe
          </Button>
        </div>

        {showForm && (
          <div className="bg-purple-800/50 p-6 rounded-lg border border-purple-600">
            <CreateUniverseForm onSuccess={handleFormSuccess} />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {universes.map((universe) => (
            <div key={universe.id} className="relative">
              <UniverseCard key={universe.id} universe={universe} onSelect={handleMyUniverseSelect} />
              <div className="absolute top-2 right-2 flex gap-1">
                <Button
                  onClick={(e) => handleTogglePrivacy(universe.id, universe.is_public, e)}
                  disabled={toggling === universe.id}
                  size="sm"
                  variant="outline"
                  className="bg-white/90 border-purple-400 text-purple-800 hover:bg-white"
                  title={universe.is_public ? 'Make Private' : 'Make Public'}
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
                  title="Delete Universe"
                >
                  {deleting === universe.id ? (
                    '...'
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {universes.length === 0 && !showForm && (
          <div className="text-center py-8 text-purple-200">
            <p>You haven't created any universes yet.</p>
            <Button onClick={() => setShowForm(true)} className="mt-4 bg-purple-600 hover:bg-purple-700">
              Create Your First Universe
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

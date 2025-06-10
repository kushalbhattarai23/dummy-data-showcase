
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UniverseCard } from '@/components/universes/UniverseCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';

interface Universe {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  creator_id: string;
}

export const PublicUniverses: React.FC = () => {
  const { user } = useAuth();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    fetchPublicUniverses();
  }, [user]);

  const fetchPublicUniverses = async () => {
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
        title: 'Error',
        description: 'Failed to load public universes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePublicUniverseSelect = (universeId: string) => {
    const universe = universes.find(u => u.id === universeId);
    if (universe?.slug) {
      navigate(`/universe/${universe.slug}`);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to view public universes.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-center py-8">Loading universes...</div>;
  }

  const myUniverses = universes.filter((u) => u.creator_id === user.id);
  const otherUniverses = universes.filter((u) => u.creator_id !== user.id);

  return (
    <div className="space-y-10 universe-theme">
      <div>
        <h1 className="text-3xl font-bold text-universe-primary">My Public Universes</h1>
        <p className="text-gray-600">Your public TV show universes</p>

        {myUniverses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {myUniverses.map((universe) => (
              <UniverseCard key={universe.id} universe={universe} onSelect={handlePublicUniverseSelect} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            You haven't created any public universes yet.
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-universe-primary">Other Public Universes</h2>
        <p className="text-gray-600">Explore universes created by other users</p>

        {otherUniverses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {otherUniverses.map((universe) => (
              <UniverseCard key={universe.id} universe={universe} onSelect={handlePublicUniverseSelect} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No public universes from other users found.
          </div>
        )}
      </div>
    </div>
  );
};

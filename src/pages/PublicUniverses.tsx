
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UniverseCard } from '@/components/universes/UniverseCard';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

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
  }, []);

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

  if (loading) {
    return <div className="text-center py-8">Loading universes...</div>;
  }

  const myUniverses = user ? universes.filter((u) => u.creator_id === user.id) : [];
  const otherUniverses = user ? universes.filter((u) => u.creator_id !== user.id) : universes;

  return (
    <div className="space-y-10 universe-theme">
      {!user && (
        <div className="text-center py-8 bg-purple-50 rounded-lg border border-purple-200">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">Welcome to TV Show Universes</h2>
          <p className="text-purple-600 mb-6">Discover amazing TV show universes created by our community</p>
          <div className="space-x-4">
            <Link to="/sign-in">
              <Button className="bg-purple-600 hover:bg-purple-700">Sign In</Button>
            </Link>
            <Link to="/sign-up">
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">Sign Up</Button>
            </Link>
          </div>
        </div>
      )}

      {user && myUniverses.length > 0 && (
        <div>
          <h1 className="text-3xl font-bold text-universe-primary">My Public Universes</h1>
          <p className="text-gray-600">Your public TV show universes</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {myUniverses.map((universe) => (
              <UniverseCard key={universe.id} universe={universe} onSelect={handlePublicUniverseSelect} />
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className={`text-2xl font-bold text-universe-primary ${user ? '' : 'text-center'}`}>
          {user ? 'Other Public Universes' : 'Public Universes'}
        </h2>
        <p className={`text-gray-600 ${user ? '' : 'text-center'}`}>
          {user ? 'Explore universes created by other users' : 'Explore amazing TV show universes'}
        </p>

        {otherUniverses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
            {otherUniverses.map((universe) => (
              <UniverseCard key={universe.id} universe={universe} onSelect={handlePublicUniverseSelect} />
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No public universes found.
          </div>
        )}
      </div>
    </div>
  );
};

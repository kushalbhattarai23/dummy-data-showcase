
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UniverseCard } from '@/components/universes/UniverseCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';

interface Universe {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  created_at: string;
  is_public: boolean;
  creator_id: string | null;
}

export const PublicUniverses: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

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
      console.error('Error fetching public universes:', error);
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

  const filteredUniverses = universes.filter(universe =>
    universe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (universe.description && universe.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return <div className="text-center py-8">Loading public universes...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-purple-100">Public Universes</h1>
            <p className="text-purple-200">Explore universes created by the community</p>
          </div>
          {user && (
            <Button onClick={() => navigate('/tracker/universes/my')} className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              My Universes
            </Button>
          )}
        </div>

        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 h-4 w-4" />
          <Input
            placeholder="Search universes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-purple-800/50 border-purple-600 text-white placeholder-purple-300"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUniverses.map((universe) => (
            <UniverseCard key={universe.id} universe={universe} onSelect={handleUniverseSelect} />
          ))}
        </div>

        {filteredUniverses.length === 0 && !loading && (
          <div className="text-center py-8 text-purple-200">
            {searchTerm ? 'No universes found matching your search.' : 'No public universes available yet.'}
          </div>
        )}
      </div>
    </div>
  );
};

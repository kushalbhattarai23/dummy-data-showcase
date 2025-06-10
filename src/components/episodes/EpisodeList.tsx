
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '../auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface Episode {
  id: string;
  episode_number: number;
  season_number: number;
  title: string;
  air_date: string | null;
}

interface EpisodeWithStatus extends Episode {
  user_status?: 'watched' | 'not_watched';
}

interface EpisodeListProps {
  showId: string;
  showTitle: string;
}

export const EpisodeList: React.FC<EpisodeListProps> = ({ showId, showTitle }) => {
  const [episodes, setEpisodes] = useState<EpisodeWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchEpisodes();
  }, [showId, user]);

  const fetchEpisodes = async () => {
    try {
      // Fetch episodes
      const { data: episodesData, error: episodesError } = await supabase
        .from('episodes')
        .select('*')
        .eq('show_id', showId)
        .order('season_number', { ascending: true })
        .order('episode_number', { ascending: true });

      if (episodesError) throw episodesError;

      // If user is logged in, fetch their watch status
      let episodesWithStatus = episodesData || [];
      
      if (user) {
        const { data: statusData, error: statusError } = await supabase
          .from('user_episode_status')
          .select('episode_id, status')
          .eq('user_id', user.id)
          .in('episode_id', episodesData?.map(ep => ep.id) || []);

        if (statusError) throw statusError;

        const statusMap = new Map(statusData?.map(s => [s.episode_id, s.status]) || []);
        
        episodesWithStatus = episodesData?.map(episode => ({
          ...episode,
          user_status: statusMap.get(episode.id) || 'not_watched'
        })) || [];
      }

      setEpisodes(episodesWithStatus);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load episodes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleWatchStatus = async (episodeId: string, currentStatus: 'watched' | 'not_watched') => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to track your watch progress",
      });
      return;
    }

    const newStatus = currentStatus === 'watched' ? 'not_watched' : 'watched';

    try {
      const { error } = await supabase
        .from('user_episode_status')
        .upsert({
          user_id: user.id,
          episode_id: episodeId,
          status: newStatus,
          watched_at: newStatus === 'watched' ? new Date().toISOString() : null,
        });

      if (error) throw error;

      // Update local state
      setEpisodes(prev => prev.map(ep => 
        ep.id === episodeId 
          ? { ...ep, user_status: newStatus }
          : ep
      ));

      toast({
        title: newStatus === 'watched' ? "Marked as watched" : "Marked as not watched",
        description: `Episode status updated successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update episode status",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading episodes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{showTitle} - Episodes</h2>
        <Badge variant="secondary">{episodes.length} episodes</Badge>
      </div>

      <div className="grid gap-4">
        {episodes.map((episode) => (
          <Card key={episode.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>
                  S{episode.season_number}E{episode.episode_number}: {episode.title}
                </span>
                <div className="flex items-center space-x-2">
                  {episode.air_date && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(episode.air_date).toLocaleDateString()}
                    </div>
                  )}
                  {user && (
                    <Button
                      variant={episode.user_status === 'watched' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => toggleWatchStatus(episode.id, episode.user_status || 'not_watched')}
                    >
                      {episode.user_status === 'watched' ? (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Watched
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Not Watched
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
};


import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { useToast } from '@/hooks/use-toast';

interface CreateUniverseFormProps {
  onSuccess?: () => void;
}

export const CreateUniverseForm: React.FC<CreateUniverseFormProps> = ({ onSuccess }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "You must be signed in to create a universe",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('universes')
        .insert({
          name: formData.name,
          description: formData.description || null,
          creator_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Universe created successfully!",
      });

      setFormData({ name: '', description: '' });
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create universe",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Create Universe</CardTitle>
          <CardDescription>Sign in to create your own universe</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">You must be signed in to create a universe.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Universe</CardTitle>
        <CardDescription>Create a new universe to organize your shows</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Universe Name *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Marvel Cinematic Universe"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what this universe contains..."
              rows={3}
            />
          </div>

          <Button type="submit" disabled={loading || !formData.name.trim()}>
            {loading ? 'Creating...' : 'Create Universe'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

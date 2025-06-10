
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export const CreateOrganization: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const createOrganization = useMutation({
    mutationFn: async (data: { name: string; description?: string }) => {
      const { data: result, error } = await supabase
        .from('organizations')
        .insert({
          name: data.name,
          description: data.description,
          creator_id: user?.id
        })
        .select()
        .single();

      if (error) throw error;
      return result;
    },
    onSuccess: (organization) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      toast({
        title: 'Organization created',
        description: 'Your organization has been created successfully.',
      });
      navigate(`/inventory/organizations/${organization.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create organization. Please try again.',
        variant: 'destructive',
      });
      console.error('Error creating organization:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Organization name is required.',
        variant: 'destructive',
      });
      return;
    }
    createOrganization.mutate(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-6">
        <Link to="/inventory" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <h1 className="text-3xl font-bold text-blue-900 mb-2">Create Organization</h1>
        <p className="text-blue-700">Set up a new organization to manage inventory and finances</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            <CardTitle className="text-blue-900">Organization Details</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                name="name"
                type="text"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Enter organization name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe your organization (optional)"
                rows={4}
              />
            </div>

            <div className="flex gap-4 pt-6">
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 flex-1"
                disabled={createOrganization.isPending}
              >
                {createOrganization.isPending ? 'Creating...' : 'Create Organization'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/inventory')}
                className="flex-1"
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

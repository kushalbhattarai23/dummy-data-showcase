import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

export const Categories: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    color: '#3B82F6'
  });

  const { data: categories, isLoading } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createCategory = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('categories')
        .insert({
          name: data.name,
          color: data.color,
          user_id: user.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setIsCreating(false);
      setFormData({ name: '', color: '#3B82F6' });
      toast({ title: 'Success', description: 'Category created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateCategory = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from('categories')
        .update({
          name: data.name,
          color: data.color
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setEditingCategory(null);
      setFormData({ name: '', color: '#3B82F6' });
      toast({ title: 'Success', description: 'Category updated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast({ title: 'Success', description: 'Category deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingCategory) {
      updateCategory.mutate({ ...formData, id: editingCategory.id });
    } else {
      createCategory.mutate(formData);
    }
  };

  const startEdit = (category: any) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      color: category.color
    });
    setIsCreating(true);
  };

  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Categories</h1>
            <p className="text-green-700 mt-2 text-sm sm:text-base">Organize your transactions with categories</p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Summary Card */}
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200 mb-6 sm:mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              <CardTitle className="text-green-800 text-base sm:text-lg">Total Categories</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-4xl font-bold text-green-900">{categories?.length || 0}</div>
            <p className="text-green-700 mt-1 text-sm">Active categories</p>
          </CardContent>
        </Card>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{editingCategory ? 'Edit Category' : 'Create New Category'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">Category Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Food, Transportation"
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="color" className="text-sm">Color</Label>
                    <div className="flex gap-2 items-center">
                      <Input
                        id="color"
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-12 h-8 sm:w-16 sm:h-10 border-2"
                      />
                      <div className="flex gap-1 flex-wrap">
                        {predefinedColors.slice(0, 6).map((color) => (
                          <button
                            key={color}
                            type="button"
                            className="w-5 h-5 sm:w-6 sm:h-6 rounded border-2 border-gray-300 hover:border-gray-500"
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData({ ...formData, color })}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-sm">
                    {editingCategory ? 'Update' : 'Create'} Category
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setEditingCategory(null);
                      setFormData({ name: '', color: '#3B82F6' });
                    }}
                    className="text-sm"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Categories Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-sm sm:text-base">Loading categories...</div>
        ) : categories?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 text-sm sm:text-base">No categories found. Create your first category!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {categories?.map((category) => (
              <Card key={category.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 min-w-0">
                      <div 
                        className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <Link 
                        to={`/finance/categories/${category.id}`}
                        className="font-semibold text-gray-900 text-sm sm:text-base truncate hover:text-green-600 transition-colors"
                      >
                        {category.name}
                      </Link>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(category)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCategory.mutate(category.id)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-500">
                    Created {new Date(category.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Wallet, Plus, Edit, Trash } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { Link } from 'react-router-dom';

export const Wallets: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingWallet, setEditingWallet] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    balance: '',
    currency: 'NPR'
  });

  const { data: wallets, isLoading } = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createWallet = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      const { error } = await supabase
        .from('wallets')
        .insert({
          name: data.name,
          balance: parseFloat(data.balance),
          currency: data.currency,
          user_id: user.id
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setIsCreating(false);
      setFormData({ name: '', balance: '', currency: 'NPR' });
      toast({ title: 'Success', description: 'Wallet created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateWallet = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const { error } = await supabase
        .from('wallets')
        .update({
          name: data.name,
          balance: parseFloat(data.balance),
          currency: data.currency
        })
        .eq('id', data.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setEditingWallet(null);
      setFormData({ name: '', balance: '', currency: 'NPR' });
      toast({ title: 'Success', description: 'Wallet updated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteWallet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('wallets')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Success', description: 'Wallet deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingWallet) {
      updateWallet.mutate({ ...formData, id: editingWallet.id });
    } else {
      createWallet.mutate(formData);
    }
  };

  const startEdit = (wallet: any) => {
    setEditingWallet(wallet);
    setFormData({
      name: wallet.name,
      balance: wallet.balance.toString(),
      currency: wallet.currency
    });
    setIsCreating(true);
  };

  const totalBalance = wallets?.reduce((sum, wallet) => sum + Number(wallet.balance), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Wallets</h1>
            <p className="text-green-700 mt-2 text-sm sm:text-base">Manage your financial accounts</p>
          </div>
          <Button 
            onClick={() => setIsCreating(true)}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Wallet
          </Button>
        </div>

        {/* Total Balance Card */}
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200 mb-6 sm:mb-8">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
              <CardTitle className="text-green-800 text-base sm:text-lg">Total Balance</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-4xl font-bold text-green-900">{formatCurrency(totalBalance)}</div>
            <p className="text-green-700 mt-1 text-sm">Across {wallets?.length || 0} wallets</p>
          </CardContent>
        </Card>

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <CardTitle className="text-base sm:text-lg">{editingWallet ? 'Edit Wallet' : 'Create New Wallet'}</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-sm">Wallet Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g., Checking Account"
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="balance" className="text-sm">Initial Balance</Label>
                    <Input
                      id="balance"
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      placeholder="0.00"
                      required
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency" className="text-sm">Currency</Label>
                    <Input
                      id="currency"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      placeholder="NPR"
                      required
                      className="text-sm"
                    />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 text-sm">
                    {editingWallet ? 'Update' : 'Create'} Wallet
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsCreating(false);
                      setEditingWallet(null);
                      setFormData({ name: '', balance: '', currency: 'NPR' });
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

        {/* Wallets Grid */}
        {isLoading ? (
          <div className="text-center py-8 text-gray-500 text-sm sm:text-base">Loading wallets...</div>
        ) : wallets?.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500 text-sm sm:text-base">No wallets found. Create your first wallet!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {wallets?.map((wallet) => (
              <Card key={wallet.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between mb-4">
                    <Link 
                      to={`/finance/wallets/${wallet.id}`}
                      className="font-semibold text-gray-900 text-base sm:text-lg truncate pr-2 hover:text-green-600 transition-colors"
                    >
                      {wallet.name}
                    </Link>
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(wallet)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteWallet.mutate(wallet.id)}
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(Number(wallet.balance))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-500">
                      Created {new Date(wallet.created_at).toLocaleDateString()}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      {wallet.currency}
                    </span>
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

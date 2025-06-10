import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface TransactionFormData {
  type: 'income' | 'expense';
  reason: string;
  amount: string;
  date: string;
  wallet_id: string;
  category_id: string;
}

interface TransactionFormProps {
  editingTransaction?: any;
  onClose: () => void;
  defaultWalletId?: string;
  defaultCategoryId?: string;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ 
  editingTransaction, 
  onClose,
  defaultWalletId,
  defaultCategoryId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<TransactionFormData>({
    type: 'expense',
    reason: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    wallet_id: '',
    category_id: ''
  });

  // Set default values when component mounts or props change
  useEffect(() => {
    if (editingTransaction) {
      setFormData({
        type: editingTransaction.type,
        reason: editingTransaction.reason,
        amount: (editingTransaction.income || editingTransaction.expense || 0).toString(),
        date: editingTransaction.date,
        wallet_id: editingTransaction.wallet_id,
        category_id: editingTransaction.category_id || 'none'
      });
    } else {
      setFormData(prev => ({
        ...prev,
        wallet_id: defaultWalletId || '',
        category_id: defaultCategoryId || 'none'
      }));
    }
  }, [editingTransaction, defaultWalletId, defaultCategoryId]);

  const { data: wallets } = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!user) throw new Error('User not authenticated');
      
      const transactionData = {
        type: data.type,
        reason: data.reason,
        income: data.type === 'income' ? parseFloat(data.amount) : null,
        expense: data.type === 'expense' ? parseFloat(data.amount) : null,
        date: data.date,
        wallet_id: data.wallet_id,
        category_id: data.category_id === 'none' ? null : data.category_id,
        user_id: user.id
      };

      const { error } = await supabase
        .from('transactions')
        .insert(transactionData);
      if (error) throw error;

      // Update wallet balance manually
      const amount = parseFloat(data.amount);
      const balanceChange = data.type === 'income' ? amount : -amount;
      
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', data.wallet_id)
        .single();
      
      if (wallet) {
        const newBalance = Number(wallet.balance) + balanceChange;
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', data.wallet_id);
        if (walletError) throw walletError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['category-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      onClose();
      toast({ title: 'Success', description: 'Transaction created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateTransaction = useMutation({
    mutationFn: async (data: TransactionFormData) => {
      if (!editingTransaction) throw new Error('No transaction to update');
      
      const transactionData = {
        type: data.type,
        reason: data.reason,
        income: data.type === 'income' ? parseFloat(data.amount) : null,
        expense: data.type === 'expense' ? parseFloat(data.amount) : null,
        date: data.date,
        wallet_id: data.wallet_id,
        category_id: data.category_id === 'none' ? null : data.category_id
      };

      const { error } = await supabase
        .from('transactions')
        .update(transactionData)
        .eq('id', editingTransaction.id);
      if (error) throw error;

      // Calculate balance changes
      const oldAmount = editingTransaction.income || editingTransaction.expense || 0;
      const newAmount = parseFloat(data.amount);
      const oldBalanceChange = editingTransaction.type === 'income' ? -oldAmount : oldAmount;
      const newBalanceChange = data.type === 'income' ? newAmount : -newAmount;
      const totalBalanceChange = oldBalanceChange + newBalanceChange;

      // Update wallet balance manually
      const { data: wallet } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', data.wallet_id)
        .single();
      
      if (wallet) {
        const newBalance = Number(wallet.balance) + totalBalanceChange;
        const { error: walletError } = await supabase
          .from('wallets')
          .update({ balance: newBalance })
          .eq('id', data.wallet_id);
        if (walletError) throw walletError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['category-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      onClose();
      toast({ title: 'Success', description: 'Transaction updated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingTransaction) {
      updateTransaction.mutate(formData);
    } else {
      createTransaction.mutate(formData);
    }
  };

  return (
    <Card className="mb-6 sm:mb-8">
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">
          {editingTransaction ? 'Edit Transaction' : 'Create New Transaction'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="type" className="text-sm">Type</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value: 'income' | 'expense') => setFormData({ ...formData, type: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="reason" className="text-sm">Reason</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="e.g., Salary, Groceries"
                required
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="amount" className="text-sm">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="date" className="text-sm">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
                className="text-sm"
              />
            </div>
            <div>
              <Label htmlFor="wallet" className="text-sm">Wallet</Label>
              <Select 
                value={formData.wallet_id} 
                onValueChange={(value) => setFormData({ ...formData, wallet_id: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select wallet" />
                </SelectTrigger>
                <SelectContent>
                  {wallets?.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="category" className="text-sm">Category (Optional)</Label>
              <Select 
                value={formData.category_id} 
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No category</SelectItem>
                  {categories?.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        {category.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button type="submit" className="bg-green-600 hover:bg-green-700 text-sm">
              {editingTransaction ? 'Update' : 'Create'} Transaction
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="text-sm">
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

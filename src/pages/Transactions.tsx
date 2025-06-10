import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowRightLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TransactionSummaryCards } from '@/components/finance/TransactionSummaryCards';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { TransferForm } from '@/components/finance/TransferForm';
import { ActivityList, Activity, TransactionActivity, TransferActivity } from '@/components/finance/ActivityList';

export const Transactions: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [activeTab, setActiveTab] = useState<'transaction' | 'transfer'>('transaction');
  const [editingTransaction, setEditingTransaction] = useState<any>(null);
  const [editingTransfer, setEditingTransfer] = useState<any>(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    reason: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    wallet_id: '',
    category_id: ''
  });
  const [transferData, setTransferData] = useState({
    from_wallet_id: '',
    to_wallet_id: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const { data: transactions, isLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          wallets(name),
          categories(name, color)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
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
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['transfers', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_wallet:wallets!transfers_from_wallet_id_fkey(name),
          to_wallet:wallets!transfers_to_wallet_id_fkey(name)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const createTransaction = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!user) throw new Error('User not authenticated');
      const amount = parseFloat(data.amount);
      
      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', data.wallet_id)
        .single();

      if (walletError) {
        throw new Error('Failed to get wallet balance');
      }

      // Check if it's an expense and wallet has sufficient balance
      if (data.type === 'expense' && Number(wallet.balance) < amount) {
        throw new Error('Insufficient balance in wallet');
      }

      // Create the transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          type: data.type,
          reason: data.reason,
          income: data.type === 'income' ? amount : null,
          expense: data.type === 'expense' ? amount : null,
          date: data.date,
          wallet_id: data.wallet_id,
          category_id: data.category_id || null,
          user_id: user.id
        });
      
      if (transactionError) throw transactionError;

      // Update wallet balance
      const newBalance = data.type === 'income' 
        ? Number(wallet.balance) + amount 
        : Number(wallet.balance) - amount;

      const { error: balanceError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', data.wallet_id);

      if (balanceError) {
        throw new Error('Failed to update wallet balance');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setIsCreating(false);
      setFormData({
        type: 'expense',
        reason: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        wallet_id: '',
        category_id: ''
      });
      toast({ title: 'Success', description: 'Transaction created successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateTransaction = useMutation({
    mutationFn: async (data: typeof formData & { id: string }) => {
      const amount = parseFloat(data.amount);
      
      // Get the original transaction
      const { data: originalTransaction, error: originalError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', data.id)
        .single();

      if (originalError) {
        throw new Error('Failed to get original transaction');
      }

      // Get wallet balances
      const walletIds = [originalTransaction.wallet_id];
      if (data.wallet_id !== originalTransaction.wallet_id) {
        walletIds.push(data.wallet_id);
      }

      const { data: wallets, error: walletsError } = await supabase
        .from('wallets')
        .select('id, balance')
        .in('id', walletIds);

      if (walletsError) {
        throw new Error('Failed to get wallet balances');
      }

      const walletBalanceMap = wallets.reduce((acc, wallet) => {
        acc[wallet.id] = Number(wallet.balance);
        return acc;
      }, {} as Record<string, number>);

      // Reverse the original transaction effect on the original wallet
      const originalAmount = Number(originalTransaction.income) || Number(originalTransaction.expense) || 0;
      const originalWalletBalance = walletBalanceMap[originalTransaction.wallet_id];
      const restoredBalance = originalTransaction.type === 'income' 
        ? originalWalletBalance - originalAmount 
        : originalWalletBalance + originalAmount;

      // Check if new transaction is valid (for expenses)
      const newWalletBalance = data.wallet_id === originalTransaction.wallet_id ? restoredBalance : walletBalanceMap[data.wallet_id];
      if (data.type === 'expense' && newWalletBalance < amount) {
        throw new Error('Insufficient balance for this transaction');
      }

      // Update the transaction
      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          type: data.type,
          reason: data.reason,
          income: data.type === 'income' ? amount : null,
          expense: data.type === 'expense' ? amount : null,
          date: data.date,
          wallet_id: data.wallet_id,
          category_id: data.category_id || null
        })
        .eq('id', data.id);
      
      if (updateError) throw updateError;

      // Update wallet balances
      const balanceUpdates = [];

      // Restore original wallet balance
      balanceUpdates.push(
        supabase.from('wallets').update({ balance: restoredBalance }).eq('id', originalTransaction.wallet_id)
      );

      // Apply new transaction to target wallet
      const finalBalance = data.type === 'income' 
        ? newWalletBalance + amount 
        : newWalletBalance - amount;
      
      balanceUpdates.push(
        supabase.from('wallets').update({ balance: finalBalance }).eq('id', data.wallet_id)
      );

      const results = await Promise.all(balanceUpdates);
      
      for (const result of results) {
        if (result.error) {
          throw new Error('Failed to update wallet balances');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        reason: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        wallet_id: '',
        category_id: ''
      });
      toast({ title: 'Success', description: 'Transaction updated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      // Get the transaction details first
      const { data: transaction, error: fetchError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw new Error('Failed to get transaction details');
      }

      // Get current wallet balance
      const { data: wallet, error: walletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', transaction.wallet_id)
        .single();

      if (walletError) {
        throw new Error('Failed to get wallet balance');
      }

      // Calculate the amount to reverse
      const amount = Number(transaction.income) || Number(transaction.expense) || 0;
      const newBalance = transaction.type === 'income' 
        ? Number(wallet.balance) - amount 
        : Number(wallet.balance) + amount;

      // Update wallet balance first
      const { error: balanceError } = await supabase
        .from('wallets')
        .update({ balance: newBalance })
        .eq('id', transaction.wallet_id);

      if (balanceError) {
        throw new Error('Failed to restore wallet balance');
      }

      // Delete the transaction
      const { error: deleteError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        // Restore the wallet balance if transaction deletion fails
        await supabase.from('wallets').update({ balance: wallet.balance }).eq('id', transaction.wallet_id);
        throw new Error('Failed to delete transaction');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Success', description: 'Transaction deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const createTransfer = useMutation({
    mutationFn: async (data: typeof transferData) => {
      if (!user) throw new Error('User not authenticated');
      const amount = parseFloat(data.amount);
      
      if (amount <= 0) {
        throw new Error('Transfer amount must be greater than 0');
      }
      
      if (data.from_wallet_id === data.to_wallet_id) {
        throw new Error('Source and destination wallets cannot be the same');
      }

      const { data: fromWallet, error: fromWalletError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', data.from_wallet_id)
        .single();

      if (fromWalletError) {
        throw new Error('Failed to get source wallet balance');
      }

      if (Number(fromWallet.balance) < amount) {
        throw new Error('Insufficient balance in source wallet');
      }

      const { data: transfer, error: transferError } = await supabase
        .from('transfers')
        .insert({
          from_wallet_id: data.from_wallet_id,
          to_wallet_id: data.to_wallet_id,
          amount: amount,
          date: data.date,
          description: data.description || null,
          user_id: user.id,
          status: 'completed'
        })
        .select()
        .single();
      
      if (transferError) {
        throw new Error(`Failed to create transfer: ${transferError.message}`);
      }

      const { error: fromUpdateError } = await supabase
        .from('wallets')
        .update({
          balance: Number(fromWallet.balance) - amount
        })
        .eq('id', data.from_wallet_id);

      if (fromUpdateError) {
        await supabase.from('transfers').delete().eq('id', transfer.id);
        throw new Error('Failed to update source wallet balance');
      }

      const { data: toWallet, error: toWalletFetchError } = await supabase
        .from('wallets')
        .select('balance')
        .eq('id', data.to_wallet_id)
        .single();

      if (toWalletFetchError) {
        await supabase.from('transfers').delete().eq('id', transfer.id);
        await supabase.from('wallets').update({ balance: fromWallet.balance }).eq('id', data.from_wallet_id);
        throw new Error('Failed to get destination wallet balance');
      }

      const { error: toUpdateError } = await supabase
        .from('wallets')
        .update({
          balance: Number(toWallet.balance) + amount
        })
        .eq('id', data.to_wallet_id);

      if (toUpdateError) {
        await supabase.from('transfers').delete().eq('id', transfer.id);
        await supabase.from('wallets').update({ balance: fromWallet.balance }).eq('id', data.from_wallet_id);
        throw new Error('Failed to update destination wallet balance');
      }

      return transfer;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setIsCreating(false);
      setTransferData({
        from_wallet_id: '',
        to_wallet_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      toast({ title: 'Success', description: 'Transfer completed successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const updateTransfer = useMutation({
    mutationFn: async (data: typeof transferData & { id: string }) => {
      const amount = parseFloat(data.amount);
      
      if (amount <= 0) {
        throw new Error('Transfer amount must be greater than 0');
      }
      
      if (data.from_wallet_id === data.to_wallet_id) {
        throw new Error('Source and destination wallets cannot be the same');
      }
      
      const { data: originalTransfer, error: fetchError } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', data.id)
        .single();
      
      if (fetchError) {
        throw new Error('Failed to get original transfer data');
      }

      const { data: walletBalances, error: walletsError } = await supabase
        .from('wallets')
        .select('id, balance')
        .in('id', [originalTransfer.from_wallet_id, originalTransfer.to_wallet_id, data.from_wallet_id, data.to_wallet_id]);

      if (walletsError) {
        throw new Error('Failed to get wallet balances');
      }

      const walletBalanceMap = walletBalances.reduce((acc, wallet) => {
        acc[wallet.id] = Number(wallet.balance);
        return acc;
      }, {} as Record<string, number>);

      const originalFromBalance = walletBalanceMap[originalTransfer.from_wallet_id] + Number(originalTransfer.amount);
      const originalToBalance = walletBalanceMap[originalTransfer.to_wallet_id] - Number(originalTransfer.amount);

      if (originalFromBalance < amount && originalTransfer.from_wallet_id === data.from_wallet_id) {
        throw new Error('Insufficient balance for the updated transfer amount');
      }

      const { error: updateError } = await supabase
        .from('transfers')
        .update({
          from_wallet_id: data.from_wallet_id,
          to_wallet_id: data.to_wallet_id,
          amount: amount,
          date: data.date,
          description: data.description || null
        })
        .eq('id', data.id);
      
      if (updateError) {
        throw new Error('Failed to update transfer record');
      }

      const balanceUpdates = [];

      balanceUpdates.push(
        supabase.from('wallets').update({ balance: originalFromBalance }).eq('id', originalTransfer.from_wallet_id),
        supabase.from('wallets').update({ balance: originalToBalance }).eq('id', originalTransfer.to_wallet_id)
      );

      const newFromBalance = (data.from_wallet_id === originalTransfer.from_wallet_id ? originalFromBalance : walletBalanceMap[data.from_wallet_id]) - amount;
      const newToBalance = (data.to_wallet_id === originalTransfer.to_wallet_id ? originalToBalance : walletBalanceMap[data.to_wallet_id]) + amount;

      balanceUpdates.push(
        supabase.from('wallets').update({ balance: newFromBalance }).eq('id', data.from_wallet_id),
        supabase.from('wallets').update({ balance: newToBalance }).eq('id', data.to_wallet_id)
      );

      const results = await Promise.all(balanceUpdates);
      
      for (const result of results) {
        if (result.error) {
          throw new Error('Failed to update wallet balances');
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      setEditingTransfer(null);
      setTransferData({
        from_wallet_id: '',
        to_wallet_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: ''
      });
      toast({ title: 'Success', description: 'Transfer updated successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const deleteTransfer = useMutation({
    mutationFn: async (id: string) => {
      const { data: transfer, error: fetchError } = await supabase
        .from('transfers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (fetchError) {
        throw new Error('Failed to get transfer details');
      }

      const { data: walletBalances, error: walletsError } = await supabase
        .from('wallets')
        .select('id, balance')
        .in('id', [transfer.from_wallet_id, transfer.to_wallet_id]);

      if (walletsError) {
        throw new Error('Failed to get wallet balances');
      }

      const walletBalanceMap = walletBalances.reduce((acc, wallet) => {
        acc[wallet.id] = Number(wallet.balance);
        return acc;
      }, {} as Record<string, number>);

      const fromWalletNewBalance = walletBalanceMap[transfer.from_wallet_id] + Number(transfer.amount);
      const toWalletNewBalance = walletBalanceMap[transfer.to_wallet_id] - Number(transfer.amount);

      const { error: fromUpdateError } = await supabase
        .from('wallets')
        .update({ balance: fromWalletNewBalance })
        .eq('id', transfer.from_wallet_id);

      if (fromUpdateError) {
        throw new Error('Failed to restore source wallet balance');
      }

      const { error: toUpdateError } = await supabase
        .from('wallets')
        .update({ balance: toWalletNewBalance })
        .eq('id', transfer.to_wallet_id);

      if (toUpdateError) {
        await supabase.from('wallets').update({ balance: walletBalanceMap[transfer.from_wallet_id] }).eq('id', transfer.from_wallet_id);
        throw new Error('Failed to restore destination wallet balance');
      }

      const { error: deleteError } = await supabase
        .from('transfers')
        .delete()
        .eq('id', id);
      
      if (deleteError) {
        await supabase.from('wallets').update({ balance: walletBalanceMap[transfer.from_wallet_id] }).eq('id', transfer.from_wallet_id);
        await supabase.from('wallets').update({ balance: walletBalanceMap[transfer.to_wallet_id] }).eq('id', transfer.to_wallet_id);
        throw new Error('Failed to delete transfer');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Success', description: 'Transfer deleted and wallet balances restored!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'transfer') {
      if (editingTransfer) {
        updateTransfer.mutate({ ...transferData, id: editingTransfer.id });
      } else {
        createTransfer.mutate(transferData);
      }
    } else {
      if (editingTransaction) {
        updateTransaction.mutate({ ...formData, id: editingTransaction.id });
      } else {
        createTransaction.mutate(formData);
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingTransaction(null);
    setEditingTransfer(null);
    setFormData({
      type: 'expense',
      reason: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      wallet_id: '',
      category_id: ''
    });
    setTransferData({
      from_wallet_id: '',
      to_wallet_id: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      description: ''
    });
  };

  const startEditTransaction = (transaction: TransactionActivity) => {
    setEditingTransaction(transaction);
    setActiveTab('transaction');
    setFormData({
      type: transaction.type,
      reason: transaction.reason,
      amount: (transaction.income || transaction.expense)?.toString() || '',
      date: transaction.date,
      wallet_id: transaction.wallet_id,
      category_id: transaction.category_id || ''
    });
    setIsCreating(true);
  };

  const startEditTransfer = (transfer: TransferActivity) => {
    setEditingTransfer(transfer);
    setActiveTab('transfer');
    setTransferData({
      from_wallet_id: transfer.from_wallet_id,
      to_wallet_id: transfer.to_wallet_id,
      amount: transfer.amount.toString(),
      date: transfer.date,
      description: transfer.description || ''
    });
    setIsCreating(true);
  };

  const totalIncome = transactions?.reduce((sum, t) => sum + (Number(t.income) || 0), 0) || 0;
  const totalExpenses = transactions?.reduce((sum, t) => sum + (Number(t.expense) || 0), 0) || 0;

  // Create properly typed combined activities with explicit type casting
  const allActivities: Activity[] = [
    ...(transactions || []).map((t): TransactionActivity => ({ 
      ...t, 
      type: t.type as 'income' | 'expense',
      activityType: 'transaction' as const, 
      sortDate: new Date(t.created_at || t.date) 
    })),
    ...(transfers || []).map((t): TransferActivity => ({ 
      ...t, 
      activityType: 'transfer' as const, 
      sortDate: new Date(t.created_at || t.date) 
    }))
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Transactions</h1>
            <p className="text-green-700 mt-2 text-sm sm:text-base">Track your income, expenses, and transfers</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button 
              onClick={() => {
                setActiveTab('transaction');
                setIsCreating(true);
              }}
              className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Transaction
            </Button>
            <Button 
              onClick={() => {
                setActiveTab('transfer');
                setIsCreating(true);
              }}
              variant="outline"
              className="border-green-300 text-green-600 hover:bg-green-50 flex-1 sm:flex-none"
            >
              <ArrowRightLeft className="w-4 h-4 mr-2" />
              Transfer
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <TransactionSummaryCards 
          totalIncome={totalIncome}
          totalExpenses={totalExpenses}
        />

        {/* Create/Edit Form */}
        {isCreating && (
          <Card className="mb-6 sm:mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base sm:text-lg">
                  {activeTab === 'transfer' 
                    ? (editingTransfer ? 'Edit Transfer' : 'Create New Transfer')
                    : (editingTransaction ? 'Edit Transaction' : 'Create New Transaction')
                  }
                </CardTitle>
                <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                  <Button
                    type="button"
                    variant={activeTab === 'transaction' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('transaction')}
                    className="text-xs"
                  >
                    Transaction
                  </Button>
                  <Button
                    type="button"
                    variant={activeTab === 'transfer' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('transfer')}
                    className="text-xs"
                  >
                    Transfer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'transaction' ? (
                <TransactionForm
                  editingTransaction={editingTransaction}
                  onClose={handleCancel}
                />
              ) : (
                <TransferForm
                  transferData={transferData}
                  setTransferData={setTransferData}
                  wallets={wallets}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  isEditing={!!editingTransfer}
                />
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity List */}
        <ActivityList
          activities={allActivities}
          isLoading={isLoading || transfersLoading}
          onEditTransaction={startEditTransaction}
          onEditTransfer={startEditTransfer}
          onDeleteTransaction={(id) => deleteTransaction.mutate(id)}
          onDeleteTransfer={(id) => deleteTransfer.mutate(id)}
        />
      </div>
    </div>
  );
};

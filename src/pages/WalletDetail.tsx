
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Wallet, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { ActivityList, Activity, TransactionActivity, TransferActivity } from '@/components/finance/ActivityList';

export const WalletDetail: React.FC = () => {
  const { walletId } = useParams<{ walletId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionActivity | null>(null);

  // Fetch wallet details
  const { data: wallet, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet', walletId],
    queryFn: async () => {
      if (!walletId) throw new Error('Wallet ID is required');
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('id', walletId)
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!walletId && !!user,
  });

  // Fetch transactions for this wallet
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['wallet-transactions', walletId],
    queryFn: async () => {
      if (!walletId) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          wallets:wallet_id(name),
          categories:category_id(name, color)
        `)
        .eq('wallet_id', walletId)
        .eq('user_id', user?.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!walletId && !!user,
  });

  // Fetch transfers for this wallet - fixed query
  const { data: transfers, isLoading: transfersLoading } = useQuery({
    queryKey: ['wallet-transfers', walletId],
    queryFn: async () => {
      if (!walletId) return [];
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_wallet:from_wallet_id!inner(name),
          to_wallet:to_wallet_id!inner(name)
        `)
        .or(`from_wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`)
        .eq('user_id', user?.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!walletId && !!user,
  });

  // Delete transaction mutation
  const deleteTransaction = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Success', description: 'Transaction deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Transform data for ActivityList - properly type the transfers
  const activities: Activity[] = [
    ...(transactions?.map(t => ({
      ...t,
      type: t.type as 'income' | 'expense',
      activityType: 'transaction' as const,
      sortDate: new Date(t.date)
    })) || []),
    ...(transfers?.filter(t => 
      t.from_wallet && 
      t.to_wallet && 
      Array.isArray(t.from_wallet) && t.from_wallet.length > 0 &&
      Array.isArray(t.to_wallet) && t.to_wallet.length > 0
    ).map(t => ({
      ...t,
      from_wallet: Array.isArray(t.from_wallet) ? t.from_wallet[0] : t.from_wallet,
      to_wallet: Array.isArray(t.to_wallet) ? t.to_wallet[0] : t.to_wallet,
      activityType: 'transfer' as const,
      sortDate: new Date(t.date)
    })) || [])
  ].sort((a, b) => b.sortDate.getTime() - a.sortDate.getTime());

  const handleEditTransaction = (transaction: TransactionActivity) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction.mutate(id);
  };

  if (walletLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="text-center">Loading wallet details...</div>
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="text-center text-red-600">Wallet not found</div>
        </div>
      </div>
    );
  }

  const totalIncome = transactions?.reduce((sum, t) => sum + (Number(t.income) || 0), 0) || 0;
  const totalExpenses = transactions?.reduce((sum, t) => sum + (Number(t.expense) || 0), 0) || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Link to="/finance/wallets">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Wallets
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold text-green-900">{wallet.name}</h1>
            <p className="text-green-700 mt-2 text-sm sm:text-base">Wallet transactions and activity</p>
          </div>
          <Button 
            onClick={() => setShowTransactionForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                <CardTitle className="text-green-800 text-base sm:text-lg">Current Balance</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-4xl font-bold text-green-900">{formatCurrency(Number(wallet.balance))}</div>
              <p className="text-green-700 mt-1 text-sm">{wallet.currency}</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-green-700 text-base sm:text-lg">Total Income</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(totalIncome)}</div>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-700 text-base sm:text-lg">Total Expenses</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xl sm:text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction Form */}
        {showTransactionForm && (
          <TransactionForm
            editingTransaction={editingTransaction}
            onClose={() => {
              setShowTransactionForm(false);
              setEditingTransaction(null);
            }}
            defaultWalletId={walletId}
          />
        )}

        {/* Activity List */}
        <ActivityList
          activities={activities}
          isLoading={transactionsLoading || transfersLoading}
          onEditTransaction={handleEditTransaction}
          onEditTransfer={() => {}} // No transfer editing from wallet detail
          onDeleteTransaction={handleDeleteTransaction}
          onDeleteTransfer={() => {}} // No transfer deletion from wallet detail
        />
      </div>
    </div>
  );
};

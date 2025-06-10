
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Tag, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/currency';
import { TransactionForm } from '@/components/finance/TransactionForm';
import { ActivityList, Activity, TransactionActivity } from '@/components/finance/ActivityList';

export const CategoryDetail: React.FC = () => {
  const { categoryId } = useParams<{ categoryId: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionActivity | null>(null);

  // Fetch category details
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: async () => {
      if (!categoryId) throw new Error('Category ID is required');
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('id', categoryId)
        .eq('user_id', user?.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId && !!user,
  });

  // Fetch transactions for this category
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ['category-transactions', categoryId],
    queryFn: async () => {
      if (!categoryId) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          wallets:wallet_id(name),
          categories:category_id(name, color)
        `)
        .eq('category_id', categoryId)
        .eq('user_id', user?.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!categoryId && !!user,
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
      queryClient.invalidateQueries({ queryKey: ['category-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      toast({ title: 'Success', description: 'Transaction deleted successfully!' });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  // Transform data for ActivityList
  const activities: Activity[] = transactions?.map(t => ({
    ...t,
    type: t.type as 'income' | 'expense',
    activityType: 'transaction' as const,
    sortDate: new Date(t.date)
  })) || [];

  const handleEditTransaction = (transaction: TransactionActivity) => {
    setEditingTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleDeleteTransaction = (id: string) => {
    deleteTransaction.mutate(id);
  };

  if (categoryLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="text-center">Loading category details...</div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
          <div className="text-center text-red-600">Category not found</div>
        </div>
      </div>
    );
  }

  const totalIncome = transactions?.reduce((sum, t) => sum + (Number(t.income) || 0), 0) || 0;
  const totalExpenses = transactions?.reduce((sum, t) => sum + (Number(t.expense) || 0), 0) || 0;
  const transactionCount = transactions?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <Link to="/finance/categories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Categories
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <div 
                className="w-4 h-4 sm:w-5 sm:h-5 rounded-full"
                style={{ backgroundColor: category.color }}
              />
              <h1 className="text-2xl sm:text-3xl font-bold text-green-900">{category.name}</h1>
            </div>
            <p className="text-green-700 mt-2 text-sm sm:text-base">Category transactions and activity</p>
          </div>
          <Button 
            onClick={() => setShowTransactionForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Transaction
          </Button>
        </div>

        {/* Category Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Tag className="w-5 h-5 sm:w-6 sm:h-6 text-green-700" />
                <CardTitle className="text-green-800 text-base sm:text-lg">Total Transactions</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl sm:text-4xl font-bold text-green-900">{transactionCount}</div>
              <p className="text-green-700 mt-1 text-sm">In this category</p>
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
            defaultCategoryId={categoryId}
          />
        )}

        {/* Activity List */}
        <ActivityList
          activities={activities}
          isLoading={transactionsLoading}
          onEditTransaction={handleEditTransaction}
          onEditTransfer={() => {}} // No transfers for categories
          onDeleteTransaction={handleDeleteTransaction}
          onDeleteTransfer={() => {}} // No transfers for categories
        />
      </div>
    </div>
  );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, TrendingDown, Wallet, Plus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ExpenseChart } from '@/components/finance/ExpenseChart';
import { IncomeChart } from '@/components/finance/IncomeChart';
import { RecentTransactions } from '@/components/finance/RecentTransactions';
import { formatCurrency } from '@/lib/currency';
import { CSVImportExport } from '@/components/finance/CSVImportExport';

// Updated interface to match database schema
interface DatabaseTransaction {
  id: string;
  type: string; // Database returns string, not restricted type
  reason: string;
  income: number | null;
  expense: number | null;
  date: string;
  category_id: string | null;
  user_id: string;
  wallet_id: string;
  created_at: string;
}

export const FinanceDashboard: React.FC = () => {
  const { user } = useAuth();

  console.log('FinanceDashboard: Current user:', user?.id);

  const { data: wallets, isLoading: walletsLoading, error: walletsError } = useQuery({
    queryKey: ['wallets', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('FinanceDashboard: No user for wallets, returning empty array');
        return [];
      }
      console.log('FinanceDashboard: Fetching wallets for user:', user.id);
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      
      if (error) {
        console.error('FinanceDashboard: Wallets fetch error:', error);
        throw error;
      }
      console.log('FinanceDashboard: Wallets data:', data);
      return data;
    },
    enabled: !!user,
  });

  const { data: databaseTransactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log('FinanceDashboard: No user for transactions, returning empty array');
        return [];
      }
      console.log('FinanceDashboard: Fetching transactions for user:', user.id);
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .limit(10);
      
      if (error) {
        console.error('FinanceDashboard: Transactions fetch error:', error);
        throw error;
      }
      console.log('FinanceDashboard: Transactions data:', data);
      return data as DatabaseTransaction[];
    },
    enabled: !!user,
  });

  // Transform database transactions to component format
  const transactions = databaseTransactions?.map(t => ({
    id: t.id,
    type: t.type === 'income' ? 'income' as const : 'expense' as const,
    reason: t.reason,
    income: t.income || undefined,
    expense: t.expense || undefined,
    date: t.date,
  })) || [];

  const totalBalance = wallets?.reduce((sum, wallet) => sum + Number(wallet.balance || 0), 0) || 0;
  const totalIncome = databaseTransactions?.reduce((sum, t) => sum + (Number(t.income) || 0), 0) || 0;
  const totalExpenses = databaseTransactions?.reduce((sum, t) => sum + (Number(t.expense) || 0), 0) || 0;
  const netWorth = totalIncome - totalExpenses;

  console.log('FinanceDashboard: Calculated totals:', {
    totalBalance,
    totalIncome,
    totalExpenses,
    netWorth
  });

  // Show loading state
  if (walletsLoading || transactionsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="text-center">Loading your financial data...</div>
        </div>
      </div>
    );
  }

  // Show error state
  if (walletsError || transactionsError) {
    const error = walletsError || transactionsError;
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
          <div className="text-center text-red-600">
            Error loading data: {error?.message}
            <br />
            <small>Check console for more details</small>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
      {/* Header */}
      <div className="bg-green-600 text-white py-4 sm:py-8">
        <div className="container mx-auto px-2 sm:px-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 sm:gap-3 mb-2">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Finance Dashboard</h1>
              </div>
              <p className="text-green-100 text-sm sm:text-base">Manage your finances and track expenses</p>
            </div>
            <Link to="/finance/transactions">
              <Button className="bg-white text-green-600 hover:bg-green-50 w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                New Transaction
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-gradient-to-r from-green-100 to-emerald-100 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700">Total Balance</CardTitle>
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-900">{formatCurrency(totalBalance)}</div>
              <p className="text-xs text-green-600 mt-1">{wallets?.length || 0} wallets</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700">Income</CardTitle>
              <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-900">{formatCurrency(totalIncome)}</div>
              <p className="text-xs text-green-600 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-red-700">Expenses</CardTitle>
              <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</div>
              <p className="text-xs text-red-600 mt-1">This month</p>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium text-green-700">Net Worth</CardTitle>
              <Wallet className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-lg sm:text-2xl font-bold text-green-900">{formatCurrency(netWorth)}</div>
              <p className="text-xs text-green-600 mt-1">Income - Expenses</p>
            </CardContent>
          </Card>
        </div>

        {/* CSV Import/Export Section */}
        <div className="mb-6 sm:mb-8">
          <CSVImportExport />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <ExpenseChart />
          <IncomeChart />
        </div>

        {/* Recent Activity */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          <RecentTransactions transactions={transactions} />
        </div>
      </div>
    </div>
  );
};

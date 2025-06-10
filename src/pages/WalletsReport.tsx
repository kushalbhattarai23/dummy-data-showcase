import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis } from 'recharts';
import { formatCurrency } from '@/lib/currency';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export const WalletsReport: React.FC = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    quickFilter: 'This Month'
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets-report', user?.id],
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

  const { data: transactions } = useQuery({
    queryKey: ['wallet-transactions-report', user?.id, dateFilter],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          wallets(name)
        `)
        .eq('user_id', user.id)
        .gte('date', dateFilter.fromDate)
        .lte('date', dateFilter.toDate);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers } = useQuery({
    queryKey: ['wallet-transfers-report', user?.id, dateFilter],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_wallet:from_wallet_id!inner(name),
          to_wallet:to_wallet_id!inner(name)
        `)
        .eq('user_id', user.id)
        .gte('date', dateFilter.fromDate)
        .lte('date', dateFilter.toDate);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const walletAnalysis = useMemo(() => {
    if (!wallets || !transactions || !transfers) return [];

    const walletMap = new Map();
    
    // Initialize wallets
    wallets.forEach(wallet => {
      walletMap.set(wallet.id, {
        id: wallet.id,
        name: wallet.name,
        currentBalance: Number(wallet.balance),
        income: 0,
        expense: 0,
        transfersIn: 0,
        transfersOut: 0,
        transactionCount: 0,
        transferCount: 0
      });
    });

    // Process transactions
    transactions.forEach(transaction => {
      const wallet = walletMap.get(transaction.wallet_id);
      if (wallet) {
        if (transaction.type === 'income') {
          wallet.income += Number(transaction.income || 0);
        } else {
          wallet.expense += Number(transaction.expense || 0);
        }
        wallet.transactionCount++;
      }
    });

    // Process transfers
    transfers.forEach(transfer => {
      const fromWallet = walletMap.get(transfer.from_wallet_id);
      const toWallet = walletMap.get(transfer.to_wallet_id);
      
      if (fromWallet) {
        fromWallet.transfersOut += Number(transfer.amount);
        fromWallet.transferCount++;
      }
      
      if (toWallet) {
        toWallet.transfersIn += Number(transfer.amount);
        toWallet.transferCount++;
      }
    });

    return Array.from(walletMap.values());
  }, [wallets, transactions, transfers]);

  const setQuickFilter = (filter: string) => {
    const today = new Date();
    let fromDate = '';
    let toDate = today.toISOString().split('T')[0];

    switch (filter) {
      case 'This Week':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        fromDate = startOfWeek.toISOString().split('T')[0];
        break;
      case 'This Month':
        fromDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        break;
      case 'This Year':
        fromDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
    }

    setDateFilter({ fromDate, toDate, quickFilter: filter });
  };

  const totalBalance = walletAnalysis.reduce((sum, wallet) => sum + wallet.currentBalance, 0);
  const totalIncome = walletAnalysis.reduce((sum, wallet) => sum + wallet.income, 0);
  const totalExpense = walletAnalysis.reduce((sum, wallet) => sum + wallet.expense, 0);

  const chartConfig = {
    balance: {
      label: 'Balance',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Wallets Report</h1>
        <p className="text-green-700 mt-2 text-sm sm:text-base">
          Analyze wallet balances and activity
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {['This Week', 'This Month', 'This Year'].map((filter) => (
                <Button
                  key={filter}
                  variant={dateFilter.quickFilter === filter ? 'default' : 'outline'}
                  onClick={() => setQuickFilter(filter)}
                  className={dateFilter.quickFilter === filter ? 'bg-green-600 hover:bg-green-700' : ''}
                >
                  {filter}
                </Button>
              ))}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <Label htmlFor="fromDate">From Date</Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={dateFilter.fromDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, fromDate: e.target.value, quickFilter: '' })}
                />
              </div>
              <div>
                <Label htmlFor="toDate">To Date</Label>
                <Input
                  id="toDate"
                  type="date"
                  value={dateFilter.toDate}
                  onChange={(e) => setDateFilter({ ...dateFilter, toDate: e.target.value, quickFilter: '' })}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
          <CardHeader className="text-center">
            <CardTitle className="text-green-800">Total Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totalBalance)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100">
          <CardHeader className="text-center">
            <CardTitle className="text-blue-800">Period Income</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-blue-600">{formatCurrency(totalIncome)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-100 to-pink-100">
          <CardHeader className="text-center">
            <CardTitle className="text-red-800">Period Expenses</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-red-600">{formatCurrency(totalExpense)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Balance Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Balance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {walletAnalysis.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={walletAnalysis}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="currentBalance"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {walletAnalysis.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [formatCurrency(Number(value)), 'Balance']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No wallet data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Activity Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Wallet Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {walletAnalysis.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={walletAnalysis} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'income' ? 'Income' : name === 'expense' ? 'Expense' : 'Transactions'
                      ]}
                    />
                    <Bar dataKey="income" fill="#22c55e" name="income" />
                    <Bar dataKey="expense" fill="#ef4444" name="expense" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No activity data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Wallet Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Wallet</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Balance</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Income</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Expense</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Transfers In</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Transfers Out</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Activity</th>
                </tr>
              </thead>
              <tbody>
                {walletAnalysis.map((wallet) => (
                  <tr key={wallet.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{wallet.name}</td>
                    <td className="py-3 px-4 text-right font-medium">
                      {formatCurrency(wallet.currentBalance)}
                    </td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {formatCurrency(wallet.income)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatCurrency(wallet.expense)}
                    </td>
                    <td className="py-3 px-4 text-right text-blue-600">
                      {formatCurrency(wallet.transfersIn)}
                    </td>
                    <td className="py-3 px-4 text-right text-orange-600">
                      {formatCurrency(wallet.transfersOut)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {wallet.transactionCount + wallet.transferCount} activities
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {walletAnalysis.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No wallet data found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

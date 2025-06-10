import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatCurrency } from '@/lib/currency';

export const TransactionsReport: React.FC = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    quickFilter: 'This Month'
  });
  const [walletFilter, setWalletFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const { data: transactions } = useQuery({
    queryKey: ['transactions-detailed-report', user?.id, dateFilter, walletFilter, typeFilter],
    queryFn: async () => {
      if (!user) return [];
      
      let query = supabase
        .from('transactions')
        .select(`
          *,
          wallets(name),
          categories(name, color)
        `)
        .eq('user_id', user.id)
        .gte('date', dateFilter.fromDate)
        .lte('date', dateFilter.toDate)
        .order('date', { ascending: true });

      if (walletFilter !== 'all') {
        query = query.eq('wallet_id', walletFilter);
      }

      if (typeFilter !== 'all') {
        query = query.eq('type', typeFilter);
      }

      const { data, error } = await query;
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

  const dailyData = useMemo(() => {
    if (!transactions) return [];

    const dailyMap = new Map();
    
    transactions.forEach(transaction => {
      const date = transaction.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          income: 0,
          expense: 0,
          count: 0
        });
      }
      
      const day = dailyMap.get(date);
      if (transaction.type === 'income') {
        day.income += Number(transaction.income || 0);
      } else {
        day.expense += Number(transaction.expense || 0);
      }
      day.count++;
    });

    return Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [transactions]);

  const transactionStats = useMemo(() => {
    if (!transactions) return {
      totalIncome: 0,
      totalExpense: 0,
      avgTransaction: 0,
      transactionCount: 0,
      largestIncome: 0,
      largestExpense: 0
    };

    const income = transactions.filter(t => t.type === 'income');
    const expense = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = income.reduce((sum, t) => sum + Number(t.income || 0), 0);
    const totalExpense = expense.reduce((sum, t) => sum + Number(t.expense || 0), 0);
    
    return {
      totalIncome,
      totalExpense,
      avgTransaction: transactions.length > 0 ? (totalIncome + totalExpense) / transactions.length : 0,
      transactionCount: transactions.length,
      largestIncome: income.length > 0 ? Math.max(...income.map(t => Number(t.income || 0))) : 0,
      largestExpense: expense.length > 0 ? Math.max(...expense.map(t => Number(t.expense || 0))) : 0
    };
  }, [transactions]);

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

  const chartConfig = {
    income: {
      label: 'Income',
      color: '#22c55e',
    },
    expense: {
      label: 'Expense',
      color: '#ef4444',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Transactions Report</h1>
        <p className="text-green-700 mt-2 text-sm sm:text-base">
          Detailed analysis of your transaction patterns
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Filters</CardTitle>
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
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div>
                <Label htmlFor="wallet">Wallet</Label>
                <Select value={walletFilter} onValueChange={setWalletFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Wallets" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Wallets</SelectItem>
                    {wallets?.map((wallet) => (
                      <SelectItem key={wallet.id} value={wallet.id}>
                        {wallet.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-sm">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(transactionStats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-100 to-pink-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm">Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(transactionStats.totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-sm">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {transactionStats.transactionCount}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-100 to-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-800 text-sm">Avg Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(transactionStats.avgTransaction)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Daily Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Daily Transaction Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyData}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'income' ? 'Income' : 'Expense'
                      ]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={2} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Daily Volume */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Daily Transaction Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyData}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [value, 'Transactions']}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No transaction data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Reason</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Wallet</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Amount</th>
                </tr>
              </thead>
              <tbody>
                {transactions?.slice(0, 20).map((transaction) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        transaction.type === 'income' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {transaction.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">{transaction.reason}</td>
                    <td className="py-3 px-4 text-sm">{transaction.wallets?.name}</td>
                    <td className="py-3 px-4 text-sm">
                      {transaction.categories?.name || 'Uncategorized'}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(Number(transaction.income || transaction.expense || 0))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No transactions found for the selected filters.
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
};

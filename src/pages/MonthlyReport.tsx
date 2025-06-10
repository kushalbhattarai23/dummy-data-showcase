import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { formatCurrency } from '@/lib/currency';

const COLORS = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

export const MonthlyReport: React.FC = () => {
  const { user } = useAuth();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );

  const { data: transactions } = useQuery({
    queryKey: ['monthly-report-transactions', user?.id, selectedMonth],
    queryFn: async () => {
      if (!user) return [];
      
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          wallets(name),
          categories(name, color)
        `)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers } = useQuery({
    queryKey: ['monthly-report-transfers', user?.id, selectedMonth],
    queryFn: async () => {
      if (!user) return [];
      
      const [year, month] = selectedMonth.split('-');
      const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      const endDate = new Date(parseInt(year), parseInt(month), 0);
      
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_wallet:from_wallet_id!inner(name),
          to_wallet:to_wallet_id!inner(name)
        `)
        .eq('user_id', user.id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0]);
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const monthlyStats = useMemo(() => {
    if (!transactions) return {
      totalIncome: 0,
      totalExpense: 0,
      netIncome: 0,
      transactionCount: 0,
      avgTransactionSize: 0,
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
      netIncome: totalIncome - totalExpense,
      transactionCount: transactions.length,
      avgTransactionSize: transactions.length > 0 ? (totalIncome + totalExpense) / transactions.length : 0,
      largestIncome: income.length > 0 ? Math.max(...income.map(t => Number(t.income || 0))) : 0,
      largestExpense: expense.length > 0 ? Math.max(...expense.map(t => Number(t.expense || 0))) : 0
    };
  }, [transactions]);

  const categoryBreakdown = useMemo(() => {
    if (!transactions) return [];

    const categoryMap = new Map();
    
    transactions.forEach(transaction => {
      const categoryName = transaction.categories?.name || 'Uncategorized';
      const amount = Number(transaction.income || transaction.expense || 0);
      
      if (!categoryMap.has(categoryName)) {
        categoryMap.set(categoryName, {
          name: categoryName,
          income: 0,
          expense: 0,
          total: 0,
          count: 0,
          color: transaction.categories?.color || '#6B7280'
        });
      }
      
      const category = categoryMap.get(categoryName);
      if (transaction.type === 'income') {
        category.income += amount;
      } else {
        category.expense += amount;
      }
      category.total += amount;
      category.count++;
    });

    return Array.from(categoryMap.values()).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const dailyBreakdown = useMemo(() => {
    if (!transactions) return [];

    const dailyMap = new Map();
    
    transactions.forEach(transaction => {
      const date = transaction.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          day: new Date(date).getDate(),
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

    return Array.from(dailyMap.values()).sort((a, b) => a.day - b.day);
  }, [transactions]);

  const walletActivity = useMemo(() => {
    if (!transactions) return [];

    const walletMap = new Map();
    
    transactions.forEach(transaction => {
      const walletName = transaction.wallets?.name || 'Unknown';
      if (!walletMap.has(walletName)) {
        walletMap.set(walletName, {
          name: walletName,
          income: 0,
          expense: 0,
          count: 0
        });
      }
      
      const wallet = walletMap.get(walletName);
      if (transaction.type === 'income') {
        wallet.income += Number(transaction.income || 0);
      } else {
        wallet.expense += Number(transaction.expense || 0);
      }
      wallet.count++;
    });

    return Array.from(walletMap.values()).sort((a, b) => (b.income + b.expense) - (a.income + a.expense));
  }, [transactions]);

  // Generate month options for the last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const today = new Date();
    
    for (let i = 0; i < 12; i++) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    
    return options;
  }, []);

  const selectedMonthName = monthOptions.find(opt => opt.value === selectedMonth)?.label || '';

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Monthly Report</h1>
          <p className="text-green-700 mt-2 text-sm sm:text-base">
            Detailed breakdown for {selectedMonthName}
          </p>
        </div>
        
        <div className="w-full sm:w-auto">
          <Label htmlFor="month-select">Select Month</Label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-sm">Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(monthlyStats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-100 to-pink-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm">Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(monthlyStats.totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-sm">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${monthlyStats.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(monthlyStats.netIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-100 to-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-800 text-sm">Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {monthlyStats.transactionCount}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Daily Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyBreakdown.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyBreakdown}>
                    <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'income' ? 'Income' : 'Expense'
                      ]}
                    />
                    <Bar dataKey="income" fill="#22c55e" />
                    <Bar dataKey="expense" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No transactions this month
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryBreakdown.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius="80%"
                      fill="#8884d8"
                      dataKey="total"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Category Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Category Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-gray-700 text-sm">Category</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700 text-sm">Income</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700 text-sm">Expense</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700 text-sm">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryBreakdown.map((category) => (
                    <tr key={category.name} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </td>
                      <td className="py-2 px-2 text-right text-green-600 text-sm">
                        {formatCurrency(category.income)}
                      </td>
                      <td className="py-2 px-2 text-right text-red-600 text-sm">
                        {formatCurrency(category.expense)}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600 text-sm">
                        {category.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Wallet Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Wallet Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 font-medium text-gray-700 text-sm">Wallet</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700 text-sm">Income</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700 text-sm">Expense</th>
                    <th className="text-right py-2 px-2 font-medium text-gray-700 text-sm">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {walletActivity.map((wallet) => (
                    <tr key={wallet.name} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-medium text-sm">{wallet.name}</td>
                      <td className="py-2 px-2 text-right text-green-600 text-sm">
                        {formatCurrency(wallet.income)}
                      </td>
                      <td className="py-2 px-2 text-right text-red-600 text-sm">
                        {formatCurrency(wallet.expense)}
                      </td>
                      <td className="py-2 px-2 text-right text-gray-600 text-sm">
                        {wallet.count}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transfer Summary */}
      {transfers && transfers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Transfers This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {transfers.length}
                </div>
                <div className="text-sm text-gray-600">Total Transfers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(transfers.reduce((sum, t) => sum + Number(t.amount), 0))}
                </div>
                <div className="text-sm text-gray-600">Total Amount</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {formatCurrency(transfers.reduce((sum, t) => sum + Number(t.amount), 0) / transfers.length)}
                </div>
                <div className="text-sm text-gray-600">Average Transfer</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatCurrency } from '@/lib/currency';

export const IncomeExpenseReport: React.FC = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0], // Start of year
    toDate: new Date().toISOString().split('T')[0],
    quickFilter: 'This Year'
  });

  const { data: transactions } = useQuery({
    queryKey: ['income-expense-report', user?.id, dateFilter],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', dateFilter.fromDate)
        .lte('date', dateFilter.toDate)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const monthlyData = useMemo(() => {
    if (!transactions) return [];

    const monthlyMap = new Map();
    
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyMap.has(monthKey)) {
        monthlyMap.set(monthKey, {
          month: monthKey,
          monthName: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
          income: 0,
          expense: 0,
          net: 0,
          incomeCount: 0,
          expenseCount: 0
        });
      }
      
      const monthData = monthlyMap.get(monthKey);
      if (transaction.type === 'income') {
        monthData.income += Number(transaction.income || 0);
        monthData.incomeCount++;
      } else {
        monthData.expense += Number(transaction.expense || 0);
        monthData.expenseCount++;
      }
      monthData.net = monthData.income - monthData.expense;
    });

    return Array.from(monthlyMap.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [transactions]);

  const cumulativeData = useMemo(() => {
    let cumulativeIncome = 0;
    let cumulativeExpense = 0;
    
    return monthlyData.map(month => {
      cumulativeIncome += month.income;
      cumulativeExpense += month.expense;
      
      return {
        ...month,
        cumulativeIncome,
        cumulativeExpense,
        cumulativeNet: cumulativeIncome - cumulativeExpense
      };
    });
  }, [monthlyData]);

  const totals = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpense: 0, netIncome: 0, avgMonthlyIncome: 0, avgMonthlyExpense: 0 };

    const totalIncome = transactions.reduce((sum, t) => sum + (Number(t.income) || 0), 0);
    const totalExpense = transactions.reduce((sum, t) => sum + (Number(t.expense) || 0), 0);
    const netIncome = totalIncome - totalExpense;
    
    const monthsCount = monthlyData.length || 1;
    
    return {
      totalIncome,
      totalExpense,
      netIncome,
      avgMonthlyIncome: totalIncome / monthsCount,
      avgMonthlyExpense: totalExpense / monthsCount
    };
  }, [transactions, monthlyData]);

  const setQuickFilter = (filter: string) => {
    const today = new Date();
    let fromDate = '';
    let toDate = today.toISOString().split('T')[0];

    switch (filter) {
      case 'Last 3 Months':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 2, 1).toISOString().split('T')[0];
        break;
      case 'Last 6 Months':
        fromDate = new Date(today.getFullYear(), today.getMonth() - 5, 1).toISOString().split('T')[0];
        break;
      case 'This Year':
        fromDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
        break;
      case 'Last Year':
        fromDate = new Date(today.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        toDate = new Date(today.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
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
    net: {
      label: 'Net',
      color: '#3b82f6',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Income vs Expense Report</h1>
        <p className="text-green-700 mt-2 text-sm sm:text-base">
          Track your income and expense trends over time
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Time Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2 flex-wrap">
              {['Last 3 Months', 'Last 6 Months', 'This Year', 'Last Year'].map((filter) => (
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-sm">Total Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {formatCurrency(totals.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-100 to-pink-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm">Total Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-red-600">
              {formatCurrency(totals.totalExpense)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-sm">Net Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${totals.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.netIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-100 to-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-800 text-sm">Avg Monthly Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">
              {formatCurrency(totals.avgMonthlyIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-100 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-sm">Avg Monthly Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              {formatCurrency(totals.avgMonthlyExpense)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Monthly Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData}>
                    <XAxis dataKey="monthName" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'income' ? 'Income' : name === 'expense' ? 'Expense' : 'Net'
                      ]}
                    />
                    <Line type="monotone" dataKey="income" stroke="#22c55e" strokeWidth={3} />
                    <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} />
                    <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                No data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cumulative Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Cumulative Income vs Expense</CardTitle>
          </CardHeader>
          <CardContent>
            {cumulativeData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulativeData}>
                    <XAxis dataKey="monthName" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'cumulativeIncome' ? 'Cumulative Income' : 
                        name === 'cumulativeExpense' ? 'Cumulative Expense' : 'Cumulative Net'
                      ]}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeIncome" 
                      stackId="1"
                      stroke="#22c55e" 
                      fill="#22c55e" 
                      fillOpacity={0.3}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulativeExpense" 
                      stackId="2"
                      stroke="#ef4444" 
                      fill="#ef4444" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-gray-500">
                No data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Breakdown Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Month</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Income</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Expense</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Net</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Transactions</th>
                </tr>
              </thead>
              <tbody>
                {monthlyData.map((month) => (
                  <tr key={month.month} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{month.monthName}</td>
                    <td className="py-3 px-4 text-right text-green-600 font-medium">
                      {formatCurrency(month.income)}
                    </td>
                    <td className="py-3 px-4 text-right text-red-600 font-medium">
                      {formatCurrency(month.expense)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      month.net >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(month.net)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {month.incomeCount + month.expenseCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {monthlyData.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No data found for the selected time period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export const CategoriesReport: React.FC = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    quickFilter: 'This Month'
  });

  const { data: transactions } = useQuery({
    queryKey: ['transactions-report', user?.id, dateFilter],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          categories(name, color)
        `)
        .eq('user_id', user.id)
        .gte('date', dateFilter.fromDate)
        .lte('date', dateFilter.toDate);
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

  const categoryReport = useMemo(() => {
    if (!transactions || !categories) return [];

    const categoryMap = new Map();
    
    // Initialize all categories
    categories.forEach(category => {
      categoryMap.set(category.id, {
        id: category.id,
        name: category.name,
        color: category.color,
        income: 0,
        expense: 0,
        netAmount: 0
      });
    });

    // Add uncategorized
    categoryMap.set('uncategorized', {
      id: 'uncategorized',
      name: 'Uncategorized',
      color: '#6B7280',
      income: 0,
      expense: 0,
      netAmount: 0
    });

    // Process transactions
    transactions.forEach(transaction => {
      const categoryId = transaction.category_id || 'uncategorized';
      const category = categoryMap.get(categoryId);
      
      if (category) {
        if (transaction.type === 'income') {
          category.income += Number(transaction.income || 0);
        } else {
          category.expense += Number(transaction.expense || 0);
        }
        category.netAmount = category.income - category.expense;
      }
    });

    return Array.from(categoryMap.values()).filter(cat => cat.income > 0 || cat.expense > 0);
  }, [transactions, categories]);

  const totals = useMemo(() => {
    const totalIncome = categoryReport.reduce((sum, cat) => sum + cat.income, 0);
    const totalExpense = categoryReport.reduce((sum, cat) => sum + cat.expense, 0);
    return {
      income: totalIncome,
      expense: totalExpense,
      net: totalIncome - totalExpense
    };
  }, [categoryReport]);

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

  const formatCurrency = (amount: number) => {
    return `NPR ${amount.toLocaleString()}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-green-900">Categories Report</h1>
        <p className="text-green-700 mt-2">Analyze your spending and income by category</p>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-green-800">Quick Filters</CardTitle>
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
              <Button 
                className="bg-green-600 hover:bg-green-700"
                onClick={() => {/* Filter is applied automatically */}}
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
          <CardHeader className="text-center">
            <CardTitle className="text-green-800">Total Income</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-green-600">{formatCurrency(totals.income)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-100 to-pink-100">
          <CardHeader className="text-center">
            <CardTitle className="text-red-800">Total Expense</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-red-600">{formatCurrency(totals.expense)}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100">
          <CardHeader className="text-center">
            <CardTitle className="text-blue-800">Net Amount</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <div className={`text-3xl font-bold ${totals.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totals.net)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Category Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Income</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Expense</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Net Amount</th>
                </tr>
              </thead>
              <tbody>
                {categoryReport.map((category) => (
                  <tr key={category.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                        <span className="font-medium">{category.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-green-600 font-medium">
                        {formatCurrency(category.income)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-600 font-medium">
                        {formatCurrency(category.expense)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${category.netAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(category.netAmount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {categoryReport.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transactions found for the selected date range.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

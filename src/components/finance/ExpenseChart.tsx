
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export const ExpenseChart: React.FC = () => {
  const { user } = useAuth();

  const { data: expenseData } = useQuery({
    queryKey: ['expense-chart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          expense,
          categories(name, color)
        `)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .not('expense', 'is', null);
      
      if (error) throw error;
      
      // Group by category
      const grouped = data.reduce((acc, transaction) => {
        const categoryName = transaction.categories?.name || 'Uncategorized';
        const amount = Number(transaction.expense) || 0;
        
        if (!acc[categoryName]) {
          acc[categoryName] = { name: categoryName, value: 0 };
        }
        acc[categoryName].value += amount;
        
        return acc;
      }, {} as Record<string, { name: string; value: number }>);
      
      return Object.values(grouped);
    },
    enabled: !!user,
  });

  const chartConfig = {
    expenses: {
      label: 'Expenses',
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-green-800 text-base sm:text-lg">Expense Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {expenseData && expenseData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius="80%"
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => window.innerWidth >= 640 ? `${name} ${(percent * 100).toFixed(0)}%` : `${(percent * 100).toFixed(0)}%`}
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Amount']}
                />
              </PieChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500 text-sm sm:text-base">
            No expense data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};


import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export const IncomeChart: React.FC = () => {
  const { user } = useAuth();

  const { data: incomeData } = useQuery({
    queryKey: ['income-chart', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('transactions')
        .select('income, date')
        .eq('user_id', user.id)
        .eq('type', 'income')
        .not('income', 'is', null)
        .order('date', { ascending: true });
      
      if (error) throw error;
      
      // Group by month
      const grouped = data.reduce((acc, transaction) => {
        const date = new Date(transaction.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const amount = Number(transaction.income) || 0;
        
        if (!acc[monthKey]) {
          acc[monthKey] = { month: monthKey, income: 0 };
        }
        acc[monthKey].income += amount;
        
        return acc;
      }, {} as Record<string, { month: string; income: number }>);
      
      return Object.values(grouped).slice(-6); // Last 6 months
    },
    enabled: !!user,
  });

  const chartConfig = {
    income: {
      label: 'Income',
      color: '#22c55e',
    },
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-green-800 text-base sm:text-lg">Monthly Income</CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {incomeData && incomeData.length > 0 ? (
          <ChartContainer config={chartConfig} className="h-[250px] sm:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 10 }}
                  interval={window.innerWidth < 640 ? 1 : 0}
                />
                <YAxis tick={{ fontSize: 10 }} />
                <ChartTooltip 
                  content={<ChartTooltipContent />}
                  formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Income']}
                />
                <Bar dataKey="income" fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        ) : (
          <div className="h-[250px] sm:h-[300px] flex items-center justify-center text-gray-500 text-sm sm:text-base">
            No income data available
          </div>
        )}
      </CardContent>
    </Card>
  );
};

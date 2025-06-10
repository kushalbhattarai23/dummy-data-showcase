
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface TransactionSummaryCardsProps {
  totalIncome: number;
  totalExpenses: number;
}

export const TransactionSummaryCards: React.FC<TransactionSummaryCardsProps> = ({
  totalIncome,
  totalExpenses
}) => {
  // Force re-render when currency changes by checking localStorage
  const [, forceUpdate] = React.useReducer(x => x + 1, 0);
  
  React.useEffect(() => {
    const handleStorageChange = () => forceUpdate();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
      <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-green-700" />
            <CardTitle className="text-green-800 text-sm sm:text-base">Total Income</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-green-900">{formatCurrency(totalIncome)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-red-100 to-pink-100">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-700" />
            <CardTitle className="text-red-800 text-sm sm:text-base">Total Expenses</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-red-900">{formatCurrency(totalExpenses)}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-blue-100 to-indigo-100">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-800 text-sm sm:text-base">Net Balance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-blue-900">{formatCurrency(totalIncome - totalExpenses)}</div>
        </CardContent>
      </Card>
    </div>
  );
};

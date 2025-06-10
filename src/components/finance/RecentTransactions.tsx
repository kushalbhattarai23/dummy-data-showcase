
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  reason: string;
  income?: number;
  expense?: number;
  date: string;
}

interface RecentTransactionsProps {
  transactions: Transaction[];
}

export const RecentTransactions: React.FC<RecentTransactionsProps> = ({ transactions }) => {
  return (
    <Card className="w-full">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        <CardTitle className="text-green-800 text-base sm:text-lg">Recent Transactions</CardTitle>
        <Link to="/finance/transactions">
          <Button variant="outline" size="sm" className="text-green-600 border-green-300 w-full sm:w-auto">
            View All
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {transactions.length > 0 ? (
          <div className="space-y-3 sm:space-y-4">
            {transactions.slice(0, 5).map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
                    transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {transaction.type === 'income' ? (
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
                    ) : (
                      <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm sm:text-base truncate">{transaction.reason}</p>
                    <p className="text-xs sm:text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className={`font-bold text-sm sm:text-base flex-shrink-0 ${
                  transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {transaction.type === 'income' ? '+' : '-'}
                  {formatCurrency(transaction.income || transaction.expense || 0)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
            No recent transactions
          </div>
        )}
      </CardContent>
    </Card>
  );
};

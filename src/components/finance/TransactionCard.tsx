
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Edit, Trash, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  reason: string;
  income?: number;
  expense?: number;
  date: string;
  wallets?: { name: string };
  categories?: { name: string; color: string };
}

interface TransactionCardProps {
  transaction: Transaction;
  onEdit: (transaction: Transaction) => void;
  onDelete: (id: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onEdit, onDelete }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className={`p-1.5 sm:p-2 rounded-full flex-shrink-0 ${
              transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {transaction.type === 'income' ? (
                <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4 text-red-600" />
              )}
            </div>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              transaction.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {transaction.type}
            </span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(transaction)}
              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(transaction.id)}
              className="text-red-600 hover:text-red-700 h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base truncate">{transaction.reason}</h3>
          <div className={`text-lg sm:text-xl font-bold ${
            transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatCurrency(transaction.income || transaction.expense || 0)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {new Date(transaction.date).toLocaleDateString()}
          </div>
          {transaction.wallets && (
            <div className="flex items-center gap-1 text-xs sm:text-sm">
              <Wallet className="w-3 h-3 text-gray-400" />
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {transaction.wallets.name}
              </span>
            </div>
          )}
          {transaction.categories && (
            <span 
              className="inline-block px-2 py-1 rounded text-xs"
              style={{ backgroundColor: transaction.categories.color + '20', color: transaction.categories.color }}
            >
              {transaction.categories.name}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

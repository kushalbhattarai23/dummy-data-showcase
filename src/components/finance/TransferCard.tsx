
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Edit, Trash } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

interface Transfer {
  id: string;
  amount: number;
  date: string;
  description?: string;
  from_wallet: { name: string };
  to_wallet: { name: string };
  status: string;
}

interface TransferCardProps {
  transfer: Transfer;
  onEdit: (transfer: Transfer) => void;
  onDelete: (id: string) => void;
}

export const TransferCard: React.FC<TransferCardProps> = ({ transfer, onEdit, onDelete }) => {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 sm:p-2 rounded-full flex-shrink-0 bg-blue-100">
              <ArrowRightLeft className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" />
            </div>
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Transfer
            </span>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(transfer)}
              className="h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(transfer.id)}
              className="text-red-600 hover:text-red-700 h-6 w-6 sm:h-8 sm:w-8 p-0"
            >
              <Trash className="w-3 h-3 sm:w-4 sm:h-4" />
            </Button>
          </div>
        </div>
        
        <div className="space-y-2">
          <h3 className="font-semibold text-gray-900 text-sm sm:text-base">
            {transfer.description || 'Wallet Transfer'}
          </h3>
          <div className="text-lg sm:text-xl font-bold text-blue-600">
            {formatCurrency(transfer.amount)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            {new Date(transfer.date).toLocaleDateString()}
          </div>
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <span className="text-gray-500">From:</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {transfer.from_wallet.name}
              </span>
            </div>
            <ArrowRightLeft className="w-3 h-3 text-gray-400" />
            <div className="flex items-center gap-1">
              <span className="text-gray-500">To:</span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                {transfer.to_wallet.name}
              </span>
            </div>
          </div>
          <div className="flex justify-end">
            <span className={`inline-block px-2 py-1 rounded text-xs ${
              transfer.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
            }`}>
              {transfer.status}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

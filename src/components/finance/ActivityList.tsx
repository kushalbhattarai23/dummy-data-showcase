
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TransactionCard } from './TransactionCard';
import { TransferCard } from './TransferCard';

export interface TransactionActivity {
  id: string;
  type: 'income' | 'expense';
  reason: string;
  income?: number;
  expense?: number;
  date: string;
  created_at: string;
  category_id: string | null;
  wallet_id: string;
  user_id: string;
  wallets?: { name: string };
  categories?: { name: string; color: string };
  activityType: 'transaction';
  sortDate: Date;
}

export interface TransferActivity {
  id: string;
  amount: number;
  date: string;
  created_at: string;
  description?: string;
  from_wallet_id: string;
  to_wallet_id: string;
  status: string;
  user_id: string;
  updated_at: string;
  from_wallet: { name: string };
  to_wallet: { name: string };
  activityType: 'transfer';
  sortDate: Date;
}

export type Activity = TransactionActivity | TransferActivity;

interface ActivityListProps {
  activities: Activity[];
  isLoading: boolean;
  onEditTransaction: (transaction: TransactionActivity) => void;
  onEditTransfer: (transfer: TransferActivity) => void;
  onDeleteTransaction: (id: string) => void;
  onDeleteTransfer: (id: string) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({
  activities,
  isLoading,
  onEditTransaction,
  onEditTransfer,
  onDeleteTransaction,
  onDeleteTransfer
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base sm:text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {isLoading ? (
          <p className="text-center py-8 text-gray-500 text-sm sm:text-base">Loading...</p>
        ) : activities.length === 0 ? (
          <p className="text-center py-8 text-gray-500 text-sm sm:text-base">No activity found. Create your first transaction or transfer!</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {activities.map((activity) => (
              activity.activityType === 'transaction' ? (
                <TransactionCard
                  key={`transaction-${activity.id}`}
                  transaction={activity}
                  onEdit={onEditTransaction}
                  onDelete={onDeleteTransaction}
                />
              ) : (
                <TransferCard
                  key={`transfer-${activity.id}`}
                  transfer={activity}
                  onEdit={onEditTransfer}
                  onDelete={onDeleteTransfer}
                />
              )
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

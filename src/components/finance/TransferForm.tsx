
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatCurrency } from '@/lib/currency';

interface TransferFormProps {
  transferData: {
    from_wallet_id: string;
    to_wallet_id: string;
    amount: string;
    date: string;
    description: string;
  };
  setTransferData: (data: any) => void;
  wallets?: Array<{ id: string; name: string; balance: number }>;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export const TransferForm: React.FC<TransferFormProps> = ({
  transferData,
  setTransferData,
  wallets,
  onSubmit,
  onCancel,
  isEditing
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="from_wallet_id" className="text-sm">From Wallet</Label>
          <select
            id="from_wallet_id"
            value={transferData.from_wallet_id}
            onChange={(e) => setTransferData({ ...transferData, from_wallet_id: e.target.value })}
            className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
            required
          >
            <option value="">Select Source Wallet</option>
            {wallets?.map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({formatCurrency(Number(wallet.balance))})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="to_wallet_id" className="text-sm">To Wallet</Label>
          <select
            id="to_wallet_id"
            value={transferData.to_wallet_id}
            onChange={(e) => setTransferData({ ...transferData, to_wallet_id: e.target.value })}
            className="w-full h-10 px-3 py-2 border border-input bg-background rounded-md text-sm"
            required
          >
            <option value="">Select Destination Wallet</option>
            {wallets?.filter(w => w.id !== transferData.from_wallet_id).map((wallet) => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} ({formatCurrency(Number(wallet.balance))})
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="transfer_amount" className="text-sm">Amount</Label>
          <Input
            id="transfer_amount"
            type="number"
            step="0.01"
            min="0.01"
            value={transferData.amount}
            onChange={(e) => setTransferData({ ...transferData, amount: e.target.value })}
            placeholder="0.00"
            required
            className="text-sm"
          />
        </div>
        <div>
          <Label htmlFor="transfer_date" className="text-sm">Date</Label>
          <Input
            id="transfer_date"
            type="date"
            value={transferData.date}
            onChange={(e) => setTransferData({ ...transferData, date: e.target.value })}
            required
            className="text-sm"
          />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="description" className="text-sm">Description (Optional)</Label>
          <Input
            id="description"
            value={transferData.description}
            onChange={(e) => setTransferData({ ...transferData, description: e.target.value })}
            placeholder="e.g., Monthly savings transfer"
            className="text-sm"
          />
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-2">
        <Button type="submit" className="bg-green-600 hover:bg-green-700 text-sm">
          {isEditing ? 'Update' : 'Create'} Transfer
        </Button>
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
          className="text-sm"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

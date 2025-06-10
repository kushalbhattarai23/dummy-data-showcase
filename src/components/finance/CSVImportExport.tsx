
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Upload, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { downloadCSV, parseCSV } from '@/lib/csvUtils';

export const CSVImportExport: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Fetch all data for export
  const { data: transactions } = useQuery({
    queryKey: ['transactions-export', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          wallets(name),
          categories(name)
        `)
        .eq('user_id', user.id)
        .order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets-export', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers-export', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_wallet:wallets!transfers_from_wallet_id_fkey(name),
          to_wallet:wallets!transfers_to_wallet_id_fkey(name)
        `)
        .eq('user_id', user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories-export', user?.id],
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

  // Export functions
  const exportTransactions = () => {
    if (!transactions || transactions.length === 0) {
      toast({ title: 'No Data', description: 'No transactions to export' });
      return;
    }

    const exportData = transactions.map(t => ({
      type: t.type,
      reason: t.reason,
      income: t.income || '',
      expense: t.expense || '',
      date: t.date,
      wallet_name: t.wallets?.name || '',
      category_name: t.categories?.name || '',
      created_at: t.created_at
    }));

    const headers = ['type', 'reason', 'income', 'expense', 'date', 'wallet_name', 'category_name', 'created_at'];
    downloadCSV(exportData, 'transactions.csv', headers);
    toast({ title: 'Success', description: 'Transactions exported successfully!' });
  };

  const exportWallets = () => {
    if (!wallets || wallets.length === 0) {
      toast({ title: 'No Data', description: 'No wallets to export' });
      return;
    }

    const headers = ['name', 'balance', 'currency', 'created_at'];
    downloadCSV(wallets, 'wallets.csv', headers);
    toast({ title: 'Success', description: 'Wallets exported successfully!' });
  };

  const exportTransfers = () => {
    if (!transfers || transfers.length === 0) {
      toast({ title: 'No Data', description: 'No transfers to export' });
      return;
    }

    const exportData = transfers.map(t => ({
      from_wallet_name: Array.isArray(t.from_wallet) ? t.from_wallet[0]?.name : t.from_wallet?.name || '',
      to_wallet_name: Array.isArray(t.to_wallet) ? t.to_wallet[0]?.name : t.to_wallet?.name || '',
      amount: t.amount,
      date: t.date,
      description: t.description || '',
      status: t.status,
      created_at: t.created_at
    }));

    const headers = ['from_wallet_name', 'to_wallet_name', 'amount', 'date', 'description', 'status', 'created_at'];
    downloadCSV(exportData, 'transfers.csv', headers);
    toast({ title: 'Success', description: 'Transfers exported successfully!' });
  };

  const exportCategories = () => {
    if (!categories || categories.length === 0) {
      toast({ title: 'No Data', description: 'No categories to export' });
      return;
    }

    const headers = ['name', 'color', 'created_at'];
    downloadCSV(categories, 'categories.csv', headers);
    toast({ title: 'Success', description: 'Categories exported successfully!' });
  };

  // Import function
  const importData = useMutation({
    mutationFn: async ({ file, dataType }: { file: File; dataType: string }) => {
      const text = await file.text();
      const parsedData = parseCSV(text);
      
      if (parsedData.length === 0) {
        throw new Error('No valid data found in CSV file');
      }

      if (dataType === 'transactions') {
        // Import transactions
        for (const row of parsedData) {
          // Find wallet by name
          const wallet = wallets?.find(w => w.name === row.wallet_name);
          if (!wallet) {
            throw new Error(`Wallet "${row.wallet_name}" not found. Please create it first.`);
          }

          // Find category by name (optional)
          const category = categories?.find(c => c.name === row.category_name);

          const { error } = await supabase
            .from('transactions')
            .insert({
              type: row.type,
              reason: row.reason,
              income: row.income ? parseFloat(row.income) : null,
              expense: row.expense ? parseFloat(row.expense) : null,
              date: row.date,
              wallet_id: wallet.id,
              category_id: category?.id || null,
              user_id: user.id
            });

          if (error) throw error;
        }
      } else if (dataType === 'wallets') {
        // Import wallets
        for (const row of parsedData) {
          const { error } = await supabase
            .from('wallets')
            .insert({
              name: row.name,
              balance: parseFloat(row.balance || '0'),
              currency: row.currency || 'NPR',
              user_id: user.id
            });

          if (error) throw error;
        }
      } else if (dataType === 'categories') {
        // Import categories
        for (const row of parsedData) {
          const { error } = await supabase
            .from('categories')
            .insert({
              name: row.name,
              color: row.color || '#3b82f6',
              user_id: user.id
            });

          if (error) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['wallets'] });
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setImportFile(null);
      setIsImporting(false);
      toast({ title: 'Success', description: 'Data imported successfully!' });
    },
    onError: (error) => {
      setIsImporting(false);
      toast({ title: 'Import Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleImport = (dataType: string) => {
    if (!importFile) {
      toast({ title: 'Error', description: 'Please select a file to import', variant: 'destructive' });
      return;
    }

    setIsImporting(true);
    importData.mutate({ file: importFile, dataType });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setImportFile(file);
    } else {
      toast({ title: 'Invalid File', description: 'Please select a valid CSV file', variant: 'destructive' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="w-5 h-5" />
          CSV Import/Export
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="export" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export Data</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="export" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={exportTransactions} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Transactions
              </Button>
              <Button onClick={exportWallets} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Wallets
              </Button>
              <Button onClick={exportTransfers} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Transfers
              </Button>
              <Button onClick={exportCategories} variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Categories
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="csvFile">Select CSV File</Label>
                <Input
                  id="csvFile"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="mt-1"
                />
              </div>
              
              {importFile && (
                <div className="grid grid-cols-2 gap-4">
                  <Button 
                    onClick={() => handleImport('transactions')} 
                    disabled={isImporting}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import as Transactions
                  </Button>
                  <Button 
                    onClick={() => handleImport('wallets')} 
                    disabled={isImporting}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import as Wallets
                  </Button>
                  <Button 
                    onClick={() => handleImport('categories')} 
                    disabled={isImporting}
                    variant="outline"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import as Categories
                  </Button>
                </div>
              )}
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">Import Notes:</p>
                    <ul className="mt-1 list-disc list-inside space-y-1 text-xs">
                      <li>For transactions: Wallets and categories must exist before importing</li>
                      <li>Wallet names and category names are case-sensitive</li>
                      <li>Import will add new records, not update existing ones</li>
                      <li>Make sure CSV format matches exported format</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

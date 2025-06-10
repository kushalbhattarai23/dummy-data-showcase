import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, LineChart, Line } from 'recharts';
import { formatCurrency } from '@/lib/currency';

export const TransfersReport: React.FC = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState({
    fromDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    toDate: new Date().toISOString().split('T')[0],
    quickFilter: 'This Month'
  });

  const { data: transfers } = useQuery({
    queryKey: ['transfers-report', user?.id, dateFilter],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('transfers')
        .select(`
          *,
          from_wallet:from_wallet_id!inner(name),
          to_wallet:to_wallet_id!inner(name)
        `)
        .eq('user_id', user.id)
        .gte('date', dateFilter.fromDate)
        .lte('date', dateFilter.toDate)
        .order('date', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: wallets } = useQuery({
    queryKey: ['wallets', user?.id],
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

  const transferStats = useMemo(() => {
    if (!transfers) return {
      totalTransfers: 0,
      totalAmount: 0,
      avgTransferAmount: 0,
      largestTransfer: 0,
      smallestTransfer: 0
    };

    const amounts = transfers.map(t => Number(t.amount));
    const totalAmount = amounts.reduce((sum, amount) => sum + amount, 0);

    return {
      totalTransfers: transfers.length,
      totalAmount,
      avgTransferAmount: transfers.length > 0 ? totalAmount / transfers.length : 0,
      largestTransfer: amounts.length > 0 ? Math.max(...amounts) : 0,
      smallestTransfer: amounts.length > 0 ? Math.min(...amounts) : 0
    };
  }, [transfers]);

  const walletTransferActivity = useMemo(() => {
    if (!transfers || !wallets) return [];

    const walletMap = new Map();
    
    // Initialize all wallets
    wallets.forEach(wallet => {
      walletMap.set(wallet.id, {
        id: wallet.id,
        name: wallet.name,
        transfersOut: 0,
        transfersIn: 0,
        amountOut: 0,
        amountIn: 0,
        netTransfers: 0
      });
    });

    // Process transfers
    transfers.forEach(transfer => {
      const fromWallet = walletMap.get(transfer.from_wallet_id);
      const toWallet = walletMap.get(transfer.to_wallet_id);
      const amount = Number(transfer.amount);

      if (fromWallet) {
        fromWallet.transfersOut++;
        fromWallet.amountOut += amount;
      }

      if (toWallet) {
        toWallet.transfersIn++;
        toWallet.amountIn += amount;
      }
    });

    // Calculate net transfers
    walletMap.forEach(wallet => {
      wallet.netTransfers = wallet.amountIn - wallet.amountOut;
    });

    return Array.from(walletMap.values()).filter(wallet => 
      wallet.transfersOut > 0 || wallet.transfersIn > 0
    );
  }, [transfers, wallets]);

  const dailyTransferData = useMemo(() => {
    if (!transfers) return [];

    const dailyMap = new Map();
    
    transfers.forEach(transfer => {
      const date = transfer.date;
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date,
          count: 0,
          amount: 0
        });
      }
      
      const day = dailyMap.get(date);
      day.count++;
      day.amount += Number(transfer.amount);
    });

    return Array.from(dailyMap.values()).sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [transfers]);

  const transferFlows = useMemo(() => {
    if (!transfers) return [];

    const flowMap = new Map();
    
    transfers.forEach(transfer => {
      const fromWallet = Array.isArray(transfer.from_wallet) ? transfer.from_wallet[0] : transfer.from_wallet;
      const toWallet = Array.isArray(transfer.to_wallet) ? transfer.to_wallet[0] : transfer.to_wallet;
      
      const flowKey = `${fromWallet?.name} → ${toWallet?.name}`;
      
      if (!flowMap.has(flowKey)) {
        flowMap.set(flowKey, {
          flow: flowKey,
          count: 0,
          totalAmount: 0,
          avgAmount: 0
        });
      }
      
      const flow = flowMap.get(flowKey);
      flow.count++;
      flow.totalAmount += Number(transfer.amount);
      flow.avgAmount = flow.totalAmount / flow.count;
    });

    return Array.from(flowMap.values()).sort((a, b) => b.totalAmount - a.totalAmount);
  }, [transfers]);

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

  const chartConfig = {
    amount: {
      label: 'Amount',
      color: '#3b82f6',
    },
    count: {
      label: 'Count',
      color: '#22c55e',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-green-900">Transfers Report</h1>
        <p className="text-green-700 mt-2 text-sm sm:text-base">
          Analyze wallet transfer patterns and flows
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Date Range</CardTitle>
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="bg-gradient-to-r from-blue-100 to-indigo-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-800 text-sm">Total Transfers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {transferStats.totalTransfers}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-100 to-emerald-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-800 text-sm">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(transferStats.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-100 to-violet-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-purple-800 text-sm">Average Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(transferStats.avgTransferAmount)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-100 to-amber-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-orange-800 text-sm">Largest Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(transferStats.largestTransfer)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-100 to-pink-100">
          <CardHeader className="pb-2">
            <CardTitle className="text-red-800 text-sm">Smallest Transfer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(transferStats.smallestTransfer)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Daily Transfer Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Daily Transfer Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {dailyTransferData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyTransferData}>
                    <XAxis 
                      dataKey="date" 
                      tick={{ fontSize: 10 }}
                      tickFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        name === 'amount' ? formatCurrency(Number(value)) : value,
                        name === 'amount' ? 'Amount' : 'Count'
                      ]}
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="count" stroke="#22c55e" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No transfer data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Wallet Transfer Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-green-800">Wallet Transfer Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {walletTransferActivity.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={walletTransferActivity} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      formatter={(value, name) => [
                        formatCurrency(Number(value)), 
                        name === 'amountIn' ? 'Transfers In' : 'Transfers Out'
                      ]}
                    />
                    <Bar dataKey="amountIn" fill="#22c55e" name="amountIn" />
                    <Bar dataKey="amountOut" fill="#ef4444" name="amountOut" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                No wallet activity data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Flows Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Transfer Flows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Transfer Flow</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Count</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Total Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Average Amount</th>
                </tr>
              </thead>
              <tbody>
                {transferFlows.map((flow, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{flow.flow}</td>
                    <td className="py-3 px-4 text-right">{flow.count}</td>
                    <td className="py-3 px-4 text-right font-medium text-blue-600">
                      {formatCurrency(flow.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {formatCurrency(flow.avgAmount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {transferFlows.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No transfer flows found for the selected period.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Wallet Activity Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-green-800">Wallet Activity Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Wallet</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Transfers In</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Amount In</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Transfers Out</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Amount Out</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Net Transfer</th>
                </tr>
              </thead>
              <tbody>
                {walletTransferActivity.map((wallet) => (
                  <tr key={wallet.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{wallet.name}</td>
                    <td className="py-3 px-4 text-right">{wallet.transfersIn}</td>
                    <td className="py-3 px-4 text-right text-green-600">
                      {formatCurrency(wallet.amountIn)}
                    </td>
                    <td className="py-3 px-4 text-right">{wallet.transfersOut}</td>
                    <td className="py-3 px-4 text-right text-red-600">
                      {formatCurrency(wallet.amountOut)}
                    </td>
                    <td className={`py-3 px-4 text-right font-medium ${
                      wallet.netTransfers >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(wallet.netTransfers)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {walletTransferActivity.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No wallet transfer activity found for the selected period.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, DollarSign, Tv } from 'lucide-react';

const CURRENCIES = [
  { code: 'NPR', symbol: '₨', name: 'Nepalese Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const [currency, setCurrency] = useState('NPR');
  const [loading, setLoading] = useState(false);

  const isFinanceSection = location.pathname.startsWith('/finance');

  useEffect(() => {
    // Load currency from localStorage
    const savedCurrency = localStorage.getItem('user-currency');
    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
  }, []);

  const handleCurrencyChange = async (newCurrency: string) => {
    setLoading(true);
    try {
      // Save to localStorage
      localStorage.setItem('user-currency', newCurrency);
      setCurrency(newCurrency);
      
      toast({
        title: "Settings Updated",
        description: `Currency changed to ${CURRENCIES.find(c => c.code === newCurrency)?.name}. Only the display symbol will change, your balance amounts remain the same.`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update currency setting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = CURRENCIES.find(c => c.code === currency);

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Please sign in to access settings.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50 -mx-4 -mt-8 px-4 pt-8">
      {/* Header */}
      <div className={`${isFinanceSection ? 'bg-green-600' : 'bg-purple-600'} text-white py-8 -mx-4 mb-8`}>
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-8 h-8" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <p className={`${isFinanceSection ? 'text-green-100' : 'text-purple-100'}`}>
            Manage your {isFinanceSection ? 'finance' : 'TV show'} preferences
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 space-y-6">
        {/* Currency Settings */}
        <Card className={`${isFinanceSection ? 'border-green-200' : 'border-purple-200'}`}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${isFinanceSection ? 'text-green-800' : 'text-purple-800'}`}>
              <DollarSign className="w-5 h-5" />
              Currency Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="currency">Display Currency</Label>
              <Select value={currency} onValueChange={handleCurrencyChange} disabled={loading}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.code} value={curr.code}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">{curr.symbol}</span>
                        <span>{curr.name} ({curr.code})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-2">
                Current: <span className="font-mono font-semibold">{selectedCurrency?.symbol}</span> {selectedCurrency?.name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Note: Changing currency only affects the display symbol. Your actual balance amounts remain unchanged.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Information */}
        <Card className={`${isFinanceSection ? 'border-green-200' : 'border-purple-200'}`}>
          <CardHeader>
            <CardTitle className={`${isFinanceSection ? 'text-green-800' : 'text-purple-800'}`}>
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Email</Label>
              <p className="text-sm text-gray-700 mt-1">{user.email}</p>
            </div>
            <div>
              <Label>Account Created</Label>
              <p className="text-sm text-gray-700 mt-1">
                {new Date(user.created_at || '').toLocaleDateString()}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* App-specific Settings */}
        {isFinanceSection ? (
          <Card className="border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <DollarSign className="w-5 h-5" />
                Finance Tracker Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Finance-specific settings will be added here in future updates.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-800">
                <Tv className="w-5 h-5" />
                TV Show Tracker Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                TV show-specific settings will be added here in future updates.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
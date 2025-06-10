
import React from 'react';
import { Link } from 'react-router-dom';
import { Tv, DollarSign, Package } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';

export const TrackHub: React.FC = () => {
  const { user, signOut } = useAuth();

  const tvFeatures = [
    'Track episodes and seasons',
    'Mark shows as watched',
    'Organize by universes',
    'Personal watchlist'
  ];

  const financeFeatures = [
    'Multiple wallet support',
    'Transaction tracking',
    'Organization management',
    'Financial analytics'
  ];

  const inventoryFeatures = [
    'Organization management',
    'Stock level tracking',
    'Organization finances',
    'Multi-user access'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-green-50">
      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Choose Your Tracking App</h1>
          <p className="text-base sm:text-lg text-gray-600 px-4">
            Manage your entertainment, finances, and inventory all in one place
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto mb-8 sm:mb-16">
          {/* TV Show Tracker */}
          <Card className="bg-gradient-to-br from-purple-100 to-purple-50 border-purple-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-purple-500 rounded-full flex items-center justify-center mb-4">
                <Tv className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl text-purple-900">TV Show Tracker</CardTitle>
              <CardDescription className="text-purple-700 text-sm sm:text-base">
                Keep track of your favorite shows, episodes, and watch progress
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/tracker/dashboard">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 sm:py-3">
                  Open TV Shows
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Finance Tracker */}
          <Card className="bg-gradient-to-br from-green-100 to-green-50 border-green-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl text-green-900">Finance Tracker</CardTitle>
              <CardDescription className="text-green-700 text-sm sm:text-base">
                Monitor your expenses, income, wallets, and financial goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/finance">
                <Button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 sm:py-3">
                  Open Finances
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Inventory Tracker */}
          <Card className="bg-gradient-to-br from-blue-100 to-blue-50 border-blue-200 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center pb-4 sm:pb-6">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                <Package className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
              </div>
              <CardTitle className="text-xl sm:text-2xl text-blue-900">Inventory Tracker</CardTitle>
              <CardDescription className="text-blue-700 text-sm sm:text-base">
                Manage organizations, track stock levels, and monitor finances
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link to="/inventory">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 sm:py-3">
                  Open Inventory
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          <Card className="bg-white/50 border-purple-200">
            <CardHeader>
              <CardTitle className="text-purple-900 text-lg sm:text-xl">TV Show Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {tvFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-purple-700 text-sm sm:text-base">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-3 flex-shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-green-200">
            <CardHeader>
              <CardTitle className="text-green-900 text-lg sm:text-xl">Finance Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {financeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-green-700 text-sm sm:text-base">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white/50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-blue-900 text-lg sm:text-xl">Inventory Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {inventoryFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-blue-700 text-sm sm:text-base">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3 flex-shrink-0"></span>
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

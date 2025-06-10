
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tv, DollarSign, Package, Star, Users, TrendingUp, Play, BarChart3 } from 'lucide-react';

export const LandingDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-800/20 to-blue-800/20" />
        <div className="relative container mx-auto px-4 py-20">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Track Hub
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-8">
              Your all-in-one platform for tracking TV shows, managing finances, and organizing your digital life
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/sign-up">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-4">
                  Get Started Free
                </Button>
              </Link>
              <Link to="/tracker/universes/public">
                <Button size="lg" variant="outline" className="border-purple-400 text-purple-300 hover:bg-purple-900 text-lg px-8 py-4">
                  Explore Public Universes
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">Everything You Need in One Place</h2>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Discover the power of integrated tracking and management tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {/* TV Shows Feature */}
          <Card className="bg-gradient-to-br from-purple-800/50 to-purple-900/50 border-purple-700 text-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-600 rounded-lg">
                  <Tv className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">TV Show Tracking</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-purple-200 mb-4">
                Track your favorite shows, create custom universes, and never miss an episode again.
              </CardDescription>
              <div className="space-y-2 text-sm text-purple-300">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>Episode tracking & progress</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Custom show universes</span>
                </div>
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  <span>Public & private collections</span>
                </div>
              </div>
              <Link to="/tracker/dashboard" className="mt-4 block">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  Explore TV Tracking
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Finance Feature */}
          <Card className="bg-gradient-to-br from-green-800/50 to-green-900/50 border-green-700 text-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-600 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Finance Management</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-green-200 mb-4">
                Take control of your finances with comprehensive tracking and reporting tools.
              </CardDescription>
              <div className="space-y-2 text-sm text-green-300">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Transaction tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>Budget management</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  <span>CSV import/export</span>
                </div>
              </div>
              <Link to="/sign-in" className="mt-4 block">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Start Managing Finances
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Inventory Feature */}
          <Card className="bg-gradient-to-br from-blue-800/50 to-blue-900/50 border-blue-700 text-white">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600 rounded-lg">
                  <Package className="h-6 w-6" />
                </div>
                <CardTitle className="text-xl">Inventory System</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-blue-200 mb-4">
                Organize and manage your inventory with powerful organizational tools.
              </CardDescription>
              <div className="space-y-2 text-sm text-blue-300">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  <span>Item organization</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Multi-organization support</span>
                </div>
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Inventory analytics</span>
                </div>
              </div>
              <Link to="/inventory" className="mt-4 block">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Explore Inventory
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Stats Section */}
        <div className="text-center mb-20">
          <h3 className="text-2xl font-bold mb-8 text-white">Trusted by Users Worldwide</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">10K+</div>
              <div className="text-gray-400">Shows Tracked</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">5K+</div>
              <div className="text-gray-400">Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">1K+</div>
              <div className="text-gray-400">Organizations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">99%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-purple-800/50 to-blue-800/50 rounded-2xl p-12 border border-purple-700">
          <h3 className="text-3xl font-bold mb-4 text-white">Ready to Get Started?</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join thousands of users who are already organizing their digital life with Track Hub
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/sign-up">
              <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-lg px-8 py-4">
                Create Free Account
              </Button>
            </Link>
            <Link to="/sign-in">
              <Button size="lg" variant="outline" className="border-purple-400 text-purple-300 hover:bg-purple-900 text-lg px-8 py-4">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

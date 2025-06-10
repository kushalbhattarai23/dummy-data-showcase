
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Building2, Package, Users, Wallet, Plus, TrendingUp, AlertTriangle } from 'lucide-react';

export const InventoryDashboard: React.FC = () => {
  const { user } = useAuth();

  const { data: organizations, isLoading: organizationsLoading } = useQuery({
    queryKey: ['organizations'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const { data: items, error: itemsError } = await supabase
        .from('inventory_items')
        .select('quantity_in_stock, minimum_stock_level, unit_price, organization_id');
      
      if (itemsError) throw itemsError;

      const { data: movements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
      
      if (movementsError) throw movementsError;

      const totalItems = items?.length || 0;
      const lowStockItems = items?.filter(item => 
        item.minimum_stock_level && item.quantity_in_stock <= item.minimum_stock_level
      ).length || 0;
      const totalValue = items?.reduce((sum, item) => 
        sum + (item.quantity_in_stock * item.unit_price), 0
      ) || 0;
      const recentMovements = movements?.length || 0;

      return {
        totalItems,
        lowStockItems,
        totalValue,
        recentMovements
      };
    },
    enabled: !!user,
  });

  if (organizationsLoading || statsLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-blue-900 mb-2">Inventory Dashboard</h1>
          <p className="text-blue-700">Manage your organizations and track inventory</p>
        </div>
        <Link to="/inventory/organizations/new">
          <Button className="bg-blue-600 hover:bg-blue-700 mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Create Organization
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-100 to-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-700" />
              <CardTitle className="text-blue-800 text-sm">Total Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats?.totalItems || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-100 to-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-700" />
              <CardTitle className="text-orange-800 text-sm">Low Stock</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{stats?.lowStockItems || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-100 to-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-green-700" />
              <CardTitle className="text-green-800 text-sm">Total Value</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">रु {stats?.totalValue?.toLocaleString() || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-100 to-purple-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-700" />
              <CardTitle className="text-purple-800 text-sm">Recent Movements</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{stats?.recentMovements || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-900">Your Organizations</CardTitle>
          <CardDescription>Manage your inventory across different organizations</CardDescription>
        </CardHeader>
        <CardContent>
          {organizations && organizations.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {organizations.map((org) => (
                <Card key={org.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-blue-600" />
                      <CardTitle className="text-lg text-blue-900">{org.name}</CardTitle>
                    </div>
                    {org.description && (
                      <CardDescription className="text-sm">{org.description}</CardDescription>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Link to={`/inventory/organizations/${org.id}`}>
                      <Button variant="outline" className="w-full">
                        <Package className="w-4 h-4 mr-2" />
                        View Inventory
                      </Button>
                    </Link>
                    <Link to={`/inventory/organizations/${org.id}/finances`}>
                      <Button variant="outline" className="w-full">
                        <Wallet className="w-4 h-4 mr-2" />
                        View Finances
                      </Button>
                    </Link>
                    <Link to={`/inventory/organizations/${org.id}/members`}>
                      <Button variant="outline" className="w-full">
                        <Users className="w-4 h-4 mr-2" />
                        Manage Members
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
              <p className="text-gray-600 mb-4">Create your first organization to start tracking inventory</p>
              <Link to="/inventory/organizations/new">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Organization
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

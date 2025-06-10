
import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Package, Plus, Edit, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export const OrganizationDetail: React.FC = () => {
  const { organizationId } = useParams<{ organizationId: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    sku: '',
    category: '',
    unit_price: '',
    quantity_in_stock: '',
    minimum_stock_level: ''
  });

  const { data: organization } = useQuery({
    queryKey: ['organization', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const { data: inventoryItems, isLoading } = useQuery({
    queryKey: ['inventory-items', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  const addItem = useMutation({
    mutationFn: async (itemData: any) => {
      const { data, error } = await supabase
        .from('inventory_items')
        .insert({
          ...itemData,
          organization_id: organizationId,
          unit_price: parseFloat(itemData.unit_price) || 0,
          quantity_in_stock: parseInt(itemData.quantity_in_stock) || 0,
          minimum_stock_level: parseInt(itemData.minimum_stock_level) || 0
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-items', organizationId] });
      setIsAddingItem(false);
      setNewItem({
        name: '',
        description: '',
        sku: '',
        category: '',
        unit_price: '',
        quantity_in_stock: '',
        minimum_stock_level: ''
      });
      toast({
        title: 'Item added',
        description: 'Inventory item has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to add item. Please try again.',
        variant: 'destructive',
      });
      console.error('Error adding item:', error);
    },
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Item name is required.',
        variant: 'destructive',
      });
      return;
    }
    addItem.mutate(newItem);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  const lowStockItems = inventoryItems?.filter(item => 
    item.minimum_stock_level && item.quantity_in_stock <= item.minimum_stock_level
  ) || [];

  const totalValue = inventoryItems?.reduce((sum, item) => 
    sum + (item.quantity_in_stock * item.unit_price), 0
  ) || 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Link to="/inventory" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900 mb-2">{organization?.name}</h1>
            {organization?.description && (
              <p className="text-blue-700">{organization.description}</p>
            )}
          </div>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Link to={`/inventory/organizations/${organizationId}/finances`}>
              <Button variant="outline">View Finances</Button>
            </Link>
            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Inventory Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name *</Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      placeholder="Enter item name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sku">SKU</Label>
                    <Input
                      id="sku"
                      value={newItem.sku}
                      onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                      placeholder="Enter SKU"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Input
                      id="category"
                      value={newItem.category}
                      onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                      placeholder="Enter category"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="unit_price">Unit Price</Label>
                      <Input
                        id="unit_price"
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItem.unit_price}
                        onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="quantity">Quantity</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min="0"
                        value={newItem.quantity_in_stock}
                        onChange={(e) => setNewItem({ ...newItem, quantity_in_stock: e.target.value })}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="min_stock">Minimum Stock Level</Label>
                    <Input
                      id="min_stock"
                      type="number"
                      min="0"
                      value={newItem.minimum_stock_level}
                      onChange={(e) => setNewItem({ ...newItem, minimum_stock_level: e.target.value })}
                      placeholder="0"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={addItem.isPending}>
                      {addItem.isPending ? 'Adding...' : 'Add Item'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setIsAddingItem(false)}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-r from-blue-100 to-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-700" />
              <CardTitle className="text-blue-800 text-sm">Total Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{inventoryItems?.length || 0}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-orange-100 to-orange-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-700" />
              <CardTitle className="text-orange-800 text-sm">Low Stock Items</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">{lowStockItems.length}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-100 to-green-50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-700" />
              <CardTitle className="text-green-800 text-sm">Total Value</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">रु {totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-900">Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          {inventoryItems && inventoryItems.length > 0 ? (
            <div className="space-y-4">
              {inventoryItems.map((item) => {
                const isLowStock = item.minimum_stock_level && item.quantity_in_stock <= item.minimum_stock_level;
                return (
                  <Card key={item.id} className={`${isLowStock ? 'border-orange-200 bg-orange-50' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            {isLowStock && (
                              <Badge variant="destructive" className="bg-orange-100 text-orange-800">
                                Low Stock
                              </Badge>
                            )}
                            {item.category && (
                              <Badge variant="outline">{item.category}</Badge>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          )}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {item.sku && (
                              <div>
                                <span className="font-medium">SKU:</span> {item.sku}
                              </div>
                            )}
                            <div>
                              <span className="font-medium">Stock:</span> {item.quantity_in_stock}
                            </div>
                            <div>
                              <span className="font-medium">Unit Price:</span> रु {item.unit_price}
                            </div>
                            <div>
                              <span className="font-medium">Total Value:</span> रु {(item.quantity_in_stock * item.unit_price).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory items yet</h3>
              <p className="text-gray-600 mb-4">Add your first inventory item to start tracking stock</p>
              <Button 
                onClick={() => setIsAddingItem(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

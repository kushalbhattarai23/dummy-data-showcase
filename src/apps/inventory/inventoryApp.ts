
import { Package } from 'lucide-react';
import { AppModule } from '../appConfig';
import { InventoryDashboard } from '../../pages/InventoryDashboard';
import { CreateOrganization } from '../../pages/CreateOrganization';
import { OrganizationDetail } from '../../pages/OrganizationDetail';

export const inventoryApp: AppModule = {
  id: 'inventory',
  name: 'inventory',
  displayName: 'Inventory',
  icon: Package,
  theme: {
    primary: 'bg-blue-600',
    secondary: 'text-blue-100',
    accent: 'hover:bg-blue-700',
  },
  routes: [
    {
      path: '/inventory',
      element: InventoryDashboard,
    },
    {
      path: '/inventory/organizations/new',
      element: CreateOrganization,
    },
    {
      path: '/inventory/organizations/:organizationId',
      element: OrganizationDetail,
    },
  ],
  navigationItems: [
    {
      label: 'Dashboard',
      path: '/inventory',
    },
  ],
  enabled: true,
};

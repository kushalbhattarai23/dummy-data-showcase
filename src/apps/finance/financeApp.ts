
import { DollarSign } from 'lucide-react';
import { AppModule } from '../appConfig';
import { FinanceDashboard } from '../../pages/FinanceDashboard';
import { Wallets } from '../../pages/Wallets';
import { WalletDetail } from '../../pages/WalletDetail';
import { Transactions } from '../../pages/Transactions';
import { Categories } from '../../pages/Categories';
import { CategoryDetail } from '../../pages/CategoryDetail';
import { ReportsDashboard } from '../../pages/ReportsDashboard';
import { Settings } from '../../pages/Settings';

export const financeApp: AppModule = {
  id: 'finance',
  name: 'finance',
  displayName: 'Finance',
  icon: DollarSign,
  theme: {
    primary: 'bg-green-600',
    secondary: 'text-green-100',
    accent: 'hover:bg-green-700',
  },
  routes: [
    {
      path: '/finance',
      element: FinanceDashboard,
      requiresAuth: true,
    },
    {
      path: '/finance/wallets',
      element: Wallets,
      requiresAuth: true,
    },
    {
      path: '/finance/wallets/:walletId',
      element: WalletDetail,
      requiresAuth: true,
    },
    {
      path: '/finance/transactions',
      element: Transactions,
      requiresAuth: true,
    },
    {
      path: '/finance/categories',
      element: Categories,
      requiresAuth: true,
    },
    {
      path: '/finance/categories/:categoryId',
      element: CategoryDetail,
      requiresAuth: true,
    },
    {
      path: '/finance/reports',
      element: ReportsDashboard,
      requiresAuth: true,
    },
    {
      path: '/finance/settings',
      element: Settings,
      requiresAuth: true,
    },
  ],
  navigationItems: [
    {
      label: 'Dashboard',
      path: '/finance',
      requiresAuth: true,
    },
    {
      label: 'Wallets',
      path: '/finance/wallets',
      requiresAuth: true,
    },
    {
      label: 'Transactions',
      path: '/finance/transactions',
      requiresAuth: true,
    },
    {
      label: 'Categories',
      path: '/finance/categories',
      requiresAuth: true,
    },
    {
      label: 'Reports',
      path: '/finance/reports',
      requiresAuth: true,
    },
  ],
  requiresAuth: true,
  enabled: true,
};

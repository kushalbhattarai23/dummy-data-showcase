
import { Tv } from 'lucide-react';
import { AppModule } from '../appConfig';
import { Dashboard } from '../../pages/Dashboard';
import { AdminPortal } from '../../pages/AdminPortal';
import { PublicShows } from '../../pages/PublicShows';
import { MyShows } from '../../pages/MyShows';
import { PublicUniverses } from '../../pages/PublicUniverses';
import { MyUniverses } from '../../pages/MyUniverses';
import { UniversePage } from '../../pages/UniversePage';
import { UniverseDetail } from '../../pages/UniverseDetail';
import { UniverseDashboard } from '../../pages/UniverseDashboard';
import { ShowDetail } from '../../pages/ShowDetail';
import { Settings } from '../../pages/Settings';

export const tvApp: AppModule = {
  id: 'tv',
  name: 'tracker',
  displayName: 'TV Shows',
  icon: Tv,
  theme: {
    primary: 'bg-purple-600',
    secondary: 'text-purple-100',
    accent: 'hover:bg-purple-700',
  },
  routes: [
    {
      path: '/tracker/dashboard',
      element: Dashboard,
      legacy: ['/dashboard'],
    },
    {
      path: '/tracker/admin',
      element: AdminPortal,
      requiresAuth: true,
      legacy: ['/admin'],
    },
    {
      path: '/tracker/shows/public',
      element: PublicShows,
      legacy: ['/shows/public'],
    },
    {
      path: '/tracker/shows/my',
      element: MyShows,
      requiresAuth: true,
      legacy: ['/shows/my'],
    },
    {
      path: '/tracker/universes/public',
      element: PublicUniverses,
      legacy: ['/universes/public'],
    },
    {
      path: '/tracker/universes/my',
      element: MyUniverses,
      requiresAuth: true,
      legacy: ['/universes/my'],
    },
    {
      path: '/tracker/universes',
      element: UniversePage,
      legacy: ['/universes'],
    },
    {
      path: '/tracker/universe/:universeSlug',
      element: UniverseDetail,
      legacy: ['/universe/:universeSlug'],
    },
    {
      path: '/tracker/universe/:universeSlug/dashboard',
      element: UniverseDashboard,
      requiresAuth: true,
      legacy: ['/universe/:universeSlug/dashboard'],
    },
    {
      path: '/tracker/show/:showSlug',
      element: ShowDetail,
      legacy: ['/show/:showSlug'],
    },
    {
      path: '/tracker/settings',
      element: Settings,
      requiresAuth: true,
    },
  ],
  navigationItems: [
    {
      label: 'Dashboard',
      path: '/tracker/dashboard',
    },
    {
      label: 'Shows',
      path: '#',
      children: [
        { label: 'Public Shows', path: '/tracker/shows/public' },
        { label: 'My Shows', path: '/tracker/shows/my', requiresAuth: true },
      ],
    },
    {
      label: 'Universes',
      path: '#',
      children: [
        { label: 'Public Universes', path: '/tracker/universes/public' },
        { label: 'My Universes', path: '/tracker/universes/my', requiresAuth: true },
      ],
    },
    {
      label: 'Admin',
      path: '/tracker/admin',
      requiresAuth: true,
    },
  ],
  enabled: true,
};

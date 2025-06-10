
export interface AppModule {
  id: string;
  name: string;
  displayName: string;
  icon: React.ComponentType<{ className?: string }>;
  theme: {
    primary: string;
    secondary: string;
    accent: string;
  };
  routes: AppRoute[];
  navigationItems: NavigationItem[];
  requiresAuth?: boolean;
  enabled: boolean;
}

export interface AppRoute {
  path: string;
  element: React.ComponentType;
  requiresAuth?: boolean;
  legacy?: string[]; // For backward compatibility
}

export interface NavigationItem {
  label: string;
  path: string;
  requiresAuth?: boolean;
  children?: NavigationItem[];
}

// App registry - apps can be enabled/disabled here
export const APP_REGISTRY: Record<string, boolean> = {
  tv: true,
  finance: true,
  inventory: true,
};

export const getEnabledApps = (): string[] => {
  return Object.entries(APP_REGISTRY)
    .filter(([_, enabled]) => enabled)
    .map(([appId]) => appId);
};

export const isAppEnabled = (appId: string): boolean => {
  return APP_REGISTRY[appId] === true;
};

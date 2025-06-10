
import { AppModule, getEnabledApps, isAppEnabled } from './appConfig';
import { tvApp } from './tv/tvApp';
import { financeApp } from './finance/financeApp';
import { inventoryApp } from './inventory/inventoryApp';

// Registry of all available apps
const ALL_APPS: Record<string, AppModule> = {
  tv: tvApp,
  finance: financeApp,
  inventory: inventoryApp,
};

export const getRegisteredApps = (): AppModule[] => {
  const enabledAppIds = getEnabledApps();
  return enabledAppIds
    .map(appId => ALL_APPS[appId])
    .filter(Boolean)
    .filter(app => app.enabled);
};

export const getAppByPath = (pathname: string): AppModule | null => {
  const apps = getRegisteredApps();
  
  for (const app of apps) {
    const isAppRoute = pathname.startsWith(`/${app.name}/`) || 
                      app.routes.some(route => {
                        const routePath = route.path.replace(/:[^/]+/g, '[^/]+');
                        const regex = new RegExp(`^${routePath}$`);
                        return regex.test(pathname);
                      });
    
    if (isAppRoute) {
      return app;
    }
  }
  
  return null;
};

export const getAllRoutes = () => {
  const apps = getRegisteredApps();
  const routes = [];
  
  for (const app of apps) {
    routes.push(...app.routes);
    
    // Add legacy routes for backward compatibility
    for (const route of app.routes) {
      if (route.legacy) {
        for (const legacyPath of route.legacy) {
          routes.push({
            ...route,
            path: legacyPath,
          });
        }
      }
    }
  }
  
  return routes;
};

export const getAppById = (appId: string): AppModule | null => {
  return isAppEnabled(appId) ? ALL_APPS[appId] : null;
};

export { isAppEnabled, getEnabledApps };

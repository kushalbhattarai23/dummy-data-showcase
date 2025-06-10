
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { Menu, X, Settings, Home } from 'lucide-react';
import { getAppByPath, getRegisteredApps } from '@/apps';

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();
  const currentApp = getAppByPath(location.pathname);
  const registeredApps = getRegisteredApps();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Determine navigation color based on current app
  const getNavColorClass = () => {
    if (currentApp) {
      return currentApp.theme.primary;
    }
    return 'bg-sky-500'; // Default color for landing/main pages
  };

  const getTextColorClass = () => {
    if (currentApp) {
      return currentApp.theme.secondary;
    }
    return 'text-sky-100';
  };

  const getHoverColorClass = () => {
    if (currentApp) {
      return currentApp.theme.accent;
    }
    return 'hover:bg-sky-600';
  };

  const navColorClass = getNavColorClass();
  const textColorClass = getTextColorClass();
  const hoverColorClass = getHoverColorClass();

  const renderNavigationItems = (items: any[], isMobile = false) => {
    return items
      .filter(item => !item.requiresAuth || user)
      .map((item, index) => {
        if (item.children) {
          if (isMobile) {
            return item.children
              .filter((child: any) => !child.requiresAuth || user)
              .map((child: any, childIndex: number) => (
                <Link
                  key={`${index}-${childIndex}`}
                  to={child.path}
                  className={`text-sm font-medium transition-colors py-1 ${textColorClass} hover:text-white`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {child.label}
                </Link>
              ));
          } else {
            return (
              <div key={index} className="relative group">
                <span className={`text-xs lg:text-sm font-medium cursor-pointer transition-colors ${textColorClass} hover:text-white`}>
                  {item.label}
                </span>
                <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg py-2 w-36 lg:w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  {item.children
                    .filter((child: any) => !child.requiresAuth || user)
                    .map((child: any, childIndex: number) => (
                      <Link
                        key={childIndex}
                        to={child.path}
                        className="block px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100"
                      >
                        {child.label}
                      </Link>
                    ))}
                </div>
              </div>
            );
          }
        } else {
          const linkClass = isMobile
            ? `text-sm font-medium transition-colors py-1 ${textColorClass} hover:text-white`
            : `text-xs lg:text-sm font-medium transition-colors ${
                isActive(item.path) ? 'text-white' : textColorClass
              } hover:text-white`;

          return (
            <Link
              key={index}
              to={item.path}
              className={linkClass}
              onClick={isMobile ? () => setIsMenuOpen(false) : undefined}
            >
              {item.label}
            </Link>
          );
        }
      });
  };

  return (
    <nav className={`${navColorClass} text-white`}>
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link to="/" className="text-lg sm:text-xl font-bold text-white hover:opacity-80 transition-opacity flex items-center space-x-2">
              <Home className="w-5 h-5 sm:w-6 sm:h-6" />
              <span className="hidden sm:inline">Track Hub</span>
              <span className="sm:hidden">TH</span>
            </Link>

            {/* Current App Navigation */}
            {currentApp && (
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                {renderNavigationItems(currentApp.navigationItems)}
              </div>
            )}

            {/* General Navigation for Track Hub - only show when not in a specific app */}
            {!currentApp && (
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                {registeredApps.map((app) => (
                  <Link
                    key={app.id}
                    to={app.routes[0]?.path || '#'}
                    className={`text-xs lg:text-sm font-medium transition-colors ${textColorClass} hover:text-white`}
                  >
                    {app.displayName}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                <Link 
                  to="/profile"
                  className={`text-xs lg:text-sm font-medium transition-colors ${textColorClass} hover:text-white`}
                >
                  Profile
                </Link>
                <Link 
                  to="/tracker/settings"
                  className={`transition-colors ${textColorClass} hover:text-white`}
                >
                  <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
                </Link>
                <span className={`text-xs lg:text-sm truncate max-w-24 lg:max-w-32 ${textColorClass}`}>
                  {user.email}
                </span>
                <Button 
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  className={`text-xs lg:text-sm text-white border border-white/30 hover:bg-white/10 ${currentApp?.theme.primary.replace('bg-', 'bg-').replace('600', '700')} ${hoverColorClass.replace('hover:bg-', 'hover:bg-').replace('600', '800')}`}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/sign-in">
                  <Button 
                    size="sm" 
                    className={`text-xs lg:text-sm text-white border border-white/30 hover:bg-white/10 ${currentApp?.theme.primary.replace('bg-', 'bg-').replace('600', '700')} ${hoverColorClass.replace('hover:bg-', 'hover:bg-').replace('600', '800')}`}
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className={`text-xs lg:text-sm text-white border-white/30 hover:bg-white/10 ${hoverColorClass}`}
                  >
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`text-white p-1 ${hoverColorClass}`}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className={`md:hidden py-3 border-t border-white/30`}>
            <div className="flex flex-col space-y-2">
              {!currentApp && (
                <>
                  {registeredApps.map((app) => (
                    <Link
                      key={app.id}
                      to={app.routes[0]?.path || '#'}
                      className={`text-sm font-medium transition-colors py-1 ${textColorClass} hover:text-white`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {app.displayName}
                    </Link>
                  ))}
                </>
              )}

              {currentApp && renderNavigationItems(currentApp.navigationItems, true)}
              
              {user ? (
                <div className={`pt-2 border-t border-white/30`}>
                  <Link 
                    to="/profile" 
                    className={`block text-sm font-medium transition-colors py-1 ${textColorClass} hover:text-white`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <Link 
                    to="/tracker/settings" 
                    className={`block text-sm font-medium transition-colors py-1 ${textColorClass} hover:text-white`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <p className={`text-sm mt-2 truncate ${textColorClass}`}>
                    {user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className={`mt-2 w-full justify-start p-0 text-sm font-medium transition-colors ${textColorClass} hover:text-white`}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className={`pt-2 border-t border-white/30 space-y-2`}>
                  <Link to="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      size="sm" 
                      className={`w-full ${currentApp?.theme.primary.replace('bg-', 'bg-').replace('600', '700')} ${hoverColorClass.replace('hover:bg-', 'hover:bg-').replace('600', '800')}`}
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className={`w-full text-white border-white/30 ${hoverColorClass}`}
                    >
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

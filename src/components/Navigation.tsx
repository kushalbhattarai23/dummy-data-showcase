
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/components/auth/AuthProvider';
import { Menu, X, Settings } from 'lucide-react';

export const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  // Check if we're on a finance route
  const isFinanceRoute = location.pathname.startsWith('/finance');
  const isTVRoute = location.pathname.startsWith('/tracker') || 
                   location.pathname.startsWith('/dashboard') || 
                   location.pathname.startsWith('/admin') || 
                   location.pathname.startsWith('/shows') || 
                   location.pathname.startsWith('/universes') || 
                   location.pathname.startsWith('/universe') || 
                   location.pathname.startsWith('/show');

  return (
    <nav className={`${isFinanceRoute ? 'bg-green-600' : isTVRoute ? 'bg-purple-600' : 'bg-background border-b border-border'} text-white`}>
      <div className="container mx-auto px-2 sm:px-4">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center space-x-4 sm:space-x-8">
            <Link to="/" className={`text-lg sm:text-xl font-bold ${isFinanceRoute || isTVRoute ? 'text-white' : 'text-foreground'} hover:opacity-80 transition-opacity flex items-center space-x-2`}>
              <div className={`w-5 h-5 sm:w-6 sm:h-6 ${isFinanceRoute ? 'bg-green-800' : isTVRoute ? 'bg-purple-800' : 'bg-gradient-to-r from-purple-600 to-green-600'} rounded`}></div>
              <span className="hidden sm:inline">Track Hub</span>
              <span className="sm:hidden">TH</span>
            </Link>

            {/* TV Show Navigation */}
            {isTVRoute && (
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <Link 
                  to="/tracker/dashboard" 
                  className={`text-xs lg:text-sm font-medium transition-colors hover:text-purple-200 ${
                    isActive('/tracker/dashboard') || isActive('/dashboard') ? 'text-white' : 'text-purple-100'
                  }`}
                >
                  Dashboard
                </Link>
                <div className="relative group">
                  <span className="text-xs lg:text-sm font-medium text-purple-100 hover:text-purple-200 cursor-pointer">
                    Shows
                  </span>
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg py-2 w-36 lg:w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link to="/tracker/shows/public" className="block px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100">Public Shows</Link>
                    <Link to="/tracker/shows/my" className="block px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100">My Shows</Link>
                  </div>
                </div>
                <div className="relative group">
                  <span className="text-xs lg:text-sm font-medium text-purple-100 hover:text-purple-200 cursor-pointer">
                    Universes
                  </span>
                  <div className="absolute top-full left-0 mt-1 bg-white rounded-md shadow-lg py-2 w-36 lg:w-40 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                    <Link to="/tracker/universes/public" className="block px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100">Public Universes</Link>
                    {user && <Link to="/tracker/universes/my" className="block px-3 lg:px-4 py-2 text-xs lg:text-sm text-gray-700 hover:bg-gray-100">My Universes</Link>}
                  </div>
                </div>
                {user && (
                  <Link 
                    to="/tracker/admin" 
                    className={`text-xs lg:text-sm font-medium transition-colors hover:text-purple-200 ${
                      isActive('/tracker/admin') || isActive('/admin') ? 'text-white' : 'text-purple-100'
                    }`}
                  >
                    Admin
                  </Link>
                )}
              </div>
            )}

            {/* Finance Navigation - Only show if user is logged in */}
            {isFinanceRoute && user && (
              <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
                <Link 
                  to="/finance" 
                  className={`text-xs lg:text-sm font-medium transition-colors hover:text-green-200 ${
                    isActive('/finance') ? 'text-white' : 'text-green-100'
                  }`}
                >
                  Dashboard
                </Link>
                <Link 
                  to="/finance/wallets" 
                  className={`text-xs lg:text-sm font-medium transition-colors hover:text-green-200 ${
                    isActive('/finance/wallets') ? 'text-white' : 'text-green-100'
                  }`}
                >
                  Wallets
                </Link>
                <Link 
                  to="/finance/transactions" 
                  className={`text-xs lg:text-sm font-medium transition-colors hover:text-green-200 ${
                    isActive('/finance/transactions') ? 'text-white' : 'text-green-100'
                  }`}
                >
                  Transactions
                </Link>
                <Link 
                  to="/finance/categories" 
                  className={`text-xs lg:text-sm font-medium transition-colors hover:text-green-200 ${
                    isActive('/finance/categories') ? 'text-white' : 'text-green-100'
                  }`}
                >
                  Categories
                </Link>
                <Link 
                  to="/finance/reports" 
                  className={`text-xs lg:text-sm font-medium transition-colors hover:text-green-200 ${
                    isActive('/finance/reports') ? 'text-white' : 'text-green-100'
                  }`}
                >
                  Reports
                </Link>
              </div>
            )}
          </div>

          {/* Desktop User Section */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {user ? (
              <>
                {(isTVRoute || isFinanceRoute) && (
                  <>
                    <Link 
                      to="/profile"
                      className={`text-xs lg:text-sm font-medium transition-colors ${
                        isFinanceRoute ? 'text-green-100 hover:text-green-200' : 'text-purple-100 hover:text-purple-200'
                      }`}
                    >
                      Profile
                    </Link>
                    <Link 
                      to={isFinanceRoute ? "/finance/settings" : "/tracker/settings"}
                      className={`transition-colors ${
                        isFinanceRoute ? 'text-green-100 hover:text-green-200' : 'text-purple-100 hover:text-purple-200'
                      }`}
                    >
                      <Settings className="h-3 w-3 lg:h-4 lg:w-4" />
                    </Link>
                  </>
                )}
                <span className={`text-xs lg:text-sm truncate max-w-24 lg:max-w-32 ${isFinanceRoute ? 'text-green-100' : isTVRoute ? 'text-purple-100' : 'text-muted-foreground'}`}>
                  {user.email}
                </span>
                <Button 
                  onClick={handleSignOut}
                  variant={isFinanceRoute || isTVRoute ? "secondary" : "default"}
                  size="sm"
                  className={`text-xs lg:text-sm ${isFinanceRoute || isTVRoute ? "bg-white/20 text-white hover:bg-white/30" : ""}`}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/sign-in">
                  <Button size="sm" variant={isFinanceRoute || isTVRoute ? "secondary" : "default"} className={`text-xs lg:text-sm ${isFinanceRoute || isTVRoute ? "bg-white/20 text-white hover:bg-white/30" : ""}`}>
                    Sign In
                  </Button>
                </Link>
                <Link to="/sign-up">
                  <Button size="sm" variant="outline" className={`text-xs lg:text-sm ${isFinanceRoute || isTVRoute ? "border-white/30 text-white hover:bg-white/10" : ""}`}>
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
              className={`${isFinanceRoute || isTVRoute ? "text-white hover:bg-white/20" : ""} p-1`}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-3 border-t border-white/20">
            <div className="flex flex-col space-y-2">
              {isTVRoute && (
                <>
                  <Link 
                    to="/tracker/dashboard" 
                    className="text-sm font-medium text-purple-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/tracker/shows/public" 
                    className="text-sm font-medium text-purple-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Public Shows
                  </Link>
                  {user && (
                    <Link 
                      to="/tracker/shows/my" 
                      className="text-sm font-medium text-purple-100 hover:text-white transition-colors py-1"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      My Shows
                    </Link>
                  )}
                  <Link 
                    to="/tracker/universes/public" 
                    className="text-sm font-medium text-purple-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Public Universes
                  </Link>
                  {user && (
                    <>
                      <Link 
                        to="/tracker/universes/my" 
                        className="text-sm font-medium text-purple-100 hover:text-white transition-colors py-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        My Universes
                      </Link>
                      <Link 
                        to="/tracker/admin" 
                        className="text-sm font-medium text-purple-100 hover:text-white transition-colors py-1"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Admin Portal
                      </Link>
                    </>
                  )}
                </>
              )}

              {isFinanceRoute && user && (
                <>
                  <Link 
                    to="/finance" 
                    className="text-sm font-medium text-green-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/finance/wallets" 
                    className="text-sm font-medium text-green-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Wallets
                  </Link>
                  <Link 
                    to="/finance/transactions" 
                    className="text-sm font-medium text-green-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Transactions
                  </Link>
                  <Link 
                    to="/finance/categories" 
                    className="text-sm font-medium text-green-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Categories
                  </Link>
                  <Link 
                    to="/finance/reports" 
                    className="text-sm font-medium text-green-100 hover:text-white transition-colors py-1"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Reports
                  </Link>
                </>
              )}
              
              {user ? (
                <div className="pt-2 border-t border-white/20">
                  {(isTVRoute || isFinanceRoute) && (
                    <>
                      <Link 
                        to="/profile" 
                        className={`block text-sm font-medium transition-colors py-1 ${
                          isFinanceRoute ? 'text-green-100 hover:text-white' : 'text-purple-100 hover:text-white'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link 
                        to={isFinanceRoute ? "/finance/settings" : "/tracker/settings"} 
                        className={`block text-sm font-medium transition-colors py-1 ${
                          isFinanceRoute ? 'text-green-100 hover:text-white' : 'text-purple-100 hover:text-white'
                        }`}
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Settings
                      </Link>
                    </>
                  )}
                  <p className={`text-sm mt-2 truncate ${isFinanceRoute ? 'text-green-100' : isTVRoute ? 'text-purple-100' : 'text-muted-foreground'}`}>
                    {user.email}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      handleSignOut();
                      setIsMenuOpen(false);
                    }}
                    className={`mt-2 w-full justify-start p-0 text-sm font-medium transition-colors ${
                      isFinanceRoute ? 'text-green-100 hover:text-white' : isTVRoute ? 'text-purple-100 hover:text-white' : 'text-muted-foreground hover:text-primary'
                    }`}
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="pt-2 border-t border-white/20 space-y-2">
                  <Link to="/sign-in" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/sign-up" onClick={() => setIsMenuOpen(false)}>
                    <Button size="sm" variant="outline" className="w-full">
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

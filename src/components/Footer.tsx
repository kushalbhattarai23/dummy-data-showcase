
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tv, DollarSign, Home, Package } from 'lucide-react';

export const Footer: React.FC = () => {
  const location = useLocation();
  
  // Don't show footer on auth pages or landing page
  if (location.pathname.includes('/sign-') || location.pathname === '/' || location.pathname === '/track-hub') {
    return null;
  }

  return (
    <footer className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-6 mb-4 md:mb-0">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Home className="w-5 h-5" />
              <span>Track Hub</span>
            </Link>
            <Link 
              to="/tracker/dashboard" 
              className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 transition-colors"
            >
              <Tv className="w-5 h-5" />
              <span>TV Shows</span>
            </Link>
            <Link 
              to="/finance" 
              className="flex items-center space-x-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <DollarSign className="w-5 h-5" />
              <span>Finance</span>
            </Link>
            <Link 
              to="/inventory" 
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Package className="w-5 h-5" />
              <span>Inventory</span>
            </Link>
            <Link 
              to="/privacy-policy" 
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Privacy Policy
            </Link>
            <Link 
              to="/terms" 
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Terms
            </Link>
            <Link 
              to="/sitemap" 
              className="text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Sitemap
            </Link>
          </div>
          <div className="text-sm text-gray-500">
            © 2024 Track Hub. Manage your entertainment and finances.
          </div>
        </div>
      </div>
    </footer>
  );
};

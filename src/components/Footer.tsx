
import React from 'react';
import { Link } from 'react-router-dom';
import { getRegisteredApps } from '@/apps';

export const Footer: React.FC = () => {
  const registeredApps = getRegisteredApps();

  return (
    <footer className="bg-gray-900 text-white mt-auto">
      <div className="container mx-auto px-2 sm:px-4 py-6 sm:py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          <div className="col-span-1 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-6 h-6 bg-gradient-to-r from-purple-600 to-green-600 rounded"></div>
              <span className="text-lg sm:text-xl font-bold">Track Hub</span>
            </div>
            <p className="text-gray-400 text-sm sm:text-base mb-4">
              Your all-in-one platform for tracking TV shows, managing finances, and organizing your digital life.
            </p>
          </div>

          {/* Dynamically render app sections based on enabled apps */}
          {registeredApps.map((app) => (
            <div key={app.id}>
              <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">{app.displayName}</h3>
              <ul className="space-y-2">
                {app.navigationItems
                  .filter(item => !item.requiresAuth)
                  .slice(0, 3) // Show only first 3 items to keep footer clean
                  .map((item, index) => (
                    <li key={index}>
                      <Link 
                        to={item.path} 
                        className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/sitemap" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <p className="text-gray-400 text-sm sm:text-base text-center sm:text-left">
              © 2024 Track Hub. All rights reserved.
            </p>
            <div className="flex space-x-4 sm:space-x-6">
              <Link to="/privacy-policy" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                Privacy
              </Link>
              <Link to="/terms" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

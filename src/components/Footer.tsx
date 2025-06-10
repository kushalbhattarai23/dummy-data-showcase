
import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
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

          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">TV Shows</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/tracker/shows/public" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Public Shows
                </Link>
              </li>
              <li>
                <Link to="/tracker/universes/public" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Public Universes
                </Link>
              </li>
              <li>
                <Link to="/tracker/dashboard" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-base sm:text-lg mb-3 sm:mb-4">Finance</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/finance" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Dashboard
                </Link>
              </li>
              <li>
                <Link to="/finance/wallets" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Wallets
                </Link>
              </li>
              <li>
                <Link to="/finance/transactions" className="text-gray-400 hover:text-white transition-colors text-sm sm:text-base">
                  Transactions
                </Link>
              </li>
            </ul>
          </div>

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

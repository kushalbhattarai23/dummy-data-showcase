
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { 
  Map, 
  Home, 
  Tv, 
  DollarSign, 
  User, 
  Settings, 
  BarChart3,
  FileText,
  Shield
} from 'lucide-react';

export const Sitemap: React.FC = () => {
  const siteMap = [
    {
      title: "Main Pages",
      icon: <Home className="w-5 h-5" />,
      links: [
        { path: "/", label: "Home / Track Hub", description: "Main landing page" },
        { path: "/sign-in", label: "Sign In", description: "User authentication" },
        { path: "/sign-up", label: "Sign Up", description: "Create new account" },
        { path: "/profile", label: "Profile", description: "User profile management" },
      ]
    },
    {
      title: "TV Show Tracker",
      icon: <Tv className="w-5 h-5" />,
      links: [
        { path: "/tracker/dashboard", label: "Dashboard", description: "TV show tracking overview" },
        { path: "/tracker/shows/public", label: "Public Shows", description: "Browse all available shows" },
        { path: "/tracker/shows/my", label: "My Shows", description: "Your tracked shows" },
        { path: "/tracker/universes/public", label: "Public Universes", description: "Browse show universes" },
        { path: "/tracker/universes/my", label: "My Universes", description: "Your tracked universes" },
        { path: "/tracker/universes", label: "All Universes", description: "Complete universe listing" },
        { path: "/tracker/admin", label: "Admin Portal", description: "Administrative features" },
        { path: "/tracker/settings", label: "Tracker Settings", description: "TV tracker preferences" },
      ]
    },
    {
      title: "Finance Management",
      icon: <DollarSign className="w-5 h-5" />,
      links: [
        { path: "/finance", label: "Finance Dashboard", description: "Financial overview" },
        { path: "/finance/wallets", label: "Wallets", description: "Manage your wallets" },
        { path: "/finance/transactions", label: "Transactions", description: "Track income and expenses" },
        { path: "/finance/categories", label: "Categories", description: "Organize transaction categories" },
        { path: "/finance/reports", label: "Reports", description: "Financial analysis and reports" },
        { path: "/finance/settings", label: "Finance Settings", description: "Financial preferences" },
      ]
    },
    {
      title: "Reports & Analytics",
      icon: <BarChart3 className="w-5 h-5" />,
      links: [
        { path: "/finance/reports", label: "Reports Dashboard", description: "All financial reports" },
      ]
    },
    {
      title: "Legal & Information",
      icon: <FileText className="w-5 h-5" />,
      links: [
        { path: "/privacy-policy", label: "Privacy Policy", description: "Data protection and privacy" },
        { path: "/terms", label: "Terms of Service", description: "Service usage terms" },
        { path: "/sitemap", label: "Sitemap", description: "Site navigation overview" },
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Map className="w-12 h-12 text-purple-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sitemap</h1>
          <p className="text-gray-600 text-lg">
            Navigate through all available pages and features on Track Hub.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {siteMap.map((section, index) => (
            <Card key={index} className="h-fit">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="text-purple-600">{section.icon}</div>
                  <CardTitle className="text-xl text-gray-900">{section.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {section.links.map((link, linkIndex) => (
                    <div key={linkIndex} className="border-l-2 border-purple-200 pl-4 py-2">
                      <Link 
                        to={link.path}
                        className="block group"
                      >
                        <div className="font-medium text-purple-700 group-hover:text-purple-900 transition-colors">
                          {link.label}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {link.description}
                        </div>
                        <div className="text-xs text-gray-400 mt-1 font-mono">
                          {link.path}
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Card className="bg-gradient-to-r from-purple-100 to-blue-100">
            <CardContent className="py-6">
              <div className="flex items-center justify-center mb-4">
                <Shield className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Need Help?
              </h3>
              <p className="text-gray-600">
                If you can't find what you're looking for, feel free to explore our features 
                or contact us for assistance.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};


import React from 'react'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Index from './pages/Index';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Toaster } from "@/components/ui/toaster"
import { AdminPortal } from './pages/AdminPortal';
import { PublicShows } from './pages/PublicShows';
import { MyShows } from './pages/MyShows';
import { PublicUniverses } from './pages/PublicUniverses';
import { MyUniverses } from './pages/MyUniverses';
import { UniversePage } from './pages/UniversePage';
import { UniverseDetail } from './pages/UniverseDetail';
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { ShowDetail } from './pages/ShowDetail';
import { Dashboard } from './pages/Dashboard';
import { UniverseDashboard } from './pages/UniverseDashboard';
import { TrackHub } from './pages/TrackHub';
import { FinanceDashboard } from './pages/FinanceDashboard';
import { Wallets } from './pages/Wallets';
import { WalletDetail } from './pages/WalletDetail';
import { Transactions } from './pages/Transactions';
import { Categories } from './pages/Categories';
import { CategoryDetail } from './pages/CategoryDetail';
import { CategoriesReport } from './pages/CategoriesReport';
import { ReportsDashboard } from './pages/ReportsDashboard';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';
import { Sitemap } from './pages/Sitemap';
import { InventoryDashboard } from './pages/InventoryDashboard';
import { CreateOrganization } from './pages/CreateOrganization';
import { OrganizationDetail } from './pages/OrganizationDetail';
import { LandingDashboard } from './pages/LandingDashboard';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex-1 w-full">
              <Routes>
                <Route path="/" element={<LandingDashboard />} />
                <Route path="/track-hub" element={<TrackHub />} />
                
                {/* TV Show Tracker Routes */}
                <Route path="/tracker/dashboard" element={<Dashboard />} />
                <Route path="/tracker/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
                <Route path="/tracker/shows/public" element={<PublicShows />} />
                <Route path="/tracker/shows/my" element={<ProtectedRoute><MyShows /></ProtectedRoute>} />
                <Route path="/tracker/universes/public" element={<PublicUniverses />} />
                <Route path="/tracker/universes/my" element={<ProtectedRoute><MyUniverses /></ProtectedRoute>} />
                <Route path="/tracker/universes" element={<UniversePage />} />
                <Route path="/tracker/universe/:universeSlug" element={<UniverseDetail />} />
                <Route path="/tracker/universe/:universeSlug/dashboard" element={<ProtectedRoute><UniverseDashboard /></ProtectedRoute>} />
                <Route path="/tracker/show/:showSlug" element={<ShowDetail />} />
                <Route path="/tracker/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* Legacy routes for backward compatibility */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<ProtectedRoute><AdminPortal /></ProtectedRoute>} />
                <Route path="/shows/public" element={<PublicShows />} />
                <Route path="/shows/my" element={<ProtectedRoute><MyShows /></ProtectedRoute>} />
                <Route path="/universes/public" element={<PublicUniverses />} />
                <Route path="/universes/my" element={<ProtectedRoute><MyUniverses /></ProtectedRoute>} />
                <Route path="/universes" element={<UniversePage />} />
                <Route path="/universe/:universeSlug" element={<UniverseDetail />} />
                <Route path="/universe/:universeSlug/dashboard" element={<ProtectedRoute><UniverseDashboard /></ProtectedRoute>} />
                <Route path="/show/:showSlug" element={<ShowDetail />} />
                
                {/* Finance Routes - All protected */}
                <Route path="/finance" element={<ProtectedRoute><FinanceDashboard /></ProtectedRoute>} />
                <Route path="/finance/wallets" element={<ProtectedRoute><Wallets /></ProtectedRoute>} />
                <Route path="/finance/wallets/:walletId" element={<ProtectedRoute><WalletDetail /></ProtectedRoute>} />
                <Route path="/finance/transactions" element={<ProtectedRoute><Transactions /></ProtectedRoute>} />
                <Route path="/finance/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                <Route path="/finance/categories/:categoryId" element={<ProtectedRoute><CategoryDetail /></ProtectedRoute>} />
                <Route path="/finance/reports" element={<ProtectedRoute><ReportsDashboard /></ProtectedRoute>} />
                <Route path="/finance/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                
                {/* Inventory Routes */}
                <Route path="/inventory" element={<InventoryDashboard />} />
                <Route path="/inventory/organizations/new" element={<CreateOrganization />} />
                <Route path="/inventory/organizations/:organizationId" element={<OrganizationDetail />} />
                
                {/* Auth Routes */}
                <Route path="/sign-in" element={<SignIn />} />
                <Route path="/sign-up" element={<SignUp />} />
                
                {/* Profile Route */}
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                
                {/* Legal Pages */}
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/sitemap" element={<Sitemap />} />
              </Routes>
            </main>
            <Footer />
          </div>
          <Toaster />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

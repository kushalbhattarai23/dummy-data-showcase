
import React from 'react'; 
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './components/auth/AuthProvider';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import Index from './pages/Index';
import { Navigation } from './components/Navigation';
import { Footer } from './components/Footer';
import { Toaster } from "@/components/ui/toaster"
import { SignIn } from './pages/SignIn';
import { SignUp } from './pages/SignUp';
import { Profile } from './pages/Profile';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { Terms } from './pages/Terms';
import { Sitemap } from './pages/Sitemap';
import { LandingDashboard } from './pages/LandingDashboard';
import { getAllRoutes } from './apps';

// Create a client
const queryClient = new QueryClient();

function App() {
  const appRoutes = getAllRoutes();

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen bg-background flex flex-col">
            <Navigation />
            <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8 flex-1 w-full">
              <Routes>
                <Route path="/" element={<LandingDashboard />} />
                <Route path="/track-hub" element={<LandingDashboard />} />
                
                {/* Dynamic app routes */}
                {appRoutes.map((route, index) => {
                  const RouteElement = route.requiresAuth ? (
                    <ProtectedRoute>
                      <route.element />
                    </ProtectedRoute>
                  ) : (
                    <route.element />
                  );

                  return (
                    <Route 
                      key={`${route.path}-${index}`} 
                      path={route.path} 
                      element={RouteElement} 
                    />
                  );
                })}
                
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

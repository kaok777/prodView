import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect, lazy, Suspense } from "react";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import { CookieBanner } from "./components/CookieBanner";
import { CookiePreferencesModal } from "./components/CookiePreferencesModal";
import { HomePage } from "./pages/HomePage";
import { ProductSelectionPage } from "./pages/ProductSelectionPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NavigationService } from "./services/NavigationService";
import { PrivacyPolicyPage } from "./pages/legal/PrivacyPolicyPage";
import { CookiePolicyPage } from "./pages/legal/CookiePolicyPage";
import { TermsPage } from "./pages/legal/TermsPage";
import { AffiliateDisclosurePage } from "./pages/legal/AffiliateDisclosurePage";
import { DisclaimerPage } from "./pages/legal/DisclaimerPage";
import { ExternalLinksNoticePage } from "./pages/legal/ExternalLinksNoticePage";
import { PopiaContactPage } from "./pages/legal/PopiaContactPage";

// Fixed: P3.2.2 - Code-split admin routes to reduce main bundle size by ~30%
// Admin pages are lazy-loaded only when user navigates to admin routes
// This improves initial page load for 99% of visitors who never access admin
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ProductEditorPage = lazy(() => import("./pages/admin/ProductEditorPage"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const CategoriesManagementPage = lazy(() => import("./pages/admin/CategoriesManagementPage"));
const UseCasesManagementPage = lazy(() => import("./pages/admin/UseCasesManagementPage"));

/**
 * Internal component to initialize NavigationService with navigate function
 * Must be inside Router context to access useNavigate hook
 */
function NavigationServiceInitializer() {
  const navigate = useNavigate();

  useEffect(() => {
    NavigationService.setNavigate(navigate);
  }, [navigate]);

  return null;
}

/**
 * Loading fallback for lazy-loaded routes
 * Displays centered spinner while admin pages are loading
 */
function RouteLoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <NavigationServiceInitializer />
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
            {/* Admin Routes - Wrapped in Suspense for code splitting (P3.2.2) */}
            <Route
              path="/admin/login"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <RouteErrorBoundary routeName="AdminLogin">
                    <AdminLoginPage />
                  </RouteErrorBoundary>
                </Suspense>
              }
            />
            <Route
              path="/admin"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <RouteErrorBoundary routeName="AdminDashboard">
                    <ProtectedRoute>
                      <Layout>
                        <AdminDashboard />
                      </Layout>
                    </ProtectedRoute>
                  </RouteErrorBoundary>
                </Suspense>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <RouteErrorBoundary routeName="AdminAnalytics">
                    <ProtectedRoute>
                      <Layout>
                        <AdminAnalytics />
                      </Layout>
                    </ProtectedRoute>
                  </RouteErrorBoundary>
                </Suspense>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <RouteErrorBoundary routeName="ProductEditor">
                    <ProtectedRoute>
                      <Layout>
                        <ProductEditorPage />
                      </Layout>
                    </ProtectedRoute>
                  </RouteErrorBoundary>
                </Suspense>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <RouteErrorBoundary routeName="ProductEditor">
                    <ProtectedRoute>
                      <Layout>
                        <ProductEditorPage />
                      </Layout>
                    </ProtectedRoute>
                  </RouteErrorBoundary>
                </Suspense>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <RouteErrorBoundary routeName="CategoriesManagement">
                    <ProtectedRoute>
                      <Layout>
                        <CategoriesManagementPage />
                      </Layout>
                    </ProtectedRoute>
                  </RouteErrorBoundary>
                </Suspense>
              }
            />
            <Route
              path="/admin/use-cases"
              element={
                <Suspense fallback={<RouteLoadingFallback />}>
                  <RouteErrorBoundary routeName="UseCasesManagement">
                    <ProtectedRoute>
                      <Layout>
                        <UseCasesManagementPage />
                      </Layout>
                    </ProtectedRoute>
                  </RouteErrorBoundary>
                </Suspense>
              }
            />

            {/* Public Routes */}
            <Route
              path="/"
              element={
                <RouteErrorBoundary routeName="HomePage">
                  <Layout>
                    <HomePage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/products"
              element={
                <RouteErrorBoundary routeName="ProductSelection">
                  <Layout>
                    <ProductSelectionPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/products/:id"
              element={
                <RouteErrorBoundary routeName="ProductDetail">
                  <Layout>
                    <ProductDetailPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />

            {/* Legal Pages */}
            <Route
              path="/privacy-policy"
              element={
                <RouteErrorBoundary routeName="PrivacyPolicy">
                  <Layout>
                    <PrivacyPolicyPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/cookie-policy"
              element={
                <RouteErrorBoundary routeName="CookiePolicy">
                  <Layout>
                    <CookiePolicyPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/terms"
              element={
                <RouteErrorBoundary routeName="Terms">
                  <Layout>
                    <TermsPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/affiliate-disclosure"
              element={
                <RouteErrorBoundary routeName="AffiliateDisclosure">
                  <Layout>
                    <AffiliateDisclosurePage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/disclaimer"
              element={
                <RouteErrorBoundary routeName="Disclaimer">
                  <Layout>
                    <DisclaimerPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/external-links"
              element={
                <RouteErrorBoundary routeName="ExternalLinks">
                  <Layout>
                    <ExternalLinksNoticePage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/popia"
              element={
                <RouteErrorBoundary routeName="PopiaContact">
                  <Layout>
                    <PopiaContactPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />

            {/* 404 Catch-All Route */}
            <Route
              path="*"
              element={
                <RouteErrorBoundary routeName="NotFound">
                  <Layout>
                    <NotFoundPage />
                  </Layout>
                </RouteErrorBoundary>
              }
            />
            </Routes>
            <Toaster />
            <CookieBanner />
            <CookiePreferencesModal />
          </div>
        </Router>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

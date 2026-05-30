import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import { Toaster } from "sonner";
import { useEffect } from "react";
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
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ProductEditorPage } from "./pages/admin/ProductEditorPage";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { CategoriesManagementPage } from "./pages/admin/CategoriesManagementPage";
import { UseCasesManagementPage } from "./pages/admin/UseCasesManagementPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { NavigationService } from "./services/NavigationService";
import { PrivacyPolicyPage } from "./pages/legal/PrivacyPolicyPage";
import { CookiePolicyPage } from "./pages/legal/CookiePolicyPage";
import { TermsPage } from "./pages/legal/TermsPage";
import { AffiliateDisclosurePage } from "./pages/legal/AffiliateDisclosurePage";
import { DisclaimerPage } from "./pages/legal/DisclaimerPage";
import { ExternalLinksNoticePage } from "./pages/legal/ExternalLinksNoticePage";
import { PopiaContactPage } from "./pages/legal/PopiaContactPage";

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

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <Router>
          <NavigationServiceInitializer />
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
            {/* Admin Routes */}
            <Route
              path="/admin/login"
              element={
                <RouteErrorBoundary routeName="AdminLogin">
                  <AdminLoginPage />
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/admin"
              element={
                <RouteErrorBoundary routeName="AdminDashboard">
                  <ProtectedRoute>
                    <Layout>
                      <AdminDashboard />
                    </Layout>
                  </ProtectedRoute>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <RouteErrorBoundary routeName="AdminAnalytics">
                  <ProtectedRoute>
                    <Layout>
                      <AdminAnalytics />
                    </Layout>
                  </ProtectedRoute>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <RouteErrorBoundary routeName="ProductEditor">
                  <ProtectedRoute>
                    <Layout>
                      <ProductEditorPage />
                    </Layout>
                  </ProtectedRoute>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <RouteErrorBoundary routeName="ProductEditor">
                  <ProtectedRoute>
                    <Layout>
                      <ProductEditorPage />
                    </Layout>
                  </ProtectedRoute>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <RouteErrorBoundary routeName="CategoriesManagement">
                  <ProtectedRoute>
                    <Layout>
                      <CategoriesManagementPage />
                    </Layout>
                  </ProtectedRoute>
                </RouteErrorBoundary>
              }
            />
            <Route
              path="/admin/use-cases"
              element={
                <RouteErrorBoundary routeName="UseCasesManagement">
                  <ProtectedRoute>
                    <Layout>
                      <UseCasesManagementPage />
                    </Layout>
                  </ProtectedRoute>
                </RouteErrorBoundary>
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

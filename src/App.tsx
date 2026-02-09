import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Layout } from "./components/Layout";
import { SecurityHeaders } from "./components/SecurityHeaders";
import { HomePage } from "./pages/HomePage";
import { ProductSelectionPage } from "./pages/ProductSelectionPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { AdminLoginPage } from "./pages/admin/AdminLoginPage";
import { AdminDashboard } from "./pages/admin/AdminDashboard";
import { ProductEditorPage } from "./pages/admin/ProductEditorPage";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { CategoriesManagementPage } from "./pages/admin/CategoriesManagementPage";
import { UseCasesManagementPage } from "./pages/admin/UseCasesManagementPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export default function App() {
  return (
    <ThemeProvider>
      <SecurityHeaders />
      <Router>
        <div className="min-h-screen bg-background text-foreground">
          <Routes>
            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute>
                  <Layout>
                    <AdminAnalytics />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/new"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductEditorPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products/:id/edit"
              element={
                <ProtectedRoute>
                  <Layout>
                    <ProductEditorPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/categories"
              element={
                <ProtectedRoute>
                  <Layout>
                    <CategoriesManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/use-cases"
              element={
                <ProtectedRoute>
                  <Layout>
                    <UseCasesManagementPage />
                  </Layout>
                </ProtectedRoute>
              }
            />

            {/* Public Routes */}
            <Route
              path="/"
              element={
                <Layout>
                  <HomePage />
                </Layout>
              }
            />
            <Route
              path="/products"
              element={
                <Layout>
                  <ProductSelectionPage />
                </Layout>
              }
            />
            <Route
              path="/products/:id"
              element={
                <Layout>
                  <ProductDetailPage />
                </Layout>
              }
            />
          </Routes>
          <Toaster />
        </div>
      </Router>
    </ThemeProvider>
  );
}

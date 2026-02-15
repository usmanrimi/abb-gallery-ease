import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/admin/AdminLogin";
import Categories from "./pages/Categories";
import CategoryDetail from "./pages/CategoryDetail";
import PackageDetail from "./pages/PackageDetail";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Orders from "./pages/Orders";
import Cart from "./pages/Cart";
import About from "./pages/About";
import Contact from "./pages/Contact";
import CustomerDashboard from "./pages/CustomerDashboard";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminCategories from "./pages/admin/AdminCategories";
import AdminPackages from "./pages/admin/AdminPackages";
import AdminCustomers from "./pages/admin/AdminCustomers";
import AdminOrders from "./pages/admin/AdminOrders";
import AdminDeliveries from "./pages/admin/AdminDeliveries";
import AdminReports from "./pages/admin/AdminReports";
import AdminSettings from "./pages/admin/AdminSettings";
import SuperAdminDashboard from "./pages/superadmin/SuperAdminDashboard";
import SuperAdminManagement from "./pages/superadmin/SuperAdminManagement";
import SuperAdminAuditLog from "./pages/superadmin/SuperAdminAuditLog";
import SuperAdminSettings from "./pages/superadmin/SuperAdminSettings";
import SuperAdminCustomers from "./pages/superadmin/SuperAdminCustomers";
import SuperAdminQA from "./pages/superadmin/SuperAdminQA";
import SuperAdminAnalytics from "./pages/superadmin/SuperAdminAnalytics";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CartProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/categories/:slug" element={<CategoryDetail />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />

              {/* Protected Routes - Require Login */}
              <Route path="/package/:id" element={
                <ProtectedRoute>
                  <PackageDetail />
                </ProtectedRoute>
              } />
              <Route path="/cart" element={
                <ProtectedRoute>
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <Checkout />
                </ProtectedRoute>
              } />
              <Route path="/order-confirmation" element={
                <ProtectedRoute>
                  <OrderConfirmation />
                </ProtectedRoute>
              } />
              <Route path="/orders" element={
                <ProtectedRoute>
                  <Orders />
                </ProtectedRoute>
              } />

              {/* Protected Customer Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute allowedRole="customer">
                  <CustomerDashboard />
                </ProtectedRoute>
              } />

              {/* Protected Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/packages" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminPackages />
                </ProtectedRoute>
              } />
              <Route path="/admin/categories" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminCategories />
                </ProtectedRoute>
              } />
              <Route path="/admin/customers" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminCustomers />
                </ProtectedRoute>
              } />
              <Route path="/admin/orders" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminOrders />
                </ProtectedRoute>
              } />
              <Route path="/admin/deliveries" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminDeliveries />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminReports />
                </ProtectedRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedRoute allowedRole="admin_ops">
                  <AdminSettings />
                </ProtectedRoute>
              } />

              {/* Protected Super Admin Routes */}
              <Route path="/super-admin" element={
                <ProtectedRoute allowedRole="super_admin">
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/super-admin/admins" element={
                <ProtectedRoute allowedRole="super_admin">
                  <SuperAdminManagement />
                </ProtectedRoute>
              } />
              <Route path="/super-admin/customers" element={
                <ProtectedRoute allowedRole="super_admin">
                  <SuperAdminCustomers />
                </ProtectedRoute>
              } />
              <Route path="/super-admin/qa" element={
                <ProtectedRoute allowedRole="super_admin">
                  <SuperAdminQA />
                </ProtectedRoute>
              } />
              <Route path="/super-admin/analytics" element={
                <ProtectedRoute allowedRole="super_admin">
                  <SuperAdminAnalytics />
                </ProtectedRoute>
              } />
              <Route path="/super-admin/audit-log" element={
                <ProtectedRoute allowedRole="super_admin">
                  <SuperAdminAuditLog />
                </ProtectedRoute>
              } />
              <Route path="/super-admin/settings" element={
                <ProtectedRoute allowedRole="super_admin">
                  <SuperAdminSettings />
                </ProtectedRoute>
              } />

              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </CartProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

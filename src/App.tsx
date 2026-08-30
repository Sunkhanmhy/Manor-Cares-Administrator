import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './lib/toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute, RequirePermission } from './components/PermissionRoute';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardRouter } from './pages/dashboard/DashboardRouter';
import { CustomersPage } from './pages/dashboard/CustomersPage';
import { CustomerDetailPage } from './pages/dashboard/CustomerDetailPage';
import { BookingsPage } from './pages/dashboard/BookingsPage';
import { ServicesPage } from './pages/dashboard/ServicesPage';
import { TransportationPage } from './pages/dashboard/TransportationPage';
import { HRPage } from './pages/dashboard/HRPage';
import { FinancePage } from './pages/dashboard/FinancePage';
import { PaymentsPage } from './pages/dashboard/PaymentsPage';
import { InvoicesPage } from './pages/dashboard/InvoicesPage';
import { SalesPage } from './pages/dashboard/SalesPage';
import { MarketingPage } from './pages/dashboard/MarketingPage';
import { SupportHubPage } from './pages/dashboard/SupportHubPage';
import { ReviewsPage } from './pages/dashboard/ReviewsPage';
import { TechnicalPage } from './pages/dashboard/TechnicalPage';
import { ReportsPage } from './pages/dashboard/ReportsPage';
import { NotificationsPage } from './pages/dashboard/NotificationsPage';
import { AdminManagementPage } from './pages/dashboard/AdminManagementPage';
import { AuditLogPage } from './pages/dashboard/AuditLogPage';
import { SettingsPage } from './pages/dashboard/SettingsPage';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<AdminLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardLayout />}>
                <Route index element={<DashboardRouter />} />

                <Route
                  path="customers"
                  element={
                    <PermissionRoute permission="customers.view">
                      <CustomersPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="customers/:id"
                  element={
                    <PermissionRoute permission="customers.view">
                      <CustomerDetailPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="bookings"
                  element={
                    <PermissionRoute permission="bookings.view">
                      <BookingsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="services"
                  element={
                    <PermissionRoute permission="sales.view">
                      <ServicesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="transportation"
                  element={
                    <PermissionRoute permission="transportation.view">
                      <TransportationPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="hr"
                  element={
                    <PermissionRoute permission="staff.view">
                      <HRPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="finance"
                  element={
                    <PermissionRoute permission="finance.view">
                      <FinancePage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <PermissionRoute permission="finance.view">
                      <PaymentsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="invoices"
                  element={
                    <PermissionRoute permission="finance.view">
                      <InvoicesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="sales"
                  element={
                    <PermissionRoute permission="sales.view">
                      <SalesPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="marketing"
                  element={
                    <PermissionRoute permission="marketing.view">
                      <MarketingPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="support-hub"
                  element={
                    <PermissionRoute permission="support.view">
                      <SupportHubPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="reviews"
                  element={
                    <PermissionRoute permission="customers.view">
                      <ReviewsPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="technical"
                  element={
                    <PermissionRoute permission="technical.view">
                      <TechnicalPage />
                    </PermissionRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <PermissionRoute permission="reports.view">
                      <ReportsPage />
                    </PermissionRoute>
                  }
                />
                <Route path="notifications" element={<NotificationsPage />} />
                <Route
                  path="admins"
                  element={
                    <RequirePermission permission="admins.manage">
                      <AdminManagementPage />
                    </RequirePermission>
                  }
                />
                <Route
                  path="audit-log"
                  element={
                    <PermissionRoute permission="audit.view">
                      <AuditLogPage />
                    </PermissionRoute>
                  }
                />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

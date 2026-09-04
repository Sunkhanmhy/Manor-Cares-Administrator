import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './lib/toast';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PermissionRoute, RequirePermission } from './components/PermissionRoute';
import { FullPageSpinner } from './components/Spinner';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { DashboardLayout } from './pages/dashboard/DashboardLayout';
import { DashboardRouter } from './pages/dashboard/DashboardRouter';

// Route-level code splitting: every dashboard module is its own chunk, only fetched the
// first time an admin actually navigates to it, instead of one 500kB+ upfront bundle.
const CustomersPage = lazy(() => import('./pages/dashboard/CustomersPage').then((m) => ({ default: m.CustomersPage })));
const CustomerDetailPage = lazy(() =>
  import('./pages/dashboard/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage }))
);
const BookingsPage = lazy(() => import('./pages/dashboard/BookingsPage').then((m) => ({ default: m.BookingsPage })));
const ServicesPage = lazy(() => import('./pages/dashboard/ServicesPage').then((m) => ({ default: m.ServicesPage })));
const TransportationPage = lazy(() =>
  import('./pages/dashboard/TransportationPage').then((m) => ({ default: m.TransportationPage }))
);
const HRPage = lazy(() => import('./pages/dashboard/HRPage').then((m) => ({ default: m.HRPage })));
const FinancePage = lazy(() => import('./pages/dashboard/FinancePage').then((m) => ({ default: m.FinancePage })));
const PaymentsPage = lazy(() => import('./pages/dashboard/PaymentsPage').then((m) => ({ default: m.PaymentsPage })));
const InvoicesPage = lazy(() => import('./pages/dashboard/InvoicesPage').then((m) => ({ default: m.InvoicesPage })));
const SalesPage = lazy(() => import('./pages/dashboard/SalesPage').then((m) => ({ default: m.SalesPage })));
const MarketingPage = lazy(() => import('./pages/dashboard/MarketingPage').then((m) => ({ default: m.MarketingPage })));
const SupportHubPage = lazy(() =>
  import('./pages/dashboard/SupportHubPage').then((m) => ({ default: m.SupportHubPage }))
);
const ReviewsPage = lazy(() => import('./pages/dashboard/ReviewsPage').then((m) => ({ default: m.ReviewsPage })));
const TechnicalPage = lazy(() => import('./pages/dashboard/TechnicalPage').then((m) => ({ default: m.TechnicalPage })));
const ReportsPage = lazy(() => import('./pages/dashboard/ReportsPage').then((m) => ({ default: m.ReportsPage })));
const NotificationsPage = lazy(() =>
  import('./pages/dashboard/NotificationsPage').then((m) => ({ default: m.NotificationsPage }))
);
const AdminManagementPage = lazy(() =>
  import('./pages/dashboard/AdminManagementPage').then((m) => ({ default: m.AdminManagementPage }))
);
const AuditLogPage = lazy(() => import('./pages/dashboard/AuditLogPage').then((m) => ({ default: m.AuditLogPage })));
const SettingsPage = lazy(() => import('./pages/dashboard/SettingsPage').then((m) => ({ default: m.SettingsPage })));

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
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <CustomersPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="customers/:id"
                  element={
                    <PermissionRoute permission="customers.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <CustomerDetailPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="bookings"
                  element={
                    <PermissionRoute permission="bookings.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <BookingsPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="services"
                  element={
                    <PermissionRoute permission="sales.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <ServicesPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="transportation"
                  element={
                    <PermissionRoute permission="transportation.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <TransportationPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="hr"
                  element={
                    <PermissionRoute permission="staff.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <HRPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="finance"
                  element={
                    <PermissionRoute permission="finance.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <FinancePage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="payments"
                  element={
                    <PermissionRoute permission="finance.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <PaymentsPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="invoices"
                  element={
                    <PermissionRoute permission="finance.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <InvoicesPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="sales"
                  element={
                    <PermissionRoute permission="sales.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <SalesPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="marketing"
                  element={
                    <PermissionRoute permission="marketing.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <MarketingPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="support-hub"
                  element={
                    <PermissionRoute permission="support.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <SupportHubPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="reviews"
                  element={
                    <PermissionRoute permission="customers.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <ReviewsPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="technical"
                  element={
                    <PermissionRoute permission="technical.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <TechnicalPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="reports"
                  element={
                    <PermissionRoute permission="reports.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <ReportsPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="notifications"
                  element={
                    <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                      <NotificationsPage />
                    </Suspense>
                  }
                />
                <Route
                  path="admins"
                  element={
                    <RequirePermission permission="admins.manage">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <AdminManagementPage />
                      </Suspense>
                    </RequirePermission>
                  }
                />
                <Route
                  path="audit-log"
                  element={
                    <PermissionRoute permission="audit.view">
                      <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                        <AuditLogPage />
                      </Suspense>
                    </PermissionRoute>
                  }
                />
                <Route
                  path="settings"
                  element={
                    <Suspense fallback={<FullPageSpinner label="Loading…" />}>
                      <SettingsPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;

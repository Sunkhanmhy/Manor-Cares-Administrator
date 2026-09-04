import { lazy, Suspense } from 'react';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../../components/EmptyState';
import { FullPageSpinner } from '../../components/Spinner';
import type { RoleKey } from '../../lib/permissions';

// Lazily loaded: an admin only ever lands on ONE of these per session (their own role's
// dashboard, or Super Admin's), so there's no reason to ship all 8 in the main bundle.
const SuperAdminDashboard = lazy(() =>
  import('./SuperAdminDashboard').then((m) => ({ default: m.SuperAdminDashboard }))
);
const HRDashboard = lazy(() => import('./HRDashboard').then((m) => ({ default: m.HRDashboard })));
const CustomerRelationsDashboard = lazy(() =>
  import('./CustomerRelationsDashboard').then((m) => ({ default: m.CustomerRelationsDashboard }))
);
const MarketingDashboard = lazy(() =>
  import('./MarketingDashboard').then((m) => ({ default: m.MarketingDashboard }))
);
const SalesDashboard = lazy(() => import('./SalesDashboard').then((m) => ({ default: m.SalesDashboard })));
const FinanceDashboard = lazy(() => import('./FinanceDashboard').then((m) => ({ default: m.FinanceDashboard })));
const TechnicalDashboard = lazy(() =>
  import('./TechnicalDashboard').then((m) => ({ default: m.TechnicalDashboard }))
);
const TransportationDashboard = lazy(() =>
  import('./TransportationDashboard').then((m) => ({ default: m.TransportationDashboard }))
);

const ROLE_DASHBOARDS: Partial<Record<RoleKey, React.ComponentType>> = {
  hr: HRDashboard,
  customer_support: CustomerRelationsDashboard,
  marketing: MarketingDashboard,
  sales: SalesDashboard,
  finance: FinanceDashboard,
  technical: TechnicalDashboard,
  transportation: TransportationDashboard,
};

/** Identifies the signed-in admin's role and routes them to the correct dashboard. */
export function DashboardRouter() {
  const { isSuperAdmin, roleKeys } = useAuth();

  const primaryRole = roleKeys[0];
  const RoleDashboard = isSuperAdmin ? SuperAdminDashboard : primaryRole ? ROLE_DASHBOARDS[primaryRole] : undefined;

  if (!RoleDashboard) {
    return (
      <EmptyState
        icon="🧭"
        title="No dashboard assigned"
        message="Your account does not have a role assigned yet. Contact your Super Admin to get access to a dashboard."
      />
    );
  }

  return (
    <Suspense fallback={<FullPageSpinner label="Loading dashboard…" />}>
      <RoleDashboard />
    </Suspense>
  );
}

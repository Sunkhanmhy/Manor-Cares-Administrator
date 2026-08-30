import { useAuth } from '../../context/AuthContext';
import { SuperAdminDashboard } from './SuperAdminDashboard';
import { HRDashboard } from './HRDashboard';
import { CustomerRelationsDashboard } from './CustomerRelationsDashboard';
import { MarketingDashboard } from './MarketingDashboard';
import { SalesDashboard } from './SalesDashboard';
import { FinanceDashboard } from './FinanceDashboard';
import { TechnicalDashboard } from './TechnicalDashboard';
import { TransportationDashboard } from './TransportationDashboard';
import { EmptyState } from '../../components/EmptyState';
import type { RoleKey } from '../../lib/permissions';

const ROLE_DASHBOARDS: Partial<Record<RoleKey, () => React.JSX.Element>> = {
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

  if (isSuperAdmin) return <SuperAdminDashboard />;

  const primaryRole = roleKeys[0];
  const RoleDashboard = primaryRole ? ROLE_DASHBOARDS[primaryRole] : undefined;

  if (RoleDashboard) return <RoleDashboard />;

  return (
    <EmptyState
      icon="🧭"
      title="No dashboard assigned"
      message="Your account does not have a role assigned yet. Contact your Super Admin to get access to a dashboard."
    />
  );
}

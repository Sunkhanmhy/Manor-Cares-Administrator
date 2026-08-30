import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../lib/permissions';
import type { PermissionKey } from '../lib/permissions';

interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  perm?: PermissionKey;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: '📊', end: true },
  { to: '/dashboard/customers', label: 'Customers', icon: '👥', perm: 'customers.view' },
  { to: '/dashboard/bookings', label: 'Bookings', icon: '📅', perm: 'bookings.view' },
  { to: '/dashboard/services', label: 'Cleaning Services', icon: '🧽', perm: 'sales.view' },
  { to: '/dashboard/transportation', label: 'Cleaning Teams & Transport', icon: '🚐', perm: 'transportation.view' },
  { to: '/dashboard/hr', label: 'Staff / HR', icon: '🧑\u200d💼', perm: 'staff.view' },
  { to: '/dashboard/finance', label: 'Finance', icon: '💰', perm: 'finance.view' },
  { to: '/dashboard/payments', label: 'Payments', icon: '💳', perm: 'finance.view' },
  { to: '/dashboard/invoices', label: 'Invoices', icon: '🧾', perm: 'finance.view' },
  { to: '/dashboard/sales', label: 'Sales', icon: '📈', perm: 'sales.view' },
  { to: '/dashboard/marketing', label: 'Marketing', icon: '📣', perm: 'marketing.view' },
  { to: '/dashboard/support-hub', label: 'Customer Support', icon: '🎧', perm: 'support.view' },
  { to: '/dashboard/reviews', label: 'Reviews', icon: '⭐', perm: 'customers.view' },
  { to: '/dashboard/technical', label: 'Technical Support', icon: '🛠️', perm: 'technical.view' },
  { to: '/dashboard/reports', label: 'Reports', icon: '📑', perm: 'reports.view' },
  { to: '/dashboard/notifications', label: 'Notifications', icon: '🔔' },
  { to: '/dashboard/admins', label: 'Admin Management', icon: '🛡️', perm: 'admins.manage' },
  { to: '/dashboard/audit-log', label: 'Audit Log', icon: '📜', perm: 'audit.view' },
  { to: '/dashboard/settings', label: 'Settings', icon: '⚙️' },
];

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { profile, adminProfile, roleKeys, isSuperAdmin, hasPermission, signOut } = useAuth();

  const visibleItems = NAV_ITEMS.filter((item) => !item.perm || isSuperAdmin || hasPermission(item.perm));
  const primaryRoleLabel = isSuperAdmin ? ROLE_LABELS.super_admin : roleKeys.map((r) => ROLE_LABELS[r]).join(', ') || 'Staff';

  return (
    <>
      {open && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,10,20,0.55)', zIndex: 40 }}
          className="sidebar-backdrop"
        />
      )}
      <aside className={`glass-strong sidebar ${open ? 'sidebar-open' : ''}`}>
        <div style={{ padding: '24px 20px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, var(--clr-blue), var(--clr-green))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: 'var(--clr-white)',
            }}
          >
            MC
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--clr-white)' }}>Manor-Cares</div>
            <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Administration Portal</div>
          </div>
        </div>

        <div style={{ padding: '0 16px 12px' }}>
          <span className="role-pill">{primaryRoleLabel}</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '4px 12px', overflowY: 'auto', flex: 1 }}>
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end ?? false}
              onClick={onClose}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            >
              <span aria-hidden="true">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 16, borderTop: '1px solid var(--glass-border)' }}>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 2 }}>
            {profile?.first_name} {profile?.last_name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>{adminProfile?.employee_code}</div>
          <button className="btn btn-ghost btn-block" onClick={() => signOut()}>
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  );
}

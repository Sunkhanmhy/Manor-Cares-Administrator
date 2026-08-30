import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from '../../components/Sidebar';
import { Topbar } from '../../components/Topbar';

const TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Overview',
  '/dashboard/customers': 'Customer Management',
  '/dashboard/bookings': 'Booking Management',
  '/dashboard/services': 'Cleaning Services',
  '/dashboard/transportation': 'Cleaning Teams & Transportation',
  '/dashboard/hr': 'HR & Staff',
  '/dashboard/finance': 'Finance',
  '/dashboard/payments': 'Payments',
  '/dashboard/invoices': 'Invoices',
  '/dashboard/sales': 'Sales',
  '/dashboard/marketing': 'Marketing',
  '/dashboard/support-hub': 'Customer Support',
  '/dashboard/reviews': 'Reviews',
  '/dashboard/technical': 'Technical Support',
  '/dashboard/reports': 'Reports',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/admins': 'Admin Management',
  '/dashboard/audit-log': 'Audit Log',
  '/dashboard/settings': 'Settings',
};

export function DashboardLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? (pathname.startsWith('/dashboard/customers/') ? 'Customer Profile' : 'Dashboard');

  return (
    <div className="dashboard-shell">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="dashboard-main">
        <Topbar title={title} onMenuClick={() => setMenuOpen((v) => !v)} />
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

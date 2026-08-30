// Mirrors the `roles` / `permissions` seed data in supabase/admin_schema.sql.
// The database (RLS) is the real enforcement point — this file only drives UI gating
// (sidebar visibility, route guards, showing/hiding actions).

export type RoleKey =
  | 'super_admin'
  | 'hr'
  | 'customer_support'
  | 'marketing'
  | 'sales'
  | 'finance'
  | 'technical'
  | 'transportation';

export const ROLE_LABELS: Record<RoleKey, string> = {
  super_admin: 'Super Admin',
  hr: 'HR',
  customer_support: 'Customer Relations',
  marketing: 'Marketing',
  sales: 'Sales',
  finance: 'Finance',
  technical: 'Technical',
  transportation: 'Transportation & Logistics',
};

export type PermissionKey =
  | 'customers.view'
  | 'customers.manage'
  | 'bookings.view'
  | 'bookings.manage'
  | 'finance.view'
  | 'finance.manage'
  | 'staff.view'
  | 'staff.manage'
  | 'marketing.view'
  | 'marketing.manage'
  | 'sales.view'
  | 'sales.manage'
  | 'support.view'
  | 'support.manage'
  | 'technical.view'
  | 'technical.manage'
  | 'transportation.view'
  | 'transportation.manage'
  | 'admins.manage'
  | 'reports.view'
  | 'audit.view';

/** Dashboard landing route per role — used right after login. */
export const ROLE_HOME_ROUTE: Record<RoleKey, string> = {
  super_admin: '/dashboard',
  hr: '/dashboard/hr',
  customer_support: '/dashboard/support-hub',
  marketing: '/dashboard/marketing',
  sales: '/dashboard/sales',
  finance: '/dashboard/finance',
  technical: '/dashboard/technical',
  transportation: '/dashboard/transportation',
};

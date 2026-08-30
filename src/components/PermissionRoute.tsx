import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { PermissionKey } from '../lib/permissions';
import { EmptyState } from './EmptyState';

/** Gates a whole route on a permission. The database (RLS) is the real enforcer — this is UX. */
export function PermissionRoute({ permission, children }: { permission: PermissionKey; children: ReactNode }) {
  const { hasPermission, isSuperAdmin } = useAuth();

  if (!isSuperAdmin && !hasPermission(permission)) {
    return (
      <EmptyState
        icon="🔒"
        title="Access restricted"
        message="Your role does not have permission to view this module. Contact your Super Admin if you believe this is a mistake."
      />
    );
  }

  return <>{children}</>;
}

/** Redirects away entirely (used for whole-page guards like Admin Management). */
export function RequirePermission({ permission, children }: { permission: PermissionKey; children: ReactNode }) {
  const { hasPermission, isSuperAdmin } = useAuth();
  if (!isSuperAdmin && !hasPermission(permission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

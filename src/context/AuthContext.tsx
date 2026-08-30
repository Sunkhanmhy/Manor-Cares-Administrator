import type { Session, User } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '../lib/supabaseClient';
import type { AdminProfile, Profile } from '../types/database';
import type { PermissionKey, RoleKey } from '../lib/permissions';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  adminProfile: AdminProfile | null;
  roleKeys: RoleKey[];
  permissionKeys: PermissionKey[];
  isSuperAdmin: boolean;
  loading: boolean;
  authError: string | null;
  clearAuthError: () => void;
  hasPermission: (perm: PermissionKey) => boolean;
  hasRole: (role: RoleKey) => boolean;
  refreshProfile: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordReset: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** Translates raw Supabase/auth errors into safe, friendly text for admin sign-in. */
export function mapAuthError(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'We could not reach the server. Please check your internet connection and try again.';
  }
  if (message.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (message.includes('email not confirmed')) {
    return 'Please verify your email address before signing in.';
  }
  if (message.includes('rate limit') || message.includes('too many requests')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (message.includes('invalid email')) {
    return 'Please enter a valid email address.';
  }
  return 'Something went wrong. Please try again in a moment.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [roleKeys, setRoleKeys] = useState<RoleKey[]>([]);
  const [permissionKeys, setPermissionKeys] = useState<PermissionKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  const clearAuthError = useCallback(() => setAuthError(null), []);

  const resetAdminState = useCallback(() => {
    setProfile(null);
    setAdminProfile(null);
    setRoleKeys([]);
    setPermissionKeys([]);
  }, []);

  /**
   * Loads the profile + admin_profiles + assigned roles/permissions for the signed-in user.
   * Rejects (signs out) anyone who is not an active administrative account — customer
   * accounts must never reach the admin dashboard, and disabled admins must be locked out
   * even though their Supabase auth session is technically still valid.
   */
  const loadAdminSession = useCallback(async (userId: string) => {
    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (profileError || !profileRow) {
      resetAdminState();
      return { ok: false, message: 'We could not find an account for this login.' };
    }

    if (profileRow.role === 'customer') {
      resetAdminState();
      await supabase.auth.signOut();
      return { ok: false, message: 'This portal is for authorized administration and staff accounts only.' };
    }

    const { data: adminRow, error: adminError } = await supabase
      .from('admin_profiles')
      .select('*')
      .eq('profile_id', profileRow.id)
      .maybeSingle();

    if (adminError || !adminRow) {
      resetAdminState();
      await supabase.auth.signOut();
      return { ok: false, message: 'No administrative profile is configured for this account. Contact your Super Admin.' };
    }

    if (adminRow.status !== 'active') {
      resetAdminState();
      await supabase.auth.signOut();
      return { ok: false, message: 'Your administrator account has been disabled. Contact your Super Admin.' };
    }

    const { data: userRoleRows } = await supabase
      .from('user_roles')
      .select('role_id, roles(key, name)')
      .eq('profile_id', profileRow.id);

    const roleIds = (userRoleRows ?? []).map((r) => r.role_id);
    const roles = ((userRoleRows ?? [])
      .map((r) => (Array.isArray(r.roles) ? r.roles[0] : r.roles)?.key)
      .filter(Boolean) as RoleKey[]);

    let permissions: PermissionKey[] = [];
    if (roleIds.length > 0) {
      const { data: permRows } = await supabase
        .from('role_permissions')
        .select('permissions(key)')
        .in('role_id', roleIds);
      permissions = ((permRows ?? [])
        .map((r) => (Array.isArray(r.permissions) ? r.permissions[0] : r.permissions)?.key)
        .filter(Boolean) as PermissionKey[]);
    }

    setProfile(profileRow as Profile);
    setAdminProfile(adminRow as AdminProfile);
    setRoleKeys(Array.from(new Set(roles)));
    setPermissionKeys(Array.from(new Set(permissions)));

    // Best-effort — records the login timestamp via a security-definer RPC (never a raw update).
    void supabase.rpc('record_admin_login');

    return { ok: true, message: null };
  }, [resetAdminState]);

  const refreshProfile = useCallback(async () => {
    if (session?.user) {
      await loadAdminSession(session.user.id);
    }
  }, [session, loadAdminSession]);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      if (data.session?.user) {
        const result = await loadAdminSession(data.session.user.id);
        if (!active) return;
        if (result.ok) {
          setSession(data.session);
        } else {
          setSession(null);
          if (result.message) setAuthError(result.message);
        }
      }
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (newSession?.user) {
        const result = await loadAdminSession(newSession.user.id);
        if (result.ok) {
          setSession(newSession);
        } else {
          setSession(null);
          if (result.message) setAuthError(result.message);
        }
      } else {
        setSession(null);
        resetAdminState();
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    resetAdminState();
  }, [resetAdminState]);

  const sendPasswordReset = useCallback(async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(mapAuthError(error));
  }, []);

  const hasPermission = useCallback(
    (perm: PermissionKey) => roleKeys.includes('super_admin') || permissionKeys.includes(perm),
    [roleKeys, permissionKeys]
  );

  const hasRole = useCallback((role: RoleKey) => roleKeys.includes(role), [roleKeys]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      profile,
      adminProfile,
      roleKeys,
      permissionKeys,
      isSuperAdmin: roleKeys.includes('super_admin'),
      loading,
      authError,
      clearAuthError,
      hasPermission,
      hasRole,
      refreshProfile,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    }),
    [
      session,
      profile,
      adminProfile,
      roleKeys,
      permissionKeys,
      loading,
      authError,
      clearAuthError,
      hasPermission,
      hasRole,
      refreshProfile,
      signIn,
      signOut,
      sendPasswordReset,
      updatePassword,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ROLE_LABELS, type RoleKey } from '../../lib/permissions';
import { timeAgo } from '../../lib/format';
import type { AdminProfile } from '../../types/database';

const ROLE_KEYS = Object.keys(ROLE_LABELS) as RoleKey[];

export function AdminManagementPage() {
  const { profile, isSuperAdmin } = useAuth();
  const toast = useToast();

  const [admins, setAdmins] = useState<AdminProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', department: '', jobTitle: '', roleKey: 'customer_support' as RoleKey });
  const [confirmTarget, setConfirmTarget] = useState<AdminProfile | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('admin_profiles')
      .select('*, profiles(first_name, last_name, email), user_roles(roles(key, name))')
      .order('created_at', { ascending: false });
    setAdmins((data as AdminProfile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createAdmin() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.functions.invoke('admin-create-account', {
      body: {
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        department: form.department.trim() || undefined,
        jobTitle: form.jobTitle.trim() || undefined,
        roleKey: form.roleKey,
      },
    });
    setCreating(false);
    if (error || data?.error) {
      toast.error(data?.error ?? error?.message ?? 'Failed to create admin account.');
      return;
    }
    toast.success(`Admin account created for ${form.email}. A password setup email has been sent.`);
    setForm({ firstName: '', lastName: '', email: '', department: '', jobTitle: '', roleKey: 'customer_support' });
    setCreateOpen(false);
    load();
  }

  async function toggleStatus(admin: AdminProfile) {
    if (!profile) return;
    setBusy(true);
    const nextStatus = admin.status === 'active' ? 'disabled' : 'active';
    const { error } = await supabase.from('admin_profiles').update({ status: nextStatus }).eq('id', admin.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Admin account ${nextStatus === 'disabled' ? 'disabled' : 'activated'}.`);
      await logAdminAction(
        profile.id,
        nextStatus === 'disabled' ? 'admin_suspended' : 'admin_activated',
        'admin_profiles',
        admin.id,
        `${admin.profiles?.first_name} ${admin.profiles?.last_name}`
      );
      load();
    }
    setBusy(false);
    setConfirmTarget(null);
  }

  const filtered = admins.filter((a) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return `${a.profiles?.first_name ?? ''} ${a.profiles?.last_name ?? ''} ${a.profiles?.email ?? ''}`.toLowerCase().includes(q);
  });

  if (loading) return <FullPageSpinner label="Loading admin accounts…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input className="input" style={{ maxWidth: 280 }} placeholder="Search admins" value={search} onChange={(e) => setSearch(e.target.value)} />
        {isSuperAdmin && (
          <button className="btn btn-primary" style={{ marginLeft: 'auto' }} onClick={() => setCreateOpen(true)}>
            + Create Admin
          </button>
        )}
      </GlassCard>

      <GlassCard style={{ padding: 0 }}>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Status</th>
                <th>Last Login</th>
                {isSuperAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td>
                    {a.profiles?.first_name} {a.profiles?.last_name}
                  </td>
                  <td>{a.profiles?.email}</td>
                  <td>{a.user_roles?.map((ur) => ur.roles?.name).join(', ') || '—'}</td>
                  <td>{a.department ?? '—'}</td>
                  <td>
                    <StatusBadge status={a.status} />
                  </td>
                  <td>{timeAgo(a.last_login_at)}</td>
                  {isSuperAdmin && (
                    <td>
                      <button
                        className={`btn btn-sm ${a.status === 'active' ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => setConfirmTarget(a)}
                      >
                        {a.status === 'active' ? 'Disable' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {createOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{ position: 'fixed', inset: 0, background: 'rgba(4,10,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}
          onClick={() => !creating && setCreateOpen(false)}
        >
          <GlassCard strong style={{ padding: 26, maxWidth: 460, width: '100%' }}>
            <div onClick={(e) => e.stopPropagation()}>
              <h3 style={{ marginBottom: 16 }}>Create Admin Account</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="input" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
                <input className="input" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
                <input className="input" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                <input className="input" placeholder="Department (optional)" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                <input className="input" placeholder="Job title (optional)" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
                <select className="input" value={form.roleKey} onChange={(e) => setForm({ ...form, roleKey: e.target.value as RoleKey })}>
                  {ROLE_KEYS.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
                  A password setup email will be sent to this address. No temporary password is shown here.
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                  <button className="btn btn-ghost" disabled={creating} onClick={() => setCreateOpen(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" disabled={creating} onClick={createAdmin}>
                    {creating ? 'Creating…' : 'Create Admin'}
                  </button>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmTarget}
        title={confirmTarget?.status === 'active' ? 'Disable this admin account?' : 'Activate this admin account?'}
        message={
          confirmTarget?.status === 'active'
            ? 'They will immediately lose all access to the administration portal.'
            : 'They will regain access to the administration portal according to their assigned role.'
        }
        confirmLabel={confirmTarget?.status === 'active' ? 'Disable' : 'Activate'}
        danger={confirmTarget?.status === 'active'}
        busy={busy}
        onConfirm={() => confirmTarget && toggleStatus(confirmTarget)}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

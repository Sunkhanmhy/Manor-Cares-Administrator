import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { FullPageSpinner } from '../../components/Spinner';
import { formatDate } from '../../lib/format';
import type { CustomerProfile } from '../../types/database';

export function CustomersPage() {
  const { hasPermission, isSuperAdmin } = useAuth();
  const canManage = isSuperAdmin || hasPermission('customers.manage');

  const [customers, setCustomers] = useState<CustomerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from('customer_profiles')
      .select('*, profiles(first_name, last_name, email, phone, status)')
      .order('created_at', { ascending: false });
    setCustomers((data as CustomerProfile[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      if (statusFilter !== 'all' && c.customer_status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      const name = `${c.profiles?.first_name ?? ''} ${c.profiles?.last_name ?? ''}`.toLowerCase();
      return (
        name.includes(q) ||
        c.customer_number?.toLowerCase().includes(q) ||
        c.profiles?.email?.toLowerCase().includes(q)
      );
    });
  }, [customers, search, statusFilter]);

  if (loading) return <FullPageSpinner label="Loading customers…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: 300 }}
          placeholder="Search by name, email or customer #"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" style={{ maxWidth: 200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="vip">VIP</option>
          <option value="suspended">Suspended</option>
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-muted)' }}>{filtered.length} customers</span>
      </GlassCard>

      <GlassCard style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <EmptyState icon="👥" title="No customers found" message="Try adjusting your search or filters." />
        ) : (
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Customer #</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>{c.customer_number}</td>
                    <td>
                      {c.profiles?.first_name} {c.profiles?.last_name}
                    </td>
                    <td>{c.profiles?.email}</td>
                    <td>{c.profiles?.phone ?? '—'}</td>
                    <td>
                      <StatusBadge status={c.customer_status} />
                    </td>
                    <td>{formatDate(c.created_at)}</td>
                    <td>
                      <Link to={`/dashboard/customers/${c.id}`} className="btn btn-ghost btn-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
      {!canManage && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          Your role has read-only access to customer records.
        </p>
      )}
    </div>
  );
}

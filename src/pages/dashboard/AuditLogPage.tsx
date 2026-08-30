import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { FullPageSpinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { formatDateTime } from '../../lib/format';
import type { AuditLog } from '../../types/database';

export function AuditLogPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*, profiles(first_name, last_name)')
      .order('created_at', { ascending: false })
      .limit(300)
      .then(({ data }) => {
        setLogs((data as AuditLog[]) ?? []);
        setLoading(false);
      });
  }, []);

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    return `${l.action} ${l.resource_type} ${l.description ?? ''}`.toLowerCase().includes(q);
  });

  if (loading) return <FullPageSpinner label="Loading audit log…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 18 }}>
        <input
          className="input"
          style={{ maxWidth: 320 }}
          placeholder="Search by action, resource or description"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </GlassCard>

      <GlassCard style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📜" title="No audit records" />
        ) : (
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Admin</th>
                  <th>Action</th>
                  <th>Resource</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l) => (
                  <tr key={l.id}>
                    <td>{formatDateTime(l.created_at)}</td>
                    <td>
                      {l.profiles ? `${l.profiles.first_name} ${l.profiles.last_name}` : 'System'}
                    </td>
                    <td>{l.action}</td>
                    <td>
                      {l.resource_type}
                      {l.resource_id ? ` #${l.resource_id}` : ''}
                    </td>
                    <td style={{ maxWidth: 320, whiteSpace: 'normal' }}>{l.description ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
      <p style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>
        Audit records are immutable — no administrator, including Super Admins, can edit or delete entries from this app.
      </p>
    </div>
  );
}

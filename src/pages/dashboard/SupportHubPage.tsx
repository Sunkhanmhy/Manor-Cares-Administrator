import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { formatDateTime } from '../../lib/format';
import type { SupportTicket, TicketStatus } from '../../types/database';

const TICKET_STATUSES: TicketStatus[] = ['open', 'in_progress', 'waiting_for_customer', 'resolved', 'closed'];

export function SupportHubPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('support.manage');

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  async function load() {
    const { data } = await supabase
      .from('support_tickets')
      .select('*, customer_profiles(customer_number, profiles(first_name, last_name))')
      .order('created_at', { ascending: false })
      .limit(200);
    setTickets((data as SupportTicket[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(ticket: SupportTicket, status: TicketStatus) {
    if (!profile) return;
    const { error } = await supabase.from('support_tickets').update({ status }).eq('id', ticket.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Ticket #${ticket.id} marked ${status}.`);
    await logAdminAction(profile.id, 'support_ticket_updated', 'support_tickets', ticket.id, `Status changed to ${status}`);
    load();
  }

  const filtered = statusFilter === 'all' ? tickets : tickets.filter((t) => t.status === statusFilter);

  if (loading) return <FullPageSpinner label="Loading support tickets…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 18 }}>
        <select className="input" style={{ maxWidth: 220 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {TICKET_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </GlassCard>

      <GlassCard style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <EmptyState icon="🎧" title="No support tickets" />
        ) : (
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Updated</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      {t.customer_profiles?.profiles?.first_name} {t.customer_profiles?.profiles?.last_name}
                    </td>
                    <td>{t.subject}</td>
                    <td>
                      <StatusBadge status={t.priority} />
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    <td>{formatDateTime(t.updated_at)}</td>
                    {canManage && (
                      <td>
                        <select
                          className="input"
                          style={{ padding: '6px 8px', fontSize: 12 }}
                          value={t.status}
                          onChange={(e) => updateStatus(t, e.target.value as TicketStatus)}
                        >
                          {TICKET_STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

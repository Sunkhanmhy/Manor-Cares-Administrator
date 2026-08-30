import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { formatDateTime } from '../../lib/format';
import type { TechnicalTicket, TechnicalTicketStatus } from '../../types/database';

const STATUSES: TechnicalTicketStatus[] = ['open', 'in_progress', 'resolved', 'closed'];

export function TechnicalPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('technical.manage');

  const [tickets, setTickets] = useState<TechnicalTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', category: '' });

  async function load() {
    const { data } = await supabase.from('technical_tickets').select('*').order('created_at', { ascending: false });
    setTickets((data as TechnicalTicket[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTicket() {
    if (!form.title.trim() || !form.description.trim() || !profile) return;
    const { error } = await supabase.from('technical_tickets').insert({
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category.trim() || null,
      reported_by: profile.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Technical ticket logged.');
    await logAdminAction(profile.id, 'technical_ticket_created', 'technical_tickets', null, form.title.trim());
    setForm({ title: '', description: '', category: '' });
    load();
  }

  async function updateStatus(ticket: TechnicalTicket, status: TechnicalTicketStatus) {
    if (!profile) return;
    const { error } = await supabase.from('technical_tickets').update({ status }).eq('id', ticket.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAdminAction(profile.id, 'technical_ticket_updated', 'technical_tickets', ticket.id, `Status changed to ${status}`);
    load();
  }

  if (loading) return <FullPageSpinner label="Loading technical tickets…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 14 }}>Log Technical Issue</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10 }}>
          <input className="input" placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <input className="input" placeholder="Category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          <textarea
            className="input"
            placeholder="Description"
            style={{ gridColumn: '1 / -1', minHeight: 70 }}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <button className="btn btn-primary" onClick={createTicket}>
            Log Ticket
          </button>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 0 }}>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {tickets.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.category ?? '—'}</td>
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
                        onChange={(e) => updateStatus(t, e.target.value as TechnicalTicketStatus)}
                      >
                        {STATUSES.map((s) => (
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
      </GlassCard>
    </div>
  );
}

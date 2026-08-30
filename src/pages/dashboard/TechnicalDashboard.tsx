import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../lib/format';
import type { TechnicalTicket } from '../../types/database';

export function TechnicalDashboard() {
  const [loading, setLoading] = useState(true);
  const [openTickets, setOpenTickets] = useState(0);
  const [urgentTickets, setUrgentTickets] = useState(0);
  const [resolvedThisWeek, setResolvedThisWeek] = useState(0);
  const [tickets, setTickets] = useState<TechnicalTicket[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [open, urgent, resolved, ticketRows] = await Promise.all([
        supabase.from('technical_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('technical_tickets').select('id', { count: 'exact', head: true }).in('priority', ['high', 'urgent']).neq('status', 'closed'),
        supabase
          .from('technical_tickets')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'resolved')
          .gte('updated_at', weekAgo.toISOString()),
        supabase.from('technical_tickets').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      if (!active) return;
      setOpenTickets(open.count ?? 0);
      setUrgentTickets(urgent.count ?? 0);
      setResolvedThisWeek(resolved.count ?? 0);
      setTickets((ticketRows.data as TechnicalTicket[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="card-grid">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
        <StatCard icon="🛠️" label="Open Technical Issues" value={openTickets} accent="amber" />
        <StatCard icon="🚨" label="High/Urgent Priority" value={urgentTickets} accent="red" />
        <StatCard icon="✅" label="Resolved (7 days)" value={resolvedThisWeek} accent="green" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Recent Technical Tickets</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../lib/format';
import type { SupportTicket } from '../../types/database';

export function CustomerRelationsDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [newCustomers, setNewCustomers] = useState(0);
  const [openTickets, setOpenTickets] = useState(0);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [recentTickets, setRecentTickets] = useState<SupportTicket[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const monthStart = new Date();
      monthStart.setDate(1);

      const [total, recent, open, reviews, tickets] = await Promise.all([
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress', 'waiting_for_customer']),
        supabase.from('service_reviews').select('rating'),
        supabase
          .from('support_tickets')
          .select('*, customer_profiles(customer_number, profiles(first_name, last_name))')
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      if (!active) return;
      setTotalCustomers(total.count ?? 0);
      setNewCustomers(recent.count ?? 0);
      setOpenTickets(open.count ?? 0);
      const ratings = (reviews.data ?? []).map((r) => Number(r.rating));
      setAvgRating(ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null);
      setRecentTickets((tickets.data as SupportTicket[]) ?? []);
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
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
        <StatCard icon="👥" label="Total Customers" value={totalCustomers} accent="blue" />
        <StatCard icon="🆕" label="New Customers (month)" value={newCustomers} accent="green" />
        <StatCard icon="🎧" label="Open Tickets" value={openTickets} accent="amber" />
        <StatCard icon="⭐" label="Average Review Rating" value={avgRating ? avgRating.toFixed(1) : '—'} accent="green" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Recent Support Tickets</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Customer</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {recentTickets.map((t) => (
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

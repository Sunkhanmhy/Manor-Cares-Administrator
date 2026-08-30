import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { BarChart, DonutChart } from '../../components/Charts';
import { SkeletonCard } from '../../components/Skeleton';
import { formatCurrency } from '../../lib/format';

interface SuperAdminStats {
  totalCustomers: number;
  newCustomers: number;
  activeCustomers: number;
  totalBookings: number;
  todaysBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  revenue: number;
  outstandingPayments: number;
  openSupportTickets: number;
  activeStaff: number;
  cleaningTeams: number;
  systemAlerts: number;
  bookingsByStatus: { label: string; value: number }[];
}

const emptyStats: SuperAdminStats = {
  totalCustomers: 0,
  newCustomers: 0,
  activeCustomers: 0,
  totalBookings: 0,
  todaysBookings: 0,
  upcomingBookings: 0,
  completedBookings: 0,
  cancelledBookings: 0,
  revenue: 0,
  outstandingPayments: 0,
  openSupportTickets: 0,
  activeStaff: 0,
  cleaningTeams: 0,
  systemAlerts: 0,
  bookingsByStatus: [],
};

export function SuperAdminDashboard() {
  const [stats, setStats] = useState<SuperAdminStats>(emptyStats);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartIso = monthStart.toISOString();

      const [
        totalCustomers,
        newCustomers,
        activeCustomers,
        totalBookings,
        todaysBookings,
        upcomingBookings,
        completedBookings,
        cancelledBookings,
        payments,
        outstandingInvoices,
        openSupportTickets,
        activeStaff,
        cleaningTeams,
        urgentTechnicalTickets,
      ] = await Promise.all([
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).gte('created_at', monthStartIso),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('customer_status', 'active'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_date', today),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .gt('booking_date', today)
          .in('booking_status', ['pending', 'confirmed', 'assigned']),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'completed'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('booking_status', 'cancelled'),
        supabase.from('payments').select('amount').eq('payment_status', 'successful'),
        supabase.from('invoices').select('total').in('status', ['unpaid', 'overdue']),
        supabase.from('support_tickets').select('id', { count: 'exact', head: true }).in('status', ['open', 'in_progress']),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'active'),
        supabase.from('cleaning_teams').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('technical_tickets').select('id', { count: 'exact', head: true }).in('priority', ['high', 'urgent']).neq('status', 'closed'),
      ]);

      const revenue = (payments.data ?? []).reduce((sum, p) => sum + Number(p.amount ?? 0), 0);
      const outstandingPayments = (outstandingInvoices.data ?? []).reduce((sum, i) => sum + Number(i.total ?? 0), 0);

      const bookingsByStatus = [
        { label: 'Completed', value: completedBookings.count ?? 0 },
        { label: 'Upcoming', value: upcomingBookings.count ?? 0 },
        { label: "Today", value: todaysBookings.count ?? 0 },
        { label: 'Cancelled', value: cancelledBookings.count ?? 0 },
      ];

      if (!active) return;
      setStats({
        totalCustomers: totalCustomers.count ?? 0,
        newCustomers: newCustomers.count ?? 0,
        activeCustomers: activeCustomers.count ?? 0,
        totalBookings: totalBookings.count ?? 0,
        todaysBookings: todaysBookings.count ?? 0,
        upcomingBookings: upcomingBookings.count ?? 0,
        completedBookings: completedBookings.count ?? 0,
        cancelledBookings: cancelledBookings.count ?? 0,
        revenue,
        outstandingPayments,
        openSupportTickets: openSupportTickets.count ?? 0,
        activeStaff: activeStaff.count ?? 0,
        cleaningTeams: cleaningTeams.count ?? 0,
        systemAlerts: (urgentTechnicalTickets.count ?? 0),
        bookingsByStatus,
      });
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
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {stats.systemAlerts > 0 && (
        <div className="security-banner" style={{ borderColor: 'rgba(230,160,30,0.4)', background: 'rgba(230,160,30,0.12)' }}>
          <span aria-hidden="true">⚠️</span>
          <span>
            {stats.systemAlerts} high-priority technical ticket{stats.systemAlerts === 1 ? '' : 's'} need attention.
          </span>
        </div>
      )}

      <div className="stat-grid">
        <StatCard icon="👥" label="Total Customers" value={stats.totalCustomers} accent="blue" />
        <StatCard icon="🆕" label="New Customers (month)" value={stats.newCustomers} accent="green" />
        <StatCard icon="✅" label="Active Customers" value={stats.activeCustomers} accent="green" />
        <StatCard icon="📅" label="Total Bookings" value={stats.totalBookings} accent="blue" />
        <StatCard icon="☀️" label="Today's Bookings" value={stats.todaysBookings} accent="blue" />
        <StatCard icon="⏭️" label="Upcoming Bookings" value={stats.upcomingBookings} accent="blue" />
        <StatCard icon="🏁" label="Completed Bookings" value={stats.completedBookings} accent="green" />
        <StatCard icon="🚫" label="Cancelled Bookings" value={stats.cancelledBookings} accent="red" />
        <StatCard icon="💰" label="Revenue (successful payments)" value={formatCurrency(stats.revenue)} accent="green" />
        <StatCard icon="🧾" label="Outstanding Payments" value={formatCurrency(stats.outstandingPayments)} accent="amber" />
        <StatCard icon="🎧" label="Open Support Tickets" value={stats.openSupportTickets} accent="amber" />
        <StatCard icon="🧑‍💼" label="Active Staff" value={stats.activeStaff} accent="blue" />
        <StatCard icon="🚐" label="Cleaning Teams" value={stats.cleaningTeams} accent="blue" />
        <StatCard icon="🔔" label="System Alerts" value={stats.systemAlerts} accent={stats.systemAlerts > 0 ? 'red' : 'green'} />
      </div>

      <div className="card-grid">
        <GlassCard style={{ padding: 22 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Bookings Snapshot</h3>
          <BarChart data={stats.bookingsByStatus} />
        </GlassCard>
        <GlassCard style={{ padding: 22 }}>
          <h3 style={{ marginBottom: 16, fontSize: 15 }}>Booking Outcomes</h3>
          <DonutChart
            data={[
              { label: 'Completed', value: stats.completedBookings, color: 'var(--clr-green)' },
              { label: 'Cancelled', value: stats.cancelledBookings, color: '#e57373' },
              { label: 'Upcoming', value: stats.upcomingBookings, color: 'var(--clr-blue)' },
            ]}
          />
        </GlassCard>
      </div>
    </div>
  );
}

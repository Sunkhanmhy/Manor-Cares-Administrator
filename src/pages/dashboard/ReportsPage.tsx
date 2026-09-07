import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { FullPageSpinner } from '../../components/Spinner';
import { formatCurrency } from '../../lib/format';

type RangeKey = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

function rangeStart(key: RangeKey, customFrom: string): Date {
  const now = new Date();
  if (key === 'day') return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (key === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 7);
    return d;
  }
  if (key === 'month') return new Date(now.getFullYear(), now.getMonth(), 1);
  if (key === 'quarter') {
    const d = new Date(now);
    d.setMonth(d.getMonth() - 3);
    return d;
  }
  if (key === 'year') return new Date(now.getFullYear(), 0, 1);
  return customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1);
}

export function ReportsPage() {
  const [range, setRange] = useState<RangeKey>('month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [loading, setLoading] = useState(true);

  const [newCustomers, setNewCustomers] = useState(0);
  const [activeCustomers, setActiveCustomers] = useState(0);
  const [bookingsInPeriod, setBookingsInPeriod] = useState(0);
  const [completedBookings, setCompletedBookings] = useState(0);
  const [cancelledBookings, setCancelledBookings] = useState(0);
  const [popularServices, setPopularServices] = useState<{ label: string; value: number }[]>([]);
  const [revenue, setRevenue] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [refunds, setRefunds] = useState(0);
  const [attendancePresent, setAttendancePresent] = useState(0);
  const [attendanceAbsent, setAttendanceAbsent] = useState(0);
  const [campaignsActive, setCampaignsActive] = useState(0);

  const from = useMemo(() => rangeStart(range, customFrom), [range, customFrom]);
  const to = useMemo(() => (range === 'custom' && customTo ? new Date(customTo) : new Date()), [range, customTo]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      const fromIso = from.toISOString();
      const toIso = to.toISOString();
      const fromDate = fromIso.slice(0, 10);
      const toDate = toIso.slice(0, 10);

      const [
        newCust,
        activeCust,
        bookingsCount,
        completed,
        cancelled,
        bookingRows,
        payments,
        invoices,
        refundedPayments,
        attendance,
        campaigns,
      ] = await Promise.all([
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).gte('created_at', fromIso).lte('created_at', toIso),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }).eq('customer_status', 'active'),
        supabase.from('bookings').select('id', { count: 'exact', head: true }).gte('booking_date', fromDate).lte('booking_date', toDate),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('booking_status', 'completed')
          .gte('booking_date', fromDate)
          .lte('booking_date', toDate),
        supabase
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('booking_status', 'cancelled')
          .gte('booking_date', fromDate)
          .lte('booking_date', toDate),
        supabase.from('bookings').select('cleaning_services(name)').gte('booking_date', fromDate).lte('booking_date', toDate),
        supabase.from('payments').select('amount').eq('payment_status', 'successful').gte('created_at', fromIso).lte('created_at', toIso),
        supabase.from('invoices').select('total').in('status', ['unpaid', 'overdue']),
        supabase.from('payments').select('amount').eq('payment_status', 'refunded').gte('created_at', fromIso).lte('created_at', toIso),
        supabase.from('staff_attendance').select('status').gte('work_date', fromDate).lte('work_date', toDate),
        supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      ]);

      if (!active) return;
      setNewCustomers(newCust.count ?? 0);
      setActiveCustomers(activeCust.count ?? 0);
      setBookingsInPeriod(bookingsCount.count ?? 0);
      setCompletedBookings(completed.count ?? 0);
      setCancelledBookings(cancelled.count ?? 0);
      setRevenue((payments.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0));
      setOutstanding((invoices.data ?? []).reduce((s, i) => s + Number(i.total ?? 0), 0));
      setRefunds((refundedPayments.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0));
      setCampaignsActive(campaigns.count ?? 0);

      const attendanceRows = attendance.data ?? [];
      setAttendancePresent(attendanceRows.filter((a) => a.status === 'present').length);
      setAttendanceAbsent(attendanceRows.filter((a) => a.status === 'absent').length);

      const serviceCounts: Record<string, number> = {};
      for (const row of bookingRows.data ?? []) {
        const raw = (row as { cleaning_services: unknown }).cleaning_services;
        const service = Array.isArray(raw) ? raw[0] : raw;
        const name = (service as { name?: string } | null)?.name ?? 'Unknown';
        serviceCounts[name] = (serviceCounts[name] ?? 0) + 1;
      }
      setPopularServices(
        Object.entries(serviceCounts)
          .map(([label, value]) => ({ label, value }))
          .sort((a, b) => b.value - a.value)
          .slice(0, 6)
      );

      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, [from, to]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        {(['day', 'week', 'month', 'quarter', 'year', 'custom'] as RangeKey[]).map((r) => (
          <button
            key={r}
            className={`btn btn-sm ${range === r ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setRange(r)}
            style={{ textTransform: 'capitalize' }}
          >
            {r}
          </button>
        ))}
        {range === 'custom' && (
          <>
            <input type="date" className="input" style={{ maxWidth: 160 }} value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
            <span style={{ color: 'var(--text-muted)' }}>to</span>
            <input type="date" className="input" style={{ maxWidth: 160 }} value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
          </>
        )}
      </GlassCard>

      {loading ? (
        <FullPageSpinner label="Building reports…" />
      ) : (
        <>
          <div>
            <h3 style={{ fontSize: 14, marginBottom: 10, color: 'var(--text-muted)' }}>Customer Reports</h3>
            <div className="stat-grid">
              <StatCard icon="user-plus" label="Customer Growth (period)" value={newCustomers} accent="green" />
              <StatCard icon="check-circle" label="Active Customers" value={activeCustomers} accent="blue" />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, marginBottom: 10, marginTop: 10, color: 'var(--text-muted)' }}>Booking Reports</h3>
            <div className="stat-grid">
              <StatCard icon="calendar" label="Bookings (period)" value={bookingsInPeriod} accent="blue" />
              <StatCard icon="flag" label="Completed" value={completedBookings} accent="green" />
              <StatCard icon="x-circle" label="Cancelled" value={cancelledBookings} accent="red" />
            </div>
            <GlassCard style={{ padding: 20, marginTop: 14 }}>
              <h4 style={{ fontSize: 13, marginBottom: 12 }}>Service Popularity</h4>
              {popularServices.length === 0 ? (
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No bookings in this period.</p>
              ) : (
                popularServices.map((s) => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 6 }}>
                    <span>{s.label}</span>
                    <span style={{ fontWeight: 700 }}>{s.value}</span>
                  </div>
                ))
              )}
            </GlassCard>
          </div>

          <div>
            <h3 style={{ fontSize: 14, marginBottom: 10, marginTop: 10, color: 'var(--text-muted)' }}>Financial Reports</h3>
            <div className="stat-grid">
              <StatCard icon="dollar" label="Revenue (period)" value={formatCurrency(revenue)} accent="green" />
              <StatCard icon="receipt" label="Outstanding Balances" value={formatCurrency(outstanding)} accent="amber" />
              <StatCard icon="refund" label="Refunds (period)" value={formatCurrency(refunds)} accent="red" />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, marginBottom: 10, marginTop: 10, color: 'var(--text-muted)' }}>Staff Reports</h3>
            <div className="stat-grid">
              <StatCard icon="check-circle" label="Attendance: Present" value={attendancePresent} accent="green" />
              <StatCard icon="x-circle" label="Attendance: Absent" value={attendanceAbsent} accent="red" />
            </div>
          </div>

          <div>
            <h3 style={{ fontSize: 14, marginBottom: 10, marginTop: 10, color: 'var(--text-muted)' }}>Marketing Reports</h3>
            <div className="stat-grid">
              <StatCard icon="megaphone" label="Active Campaigns" value={campaignsActive} accent="blue" />
              <StatCard icon="user-plus" label="Customer Acquisition (period)" value={newCustomers} accent="green" />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

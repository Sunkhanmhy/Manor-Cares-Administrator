import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Payment } from '../../types/database';

export function FinanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [todaysRevenue, setTodaysRevenue] = useState(0);
  const [monthlyRevenue, setMonthlyRevenue] = useState(0);
  const [pending, setPending] = useState(0);
  const [outstandingInvoices, setOutstandingInvoices] = useState(0);
  const [refunds, setRefunds] = useState(0);
  const [transactions, setTransactions] = useState<Payment[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const today = new Date().toISOString().slice(0, 10);
      const monthStart = new Date();
      monthStart.setDate(1);

      const [allPayments, todayPayments, monthPayments, pendingCount, invoices, refundedPayments, recentTx] = await Promise.all([
        supabase.from('payments').select('amount').eq('payment_status', 'successful'),
        supabase.from('payments').select('amount').eq('payment_status', 'successful').gte('paid_at', today),
        supabase.from('payments').select('amount').eq('payment_status', 'successful').gte('paid_at', monthStart.toISOString()),
        supabase.from('payments').select('id', { count: 'exact', head: true }).eq('payment_status', 'pending'),
        supabase.from('invoices').select('total').in('status', ['unpaid', 'overdue']),
        supabase.from('payments').select('amount').eq('payment_status', 'refunded'),
        supabase.from('payments').select('*, customer_profiles(customer_number)').order('created_at', { ascending: false }).limit(10),
      ]);

      if (!active) return;
      setTotalRevenue((allPayments.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0));
      setTodaysRevenue((todayPayments.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0));
      setMonthlyRevenue((monthPayments.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0));
      setPending(pendingCount.count ?? 0);
      setOutstandingInvoices((invoices.data ?? []).reduce((s, i) => s + Number(i.total ?? 0), 0));
      setRefunds((refundedPayments.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0));
      setTransactions((recentTx.data as Payment[]) ?? []);
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
        <StatCard icon="dollar" label="Total Revenue" value={formatCurrency(totalRevenue)} accent="green" />
        <StatCard icon="sun" label="Today's Revenue" value={formatCurrency(todaysRevenue)} accent="green" />
        <StatCard icon="calendar" label="Monthly Revenue" value={formatCurrency(monthlyRevenue)} accent="green" />
        <StatCard icon="clock" label="Pending Payments" value={pending} accent="amber" />
        <StatCard icon="receipt" label="Outstanding Invoices" value={formatCurrency(outstandingInvoices)} accent="amber" />
        <StatCard icon="refund" label="Refunds Issued" value={formatCurrency(refunds)} accent="red" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Recent Transactions</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((p) => (
                <tr key={p.id}>
                  <td>{p.payment_reference}</td>
                  <td>{p.customer_profiles?.customer_number ?? '—'}</td>
                  <td>{formatCurrency(p.amount, p.currency)}</td>
                  <td>{p.payment_method ?? '—'}</td>
                  <td>
                    <StatusBadge status={p.payment_status} />
                  </td>
                  <td>{formatDateTime(p.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { FullPageSpinner } from '../../components/Spinner';
import { BarChart } from '../../components/Charts';
import { formatCurrency } from '../../lib/format';

export function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [outstanding, setOutstanding] = useState(0);
  const [refunds, setRefunds] = useState(0);
  const [byMethod, setByMethod] = useState<{ label: string; value: number }[]>([]);

  useEffect(() => {
    async function load() {
      const [successful, unpaidInvoices, refunded] = await Promise.all([
        supabase.from('payments').select('amount, payment_method').eq('payment_status', 'successful'),
        supabase.from('invoices').select('total').in('status', ['unpaid', 'overdue']),
        supabase.from('payments').select('amount').eq('payment_status', 'refunded'),
      ]);

      const revenueRows = successful.data ?? [];
      setTotalRevenue(revenueRows.reduce((s, p) => s + Number(p.amount ?? 0), 0));
      setOutstanding((unpaidInvoices.data ?? []).reduce((s, i) => s + Number(i.total ?? 0), 0));
      setRefunds((refunded.data ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0));

      const grouped: Record<string, number> = {};
      for (const row of revenueRows) {
        const key = row.payment_method ?? 'other';
        grouped[key] = (grouped[key] ?? 0) + Number(row.amount ?? 0);
      }
      setByMethod(Object.entries(grouped).map(([label, value]) => ({ label, value })));
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <FullPageSpinner label="Loading financial reports…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="stat-grid">
        <StatCard icon="💰" label="Total Revenue" value={formatCurrency(totalRevenue)} accent="green" />
        <StatCard icon="🧾" label="Outstanding Balances" value={formatCurrency(outstanding)} accent="amber" />
        <StatCard icon="↩️" label="Refunds Issued" value={formatCurrency(refunds)} accent="red" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Revenue by Payment Method</h3>
        <BarChart data={byMethod} valueFormatter={(n) => formatCurrency(n)} />
      </GlassCard>
    </div>
  );
}

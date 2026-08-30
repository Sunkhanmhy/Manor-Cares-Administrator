import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency, formatDateTime } from '../../lib/format';
import type { Payment } from '../../types/database';

export function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('payments')
      .select('*, customer_profiles(customer_number, profiles(first_name, last_name))')
      .order('created_at', { ascending: false })
      .limit(200)
      .then(({ data }) => {
        setPayments((data as Payment[]) ?? []);
        setLoading(false);
      });
  }, []);

  if (loading) return <FullPageSpinner label="Loading payments…" />;

  return (
    <GlassCard style={{ padding: 0 }}>
      {payments.length === 0 ? (
        <EmptyState icon="💳" title="No payments yet" />
      ) : (
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
              {payments.map((p) => (
                <tr key={p.id}>
                  <td>{p.payment_reference}</td>
                  <td>
                    {p.customer_profiles?.profiles?.first_name} {p.customer_profiles?.profiles?.last_name}
                  </td>
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
      )}
    </GlassCard>
  );
}

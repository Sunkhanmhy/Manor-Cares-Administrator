import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { EmptyState } from '../../components/EmptyState';
import { formatCurrency, formatDate } from '../../lib/format';
import type { Invoice, InvoiceStatus } from '../../types/database';

export function InvoicesPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('finance.manage');

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    const { data } = await supabase
      .from('invoices')
      .select('*, customer_profiles(customer_number, profiles(first_name, last_name))')
      .order('created_at', { ascending: false })
      .limit(200);
    setInvoices((data as Invoice[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(invoice: Invoice, status: InvoiceStatus) {
    if (!profile) return;
    const { error } = await supabase.from('invoices').update({ status }).eq('id', invoice.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Invoice ${invoice.invoice_number} marked ${status}.`);
    await logAdminAction(profile.id, 'payment_updated', 'invoices', invoice.id, `Status changed to ${status}`);
    load();
  }

  if (loading) return <FullPageSpinner label="Loading invoices…" />;

  return (
    <GlassCard style={{ padding: 0 }}>
      {invoices.length === 0 ? (
        <EmptyState icon="🧾" title="No invoices yet" />
      ) : (
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Customer</th>
                <th>Total</th>
                <th>Due Date</th>
                <th>Status</th>
                {canManage && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {invoices.map((i) => (
                <tr key={i.id}>
                  <td>{i.invoice_number}</td>
                  <td>
                    {i.customer_profiles?.profiles?.first_name} {i.customer_profiles?.profiles?.last_name}
                  </td>
                  <td>{formatCurrency(i.total, i.currency)}</td>
                  <td>{formatDate(i.due_date)}</td>
                  <td>
                    <StatusBadge status={i.status} />
                  </td>
                  {canManage && (
                    <td>
                      <select
                        className="input"
                        style={{ padding: '6px 8px', fontSize: 12 }}
                        value={i.status}
                        onChange={(e) => updateStatus(i, e.target.value as InvoiceStatus)}
                      >
                        <option value="unpaid">unpaid</option>
                        <option value="paid">paid</option>
                        <option value="overdue">overdue</option>
                        <option value="void">void</option>
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
  );
}

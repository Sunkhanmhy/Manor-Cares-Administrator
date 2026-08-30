import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { formatCurrency, formatDate, formatDateTime } from '../../lib/format';
import type { Address, Booking, CustomerProfile, Invoice, Payment, ServiceReview, SupportTicket } from '../../types/database';

export function CustomerDetailPage() {
  const { id } = useParams();
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('customers.manage');

  const [customer, setCustomer] = useState<CustomerProfile | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [reviews, setReviews] = useState<ServiceReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function load() {
    if (!id) return;
    setLoading(true);
    const [customerRes, addressesRes, bookingsRes, paymentsRes, invoicesRes, ticketsRes, reviewsRes] = await Promise.all([
      supabase.from('customer_profiles').select('*, profiles(*)').eq('id', id).maybeSingle(),
      supabase.from('customer_profiles').select('profile_id').eq('id', id).maybeSingle(),
      supabase.from('bookings').select('*, cleaning_services(name)').eq('customer_id', id).order('booking_date', { ascending: false }),
      supabase.from('payments').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('invoices').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('support_tickets').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
      supabase.from('service_reviews').select('*').eq('customer_id', id).order('created_at', { ascending: false }),
    ]);

    setCustomer((customerRes.data as CustomerProfile) ?? null);
    setBookings((bookingsRes.data as Booking[]) ?? []);
    setPayments((paymentsRes.data as Payment[]) ?? []);
    setInvoices((invoicesRes.data as Invoice[]) ?? []);
    setTickets((ticketsRes.data as SupportTicket[]) ?? []);
    setReviews((reviewsRes.data as ServiceReview[]) ?? []);

    if (addressesRes.data?.profile_id) {
      const { data: addr } = await supabase.from('addresses').select('*').eq('profile_id', addressesRes.data.profile_id);
      setAddresses((addr as Address[]) ?? []);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function toggleStatus() {
    if (!customer || !profile) return;
    setBusy(true);
    const nextStatus = customer.customer_status === 'suspended' ? 'active' : 'suspended';
    const { error } = await supabase.from('customer_profiles').update({ customer_status: nextStatus }).eq('id', customer.id);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Customer account ${nextStatus === 'suspended' ? 'suspended' : 'reactivated'}.`);
      await logAdminAction(profile.id, 'customer_account_updated', 'customer_profiles', customer.id, `Set status to ${nextStatus}`);
      await load();
    }
    setBusy(false);
    setConfirmOpen(false);
  }

  if (loading) return <FullPageSpinner label="Loading customer profile…" />;
  if (!customer) return <p>Customer not found.</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Link to="/dashboard/customers" style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        ← Back to Customers
      </Link>

      <GlassCard style={{ padding: 22, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>
            {customer.profiles?.first_name} {customer.profiles?.last_name}
          </h2>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {customer.customer_number} · {customer.profiles?.email} · {customer.profiles?.phone ?? 'No phone'}
          </div>
          <div style={{ marginTop: 10 }}>
            <StatusBadge status={customer.customer_status} />
          </div>
        </div>
        {canManage && (
          <button
            className={`btn ${customer.customer_status === 'suspended' ? 'btn-success' : 'btn-danger'}`}
            onClick={() => setConfirmOpen(true)}
          >
            {customer.customer_status === 'suspended' ? 'Reactivate Account' : 'Suspend Account'}
          </button>
        )}
      </GlassCard>

      <div className="card-grid">
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Addresses ({addresses.length})</h3>
          {addresses.map((a) => (
            <div key={a.id} style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
              {a.address_line}, {a.city}, {a.country}
            </div>
          ))}
          {addresses.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No addresses on file.</p>}
        </GlassCard>

        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Reviews ({reviews.length})</h3>
          {reviews.map((r) => (
            <div key={r.id} style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 8 }}>
              {'⭐'.repeat(r.rating)} — {r.review ?? 'No comment'}
            </div>
          ))}
          {reviews.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No reviews yet.</p>}
        </GlassCard>
      </div>

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Bookings ({bookings.length})</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Booking #</th>
                <th>Service</th>
                <th>Date</th>
                <th>Status</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.booking_number}</td>
                  <td>{b.cleaning_services?.name}</td>
                  <td>{formatDate(b.booking_date)}</td>
                  <td>
                    <StatusBadge status={b.booking_status} />
                  </td>
                  <td>
                    <StatusBadge status={b.payment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <div className="card-grid">
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Payments ({payments.length})</h3>
          {payments.map((p) => (
            <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 8 }}>
              <span>{formatDateTime(p.created_at)}</span>
              <span>{formatCurrency(p.amount, p.currency)}</span>
              <StatusBadge status={p.payment_status} />
            </div>
          ))}
          {payments.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No payments yet.</p>}
        </GlassCard>

        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 12 }}>Invoices ({invoices.length})</h3>
          {invoices.map((i) => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 8 }}>
              <span>{i.invoice_number}</span>
              <span>{formatCurrency(i.total, i.currency)}</span>
              <StatusBadge status={i.status} />
            </div>
          ))}
          {invoices.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No invoices yet.</p>}
        </GlassCard>
      </div>

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 12 }}>Support History ({tickets.length})</h3>
        {tickets.map((t) => (
          <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 8 }}>
            <span>{t.subject}</span>
            <StatusBadge status={t.status} />
          </div>
        ))}
        {tickets.length === 0 && <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>No support history.</p>}
      </GlassCard>

      <ConfirmDialog
        open={confirmOpen}
        title={customer.customer_status === 'suspended' ? 'Reactivate account?' : 'Suspend account?'}
        message={
          customer.customer_status === 'suspended'
            ? 'This will restore the customer\'s access to their account.'
            : 'This will prevent the customer from signing in or booking new services.'
        }
        confirmLabel={customer.customer_status === 'suspended' ? 'Reactivate' : 'Suspend'}
        danger={customer.customer_status !== 'suspended'}
        busy={busy}
        onConfirm={toggleStatus}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

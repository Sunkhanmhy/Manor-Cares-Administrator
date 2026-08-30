import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { formatCurrency } from '../../lib/format';
import type { Lead, LeadStatus, Quote } from '../../types/database';

const LEAD_STATUSES: LeadStatus[] = ['new', 'contacted', 'qualified', 'converted', 'lost'];

export function SalesPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('sales.manage');

  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', source: '', estimatedValue: '' });

  async function load() {
    const [leadsRes, quotesRes] = await Promise.all([
      supabase.from('leads').select('*').order('created_at', { ascending: false }),
      supabase.from('quotes').select('*, leads(full_name)').order('created_at', { ascending: false }).limit(20),
    ]);
    setLeads((leadsRes.data as Lead[]) ?? []);
    setQuotes((quotesRes.data as Quote[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addLead() {
    if (!form.fullName.trim() || !profile) return;
    const { error } = await supabase.from('leads').insert({
      full_name: form.fullName.trim(),
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      source: form.source.trim() || null,
      estimated_value: form.estimatedValue ? Number(form.estimatedValue) : null,
      assigned_to: profile.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Lead created.');
    await logAdminAction(profile.id, 'lead_created', 'leads', null, form.fullName.trim());
    setForm({ fullName: '', email: '', phone: '', source: '', estimatedValue: '' });
    load();
  }

  async function updateLeadStatus(lead: Lead, status: LeadStatus) {
    if (!profile) return;
    const { error } = await supabase.from('leads').update({ status }).eq('id', lead.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAdminAction(profile.id, 'lead_updated', 'leads', lead.id, `Status changed to ${status}`);
    load();
  }

  if (loading) return <FullPageSpinner label="Loading sales pipeline…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {canManage && (
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>New Lead</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <input className="input" placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
            <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            <input className="input" placeholder="Source" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} />
            <input
              className="input"
              placeholder="Estimated value"
              type="number"
              value={form.estimatedValue}
              onChange={(e) => setForm({ ...form, estimatedValue: e.target.value })}
            />
            <button className="btn btn-primary" onClick={addLead}>
              Add Lead
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 14 }}>Leads Pipeline</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Name</th>
                <th>Source</th>
                <th>Estimated Value</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td>{l.full_name}</td>
                  <td>{l.source ?? '—'}</td>
                  <td>{formatCurrency(l.estimated_value)}</td>
                  <td>
                    {canManage ? (
                      <select
                        className="input"
                        style={{ padding: '5px 8px', fontSize: 12 }}
                        value={l.status}
                        onChange={(e) => updateLeadStatus(l, e.target.value as LeadStatus)}
                      >
                        {LEAD_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={l.status} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 14 }}>Recent Quotes</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => (
                <tr key={q.id}>
                  <td>{q.leads?.full_name ?? '—'}</td>
                  <td>{formatCurrency(q.amount)}</td>
                  <td>
                    <StatusBadge status={q.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

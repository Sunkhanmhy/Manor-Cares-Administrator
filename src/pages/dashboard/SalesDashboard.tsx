import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatCurrency } from '../../lib/format';
import type { Lead } from '../../types/database';

export function SalesDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalLeads, setTotalLeads] = useState(0);
  const [newLeads, setNewLeads] = useState(0);
  const [converted, setConverted] = useState(0);
  const [pipelineValue, setPipelineValue] = useState(0);
  const [leads, setLeads] = useState<Lead[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [total, recent, convertedCount, openLeads, leadRows] = await Promise.all([
        supabase.from('leads').select('id', { count: 'exact', head: true }),
        supabase.from('leads').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('leads').select('id', { count: 'exact', head: true }).eq('status', 'converted'),
        supabase.from('leads').select('estimated_value').not('status', 'in', '(converted,lost)'),
        supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(10),
      ]);

      if (!active) return;
      setTotalLeads(total.count ?? 0);
      setNewLeads(recent.count ?? 0);
      setConverted(convertedCount.count ?? 0);
      setPipelineValue((openLeads.data ?? []).reduce((sum, l) => sum + Number(l.estimated_value ?? 0), 0));
      setLeads((leadRows.data as Lead[]) ?? []);
      setLoading(false);
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  const conversionRate = totalLeads > 0 ? ((converted / totalLeads) * 100).toFixed(1) : '0.0';

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
        <StatCard icon="📈" label="Total Leads" value={totalLeads} accent="blue" />
        <StatCard icon="🆕" label="New Leads (7 days)" value={newLeads} accent="green" />
        <StatCard icon="🎯" label="Conversion Rate" value={`${conversionRate}%`} accent="green" />
        <StatCard icon="💼" label="Open Pipeline Value" value={formatCurrency(pipelineValue)} accent="blue" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Recent Leads</h3>
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
                    <StatusBadge status={l.status} />
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

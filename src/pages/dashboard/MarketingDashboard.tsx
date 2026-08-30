import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import type { MarketingCampaign, Promotion } from '../../types/database';

export function MarketingDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeCampaigns, setActiveCampaigns] = useState(0);
  const [activePromotions, setActivePromotions] = useState(0);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const [campaignsActive, promosActive, customers, campaignRows, promoRows] = await Promise.all([
        supabase.from('marketing_campaigns').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('customer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }).limit(8),
        supabase.from('promotions').select('*').order('created_at', { ascending: false }).limit(8),
      ]);

      if (!active) return;
      setActiveCampaigns(campaignsActive.count ?? 0);
      setActivePromotions(promosActive.count ?? 0);
      setTotalCustomers(customers.count ?? 0);
      setCampaigns((campaignRows.data as MarketingCampaign[]) ?? []);
      setPromotions((promoRows.data as Promotion[]) ?? []);
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
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
        <StatCard icon="📣" label="Active Campaigns" value={activeCampaigns} accent="blue" />
        <StatCard icon="🏷️" label="Active Promotions" value={activePromotions} accent="green" />
        <StatCard icon="👥" label="Total Customers (reach)" value={totalCustomers} accent="blue" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Campaigns</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Name</th>
                <th>Channel</th>
                <th>Budget</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.channel ?? '—'}</td>
                  <td>{c.budget ?? '—'}</td>
                  <td>
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Promotions</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Title</th>
                <th>Code</th>
                <th>Discount</th>
                <th>Active</th>
              </tr>
            </thead>
            <tbody>
              {promotions.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>{p.promo_code}</td>
                  <td>{p.discount_type === 'percentage' ? `${p.discount_value}%` : p.discount_value}</td>
                  <td>
                    <StatusBadge status={p.is_active ? 'active' : 'inactive'} />
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

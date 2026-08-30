import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import type { CampaignStatus, MarketingCampaign, Promotion } from '../../types/database';

const CAMPAIGN_STATUSES: CampaignStatus[] = ['draft', 'active', 'paused', 'completed'];

export function MarketingPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('marketing.manage');

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [campaignForm, setCampaignForm] = useState({ name: '', channel: '', budget: '' });
  const [promoForm, setPromoForm] = useState({ title: '', promoCode: '', discountValue: '' });

  async function load() {
    const [campaignsRes, promosRes] = await Promise.all([
      supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false }),
      supabase.from('promotions').select('*').order('created_at', { ascending: false }),
    ]);
    setCampaigns((campaignsRes.data as MarketingCampaign[]) ?? []);
    setPromotions((promosRes.data as Promotion[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCampaign() {
    if (!campaignForm.name.trim() || !profile) return;
    const { error } = await supabase.from('marketing_campaigns').insert({
      name: campaignForm.name.trim(),
      channel: campaignForm.channel.trim() || null,
      budget: campaignForm.budget ? Number(campaignForm.budget) : null,
      created_by: profile.id,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Campaign created.');
    await logAdminAction(profile.id, 'campaign_created', 'marketing_campaigns', null, campaignForm.name.trim());
    setCampaignForm({ name: '', channel: '', budget: '' });
    load();
  }

  async function updateCampaignStatus(campaign: MarketingCampaign, status: CampaignStatus) {
    if (!profile) return;
    const { error } = await supabase.from('marketing_campaigns').update({ status }).eq('id', campaign.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    await logAdminAction(profile.id, 'campaign_updated', 'marketing_campaigns', campaign.id, `Status changed to ${status}`);
    load();
  }

  async function createPromotion() {
    if (!promoForm.title.trim() || !promoForm.promoCode.trim() || !profile) return;
    const { error } = await supabase.from('promotions').insert({
      title: promoForm.title.trim(),
      promo_code: promoForm.promoCode.trim().toUpperCase(),
      discount_value: promoForm.discountValue ? Number(promoForm.discountValue) : 0,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Promotion created.');
    await logAdminAction(profile.id, 'promotion_created', 'promotions', null, promoForm.title.trim());
    setPromoForm({ title: '', promoCode: '', discountValue: '' });
    load();
  }

  if (loading) return <FullPageSpinner label="Loading marketing data…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {canManage && (
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>New Campaign</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <input className="input" placeholder="Campaign name" value={campaignForm.name} onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })} />
            <input className="input" placeholder="Channel (email, SMS, social…)" value={campaignForm.channel} onChange={(e) => setCampaignForm({ ...campaignForm, channel: e.target.value })} />
            <input className="input" placeholder="Budget" type="number" value={campaignForm.budget} onChange={(e) => setCampaignForm({ ...campaignForm, budget: e.target.value })} />
            <button className="btn btn-primary" onClick={createCampaign}>
              Create Campaign
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 14 }}>Campaigns</h3>
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
                    {canManage ? (
                      <select
                        className="input"
                        style={{ padding: '5px 8px', fontSize: 12 }}
                        value={c.status}
                        onChange={(e) => updateCampaignStatus(c, e.target.value as CampaignStatus)}
                      >
                        {CAMPAIGN_STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <StatusBadge status={c.status} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {canManage && (
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>New Promotion</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <input className="input" placeholder="Title" value={promoForm.title} onChange={(e) => setPromoForm({ ...promoForm, title: e.target.value })} />
            <input className="input" placeholder="Promo code" value={promoForm.promoCode} onChange={(e) => setPromoForm({ ...promoForm, promoCode: e.target.value })} />
            <input
              className="input"
              placeholder="Discount % or amount"
              type="number"
              value={promoForm.discountValue}
              onChange={(e) => setPromoForm({ ...promoForm, discountValue: e.target.value })}
            />
            <button className="btn btn-primary" onClick={createPromotion}>
              Create Promotion
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 14 }}>Promotions</h3>
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

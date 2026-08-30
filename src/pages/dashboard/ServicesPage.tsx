import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { formatCurrency } from '../../lib/format';
import type { CleaningService } from '../../types/database';

export function ServicesPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('sales.manage') || hasPermission('marketing.manage');

  const [services, setServices] = useState<CleaningService[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from('cleaning_services').select('*').order('display_order');
    setServices((data as CleaningService[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggleActive(service: CleaningService) {
    if (!profile) return;
    const { error } = await supabase.from('cleaning_services').update({ is_active: !service.is_active }).eq('id', service.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${service.name} ${service.is_active ? 'deactivated' : 'activated'}.`);
    await logAdminAction(profile.id, 'service_updated', 'cleaning_services', service.id, `Set active=${!service.is_active}`);
    load();
  }

  if (loading) return <FullPageSpinner label="Loading cleaning services…" />;

  return (
    <GlassCard style={{ padding: 0 }}>
      <div className="scroll-x">
        <table className="table-clean">
          <thead>
            <tr>
              <th>Service</th>
              <th>Base Price</th>
              <th>Unit</th>
              <th>Est. Duration</th>
              <th>Status</th>
              {canManage && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {services.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{formatCurrency(s.base_price)}</td>
                <td>{s.price_unit}</td>
                <td>{s.estimated_duration_minutes ? `${s.estimated_duration_minutes} min` : '—'}</td>
                <td>
                  <StatusBadge status={s.is_active ? 'active' : 'inactive'} />
                </td>
                {canManage && (
                  <td>
                    <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(s)}>
                      {s.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </GlassCard>
  );
}

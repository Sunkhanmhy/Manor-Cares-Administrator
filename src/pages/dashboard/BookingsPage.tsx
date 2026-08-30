import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { EmptyState } from '../../components/EmptyState';
import { FullPageSpinner } from '../../components/Spinner';
import { formatDate, formatTime } from '../../lib/format';
import type { Booking, BookingStatus, CleaningTeam } from '../../types/database';

const STATUS_OPTIONS: BookingStatus[] = ['pending', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled', 'rescheduled'];

export function BookingsPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('bookings.manage');

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [teams, setTeams] = useState<CleaningTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');

  async function load() {
    setLoading(true);
    const [bookingsRes, teamsRes] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, cleaning_services(name), customer_profiles(customer_number, profiles(first_name, last_name))')
        .order('booking_date', { ascending: false })
        .limit(200),
      supabase.from('cleaning_teams').select('*').eq('status', 'active'),
    ]);
    setBookings((bookingsRes.data as Booking[]) ?? []);
    setTeams((teamsRes.data as CleaningTeam[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return bookings.filter((b) => {
      if (statusFilter !== 'all' && b.booking_status !== statusFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        b.booking_number.toLowerCase().includes(q) ||
        `${b.customer_profiles?.profiles?.first_name ?? ''} ${b.customer_profiles?.profiles?.last_name ?? ''}`
          .toLowerCase()
          .includes(q)
      );
    });
  }, [bookings, statusFilter, search]);

  async function updateStatus(booking: Booking, status: BookingStatus) {
    if (!profile) return;
    const { error } = await supabase.from('bookings').update({ booking_status: status }).eq('id', booking.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Booking ${booking.booking_number} marked ${status}.`);
    await logAdminAction(profile.id, 'booking_modified', 'bookings', booking.id, `Status changed to ${status}`);
    load();
  }

  async function assignTeam(booking: Booking, teamId: number) {
    if (!profile) return;
    const { error } = await supabase
      .from('booking_assignments')
      .upsert({ booking_id: booking.id, team_id: teamId, status: 'scheduled' }, { onConflict: 'booking_id' });
    if (error) {
      toast.error(error.message);
      return;
    }
    await supabase.from('bookings').update({ booking_status: 'assigned' }).eq('id', booking.id);
    toast.success(`Team assigned to booking ${booking.booking_number}.`);
    await logAdminAction(profile.id, 'booking_modified', 'bookings', booking.id, `Assigned team #${teamId}`);
    load();
  }

  if (loading) return <FullPageSpinner label="Loading bookings…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 18, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ maxWidth: 260 }}
          placeholder="Search booking # or customer"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input" style={{ maxWidth: 200 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--text-muted)' }}>{filtered.length} bookings</span>
      </GlassCard>

      <GlassCard style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <EmptyState icon="📅" title="No bookings found" />
        ) : (
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Booking #</th>
                  <th>Customer</th>
                  <th>Service</th>
                  <th>Date / Time</th>
                  <th>Address</th>
                  <th>Status</th>
                  <th>Payment</th>
                  {canManage && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map((b) => (
                  <tr key={b.id}>
                    <td>{b.booking_number}</td>
                    <td>
                      {b.customer_profiles?.profiles?.first_name} {b.customer_profiles?.profiles?.last_name}
                    </td>
                    <td>{b.cleaning_services?.name}</td>
                    <td>
                      {formatDate(b.booking_date)} {formatTime(b.booking_time)}
                    </td>
                    <td style={{ maxWidth: 220, whiteSpace: 'normal' }}>{b.property_address}</td>
                    <td>
                      <StatusBadge status={b.booking_status} />
                    </td>
                    <td>
                      <StatusBadge status={b.payment_status} />
                    </td>
                    {canManage && (
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select
                            className="input"
                            style={{ padding: '6px 8px', fontSize: 12 }}
                            value={b.booking_status}
                            onChange={(e) => updateStatus(b, e.target.value as BookingStatus)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                          {teams.length > 0 && (
                            <select
                              className="input"
                              style={{ padding: '6px 8px', fontSize: 12 }}
                              defaultValue=""
                              onChange={(e) => e.target.value && assignTeam(b, Number(e.target.value))}
                            >
                              <option value="" disabled>
                                Assign team…
                              </option>
                              {teams.map((t) => (
                                <option key={t.id} value={t.id}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

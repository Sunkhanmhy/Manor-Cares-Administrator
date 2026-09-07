import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDateTime } from '../../lib/format';
import type { BookingAssignment } from '../../types/database';

export function TransportationDashboard() {
  const [loading, setLoading] = useState(true);
  const [teams, setTeams] = useState(0);
  const [vehiclesAvailable, setVehiclesAvailable] = useState(0);
  const [todaysAssignments, setTodaysAssignments] = useState<BookingAssignment[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const [teamCount, vehicleCount, assignments] = await Promise.all([
        supabase.from('cleaning_teams').select('id', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'available'),
        supabase
          .from('booking_assignments')
          .select('*, bookings(booking_number, property_address), cleaning_teams(name), vehicles(plate_number)')
          .gte('scheduled_at', startOfDay.toISOString())
          .lte('scheduled_at', endOfDay.toISOString())
          .order('scheduled_at', { ascending: true }),
      ]);

      if (!active) return;
      setTeams(teamCount.count ?? 0);
      setVehiclesAvailable(vehicleCount.count ?? 0);
      setTodaysAssignments((assignments.data as BookingAssignment[]) ?? []);
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
        <StatCard icon="truck" label="Active Cleaning Teams" value={teams} accent="blue" />
        <StatCard icon="car" label="Vehicles Available" value={vehiclesAvailable} accent="green" />
        <StatCard icon="map-pin" label="Today's Assignments" value={todaysAssignments.length} accent="blue" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Today's Assignments</h3>
        {todaysAssignments.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No assignments scheduled for today.</p>
        ) : (
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Address</th>
                  <th>Team</th>
                  <th>Vehicle</th>
                  <th>Time</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {todaysAssignments.map((a) => (
                  <tr key={a.id}>
                    <td>{a.bookings?.booking_number}</td>
                    <td>{a.bookings?.property_address}</td>
                    <td>{a.cleaning_teams?.name}</td>
                    <td>{a.vehicles?.plate_number ?? '—'}</td>
                    <td>{formatDateTime(a.scheduled_at)}</td>
                    <td>
                      <StatusBadge status={a.status} />
                    </td>
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

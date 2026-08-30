import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import type { CleaningTeam, Employee, Vehicle } from '../../types/database';

export function TransportationPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('transportation.manage');

  const [teams, setTeams] = useState<CleaningTeam[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTeamName, setNewTeamName] = useState('');
  const [newVehiclePlate, setNewVehiclePlate] = useState('');

  async function load() {
    setLoading(true);
    const [teamsRes, vehiclesRes, employeesRes] = await Promise.all([
      supabase.from('cleaning_teams').select('*, employees:leader_employee_id(first_name, last_name)'),
      supabase.from('vehicles').select('*'),
      supabase.from('employees').select('*').eq('employment_status', 'active'),
    ]);
    setTeams((teamsRes.data as CleaningTeam[]) ?? []);
    setVehicles((vehiclesRes.data as Vehicle[]) ?? []);
    setEmployees((employeesRes.data as Employee[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function createTeam() {
    if (!newTeamName.trim() || !profile) return;
    const { error } = await supabase.from('cleaning_teams').insert({ name: newTeamName.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Cleaning team created.');
    await logAdminAction(profile.id, 'team_created', 'cleaning_teams', null, newTeamName.trim());
    setNewTeamName('');
    load();
  }

  async function createVehicle() {
    if (!newVehiclePlate.trim() || !profile) return;
    const { error } = await supabase.from('vehicles').insert({ plate_number: newVehiclePlate.trim() });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Vehicle added.');
    await logAdminAction(profile.id, 'vehicle_created', 'vehicles', null, newVehiclePlate.trim());
    setNewVehiclePlate('');
    load();
  }

  async function setTeamLeader(team: CleaningTeam, employeeId: number) {
    const { error } = await supabase.from('cleaning_teams').update({ leader_employee_id: employeeId }).eq('id', team.id);
    if (error) toast.error(error.message);
    else load();
  }

  if (loading) return <FullPageSpinner label="Loading transportation & logistics…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card-grid">
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>Cleaning Teams</h3>
          {canManage && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input className="input" placeholder="New team name" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} />
              <button className="btn btn-primary btn-sm" onClick={createTeam}>
                Add
              </button>
            </div>
          )}
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Leader</th>
                  <th>Status</th>
                  {canManage && <th>Set Leader</th>}
                </tr>
              </thead>
              <tbody>
                {teams.map((t) => (
                  <tr key={t.id}>
                    <td>{t.name}</td>
                    <td>
                      {t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : '—'}
                    </td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                    {canManage && (
                      <td>
                        <select
                          className="input"
                          style={{ padding: '5px 8px', fontSize: 12 }}
                          defaultValue=""
                          onChange={(e) => e.target.value && setTeamLeader(t, Number(e.target.value))}
                        >
                          <option value="" disabled>
                            Choose…
                          </option>
                          {employees.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.first_name} {e.last_name}
                            </option>
                          ))}
                        </select>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>

        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>Vehicles</h3>
          {canManage && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <input
                className="input"
                placeholder="Plate number"
                value={newVehiclePlate}
                onChange={(e) => setNewVehiclePlate(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={createVehicle}>
                Add
              </button>
            </div>
          )}
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Plate</th>
                  <th>Model</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v.id}>
                    <td>{v.plate_number}</td>
                    <td>{v.model ?? '—'}</td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}

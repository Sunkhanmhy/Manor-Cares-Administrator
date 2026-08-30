import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { StatCard } from '../../components/StatCard';
import { SkeletonCard } from '../../components/Skeleton';
import { StatusBadge } from '../../components/StatusBadge';
import { formatDate } from '../../lib/format';
import type { Employee, LeaveRequest } from '../../types/database';

export function HRDashboard() {
  const [loading, setLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [newEmployees, setNewEmployees] = useState(0);
  const [onLeaveToday, setOnLeaveToday] = useState(0);
  const [pendingLeave, setPendingLeave] = useState<LeaveRequest[]>([]);
  const [directory, setDirectory] = useState<Employee[]>([]);

  useEffect(() => {
    let active = true;
    async function load() {
      const monthStart = new Date();
      monthStart.setDate(1);
      const today = new Date().toISOString().slice(0, 10);

      const [total, activeCount, recent, onLeave, leaveReqs, employees] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact', head: true }),
        supabase.from('employees').select('id', { count: 'exact', head: true }).eq('employment_status', 'active'),
        supabase.from('employees').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
        supabase.from('staff_attendance').select('id', { count: 'exact', head: true }).eq('work_date', today).eq('status', 'on_leave'),
        supabase
          .from('leave_requests')
          .select('*, employees(first_name, last_name, employee_code)')
          .eq('status', 'pending')
          .order('requested_at', { ascending: false })
          .limit(8),
        supabase.from('employees').select('*').order('created_at', { ascending: false }).limit(8),
      ]);

      if (!active) return;
      setTotalEmployees(total.count ?? 0);
      setActiveEmployees(activeCount.count ?? 0);
      setNewEmployees(recent.count ?? 0);
      setOnLeaveToday(onLeave.count ?? 0);
      setPendingLeave((leaveReqs.data as LeaveRequest[]) ?? []);
      setDirectory((employees.data as Employee[]) ?? []);
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
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="stat-grid">
        <StatCard icon="🧑‍💼" label="Total Employees" value={totalEmployees} accent="blue" />
        <StatCard icon="✅" label="Active Employees" value={activeEmployees} accent="green" />
        <StatCard icon="🆕" label="New Employees (month)" value={newEmployees} accent="green" />
        <StatCard icon="🌴" label="On Leave Today" value={onLeaveToday} accent="amber" />
      </div>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Pending Leave Requests</h3>
        {pendingLeave.length === 0 ? (
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>No pending leave requests.</p>
        ) : (
          <div className="scroll-x">
            <table className="table-clean">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Dates</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingLeave.map((lr) => (
                  <tr key={lr.id}>
                    <td>
                      {lr.employees?.first_name} {lr.employees?.last_name}
                    </td>
                    <td>{lr.leave_type}</td>
                    <td>
                      {formatDate(lr.start_date)} – {formatDate(lr.end_date)}
                    </td>
                    <td>
                      <StatusBadge status={lr.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </GlassCard>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ marginBottom: 16, fontSize: 15 }}>Employee Directory (recent)</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {directory.map((e) => (
                <tr key={e.id}>
                  <td>{e.employee_code}</td>
                  <td>
                    {e.first_name} {e.last_name}
                  </td>
                  <td>{e.department ?? '—'}</td>
                  <td>{e.job_title ?? '—'}</td>
                  <td>
                    <StatusBadge status={e.employment_status} />
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

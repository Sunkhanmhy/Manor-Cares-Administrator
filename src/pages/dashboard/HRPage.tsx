import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { StatusBadge } from '../../components/StatusBadge';
import { FullPageSpinner } from '../../components/Spinner';
import { formatDate } from '../../lib/format';
import type { Employee, LeaveRequest } from '../../types/database';

export function HRPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canManage = isSuperAdmin || hasPermission('staff.manage');

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', department: '', jobTitle: '' });

  async function load() {
    setLoading(true);
    const [employeesRes, leaveRes] = await Promise.all([
      supabase.from('employees').select('*').order('created_at', { ascending: false }),
      supabase.from('leave_requests').select('*, employees(first_name, last_name)').order('requested_at', { ascending: false }).limit(20),
    ]);
    setEmployees((employeesRes.data as Employee[]) ?? []);
    setLeaveRequests((leaveRes.data as LeaveRequest[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function addEmployee() {
    if (!form.firstName.trim() || !form.lastName.trim() || !form.email.trim() || !profile) return;
    const { error } = await supabase.from('employees').insert({
      first_name: form.firstName.trim(),
      last_name: form.lastName.trim(),
      email: form.email.trim(),
      department: form.department.trim() || null,
      job_title: form.jobTitle.trim() || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Employee added.');
    await logAdminAction(profile.id, 'employee_created', 'employees', null, `${form.firstName} ${form.lastName}`);
    setForm({ firstName: '', lastName: '', email: '', department: '', jobTitle: '' });
    load();
  }

  async function decideLeave(request: LeaveRequest, decision: 'approved' | 'rejected') {
    if (!profile) return;
    const { error } = await supabase
      .from('leave_requests')
      .update({ status: decision, decided_by: profile.id, decided_at: new Date().toISOString() })
      .eq('id', request.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`Leave request ${decision}.`);
    await logAdminAction(profile.id, 'leave_request_decided', 'leave_requests', request.id, decision);
    load();
  }

  if (loading) return <FullPageSpinner label="Loading HR data…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {canManage && (
        <GlassCard style={{ padding: 20 }}>
          <h3 style={{ fontSize: 14, marginBottom: 14 }}>Add Employee</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            <input className="input" placeholder="First name" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            <input className="input" placeholder="Last name" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <input className="input" placeholder="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
            <input className="input" placeholder="Job title" value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} />
            <button className="btn btn-primary" onClick={addEmployee}>
              Add Employee
            </button>
          </div>
        </GlassCard>
      )}

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 14 }}>Employee Directory</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Department</th>
                <th>Job Title</th>
                <th>Hire Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => (
                <tr key={e.id}>
                  <td>{e.employee_code}</td>
                  <td>
                    {e.first_name} {e.last_name}
                  </td>
                  <td>{e.department ?? '—'}</td>
                  <td>{e.job_title ?? '—'}</td>
                  <td>{formatDate(e.hire_date)}</td>
                  <td>
                    <StatusBadge status={e.employment_status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 20 }}>
        <h3 style={{ fontSize: 14, marginBottom: 14 }}>Leave Requests</h3>
        <div className="scroll-x">
          <table className="table-clean">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Type</th>
                <th>Dates</th>
                <th>Status</th>
                {canManage && <th>Decision</th>}
              </tr>
            </thead>
            <tbody>
              {leaveRequests.map((lr) => (
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
                  {canManage && (
                    <td>
                      {lr.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => decideLeave(lr, 'approved')}>
                            Approve
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => decideLeave(lr, 'rejected')}>
                            Reject
                          </button>
                        </div>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}

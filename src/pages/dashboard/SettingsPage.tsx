import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { GlassCard } from '../../components/GlassCard';
import { PasswordStrengthMeter, evaluatePasswordStrength } from '../../components/PasswordStrengthMeter';
import { ROLE_LABELS } from '../../lib/permissions';

export function SettingsPage() {
  const { profile, adminProfile, roleKeys, isSuperAdmin, updatePassword } = useAuth();
  const toast = useToast();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleUpdatePassword() {
    if (evaluatePasswordStrength(newPassword).score < 2) {
      toast.error('Please choose a stronger password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSaving(true);
    try {
      await updatePassword(newPassword);
      toast.success('Password updated.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update password.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 560 }}>
      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Your Profile</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13.5 }}>
          <div>
            <strong>Name:</strong> {profile?.first_name} {profile?.last_name}
          </div>
          <div>
            <strong>Email:</strong> {profile?.email}
          </div>
          <div>
            <strong>Employee code:</strong> {adminProfile?.employee_code}
          </div>
          <div>
            <strong>Role:</strong> {isSuperAdmin ? ROLE_LABELS.super_admin : roleKeys.map((r) => ROLE_LABELS[r]).join(', ') || '—'}
          </div>
          <div>
            <strong>Department:</strong> {adminProfile?.department ?? '—'}
          </div>
        </div>
      </GlassCard>

      <GlassCard style={{ padding: 22 }}>
        <h3 style={{ fontSize: 15, marginBottom: 14 }}>Change Password</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="field">
            <label>New password</label>
            <input className="input" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
            <PasswordStrengthMeter password={newPassword} />
          </div>
          <div className="field">
            <label>Confirm new password</label>
            <input className="input" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <button className="btn btn-primary" disabled={saving} onClick={handleUpdatePassword}>
            {saving ? 'Saving…' : 'Update Password'}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}

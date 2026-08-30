import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { logAdminAction } from '../../lib/audit';
import { GlassCard } from '../../components/GlassCard';
import { FullPageSpinner } from '../../components/Spinner';

export function NotificationsPage() {
  const { hasPermission, isSuperAdmin, profile } = useAuth();
  const toast = useToast();
  const canBroadcast = isSuperAdmin || hasPermission('marketing.manage') || hasPermission('support.manage');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  useEffect(() => {
    supabase
      .from('customer_profiles')
      .select('id', { count: 'exact', head: true })
      .eq('customer_status', 'active')
      .then(({ count }) => setAudienceCount(count ?? 0));
  }, []);

  async function sendBroadcast() {
    if (!title.trim() || !message.trim() || !profile) return;
    setSending(true);
    const { data: customers, error: fetchError } = await supabase
      .from('customer_profiles')
      .select('profile_id')
      .eq('customer_status', 'active');

    if (fetchError || !customers) {
      toast.error(fetchError?.message ?? 'Could not load audience.');
      setSending(false);
      return;
    }

    const rows = customers.map((c) => ({
      profile_id: c.profile_id,
      type: 'promotional' as const,
      title: title.trim(),
      message: message.trim(),
    }));

    const { error } = await supabase.from('notifications').insert(rows);
    if (error) {
      toast.error(error.message);
      setSending(false);
      return;
    }

    toast.success(`Notification sent to ${rows.length} customers.`);
    await logAdminAction(profile.id, 'notification_broadcast', 'notifications', null, title.trim());
    setTitle('');
    setMessage('');
    setSending(false);
  }

  if (audienceCount === null) return <FullPageSpinner label="Loading notification center…" />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <GlassCard style={{ padding: 22, maxWidth: 560 }}>
        <h3 style={{ fontSize: 15, marginBottom: 6 }}>Broadcast Notification</h3>
        <p style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 16 }}>
          Sends a promotional notification to all {audienceCount} active customers.
        </p>
        {!canBroadcast ? (
          <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>You do not have permission to send broadcasts.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="field">
              <label>Title</label>
              <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 20% off this weekend!" />
            </div>
            <div className="field">
              <label>Message</label>
              <textarea className="input" style={{ minHeight: 90 }} value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={sending} onClick={sendBroadcast}>
              {sending ? 'Sending…' : `Send to ${audienceCount} customers`}
            </button>
          </div>
        )}
      </GlassCard>
    </div>
  );
}

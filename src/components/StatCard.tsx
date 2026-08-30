import type { ReactNode } from 'react';
import { GlassCard } from './GlassCard';

export function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'blue',
}: {
  icon: string;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: 'blue' | 'green' | 'amber' | 'red';
}) {
  const accentColor =
    accent === 'green' ? 'var(--clr-green)' : accent === 'amber' ? '#ffd88a' : accent === 'red' ? '#ffb4b4' : 'var(--clr-blue)';

  return (
    <GlassCard style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 16,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid var(--glass-border)',
          }}
          aria-hidden="true"
        >
          {icon}
        </span>
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accentColor }}>{value}</div>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{hint}</div>}
    </GlassCard>
  );
}

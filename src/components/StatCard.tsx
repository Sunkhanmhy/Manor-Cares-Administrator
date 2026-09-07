import type { ReactNode } from 'react';
import { GlassCard } from './GlassCard';
import { IconBadge, type Accent } from './icons/IconBadge';
import type { IconName } from './icons/Icon';

export function StatCard({
  icon,
  label,
  value,
  hint,
  accent = 'blue',
}: {
  icon: IconName;
  label: string;
  value: ReactNode;
  hint?: string;
  accent?: Accent;
}) {
  return (
    <GlassCard style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <IconBadge name={icon} accent={accent} shape="circle" size={34} />
        <span style={{ fontSize: 12.5, color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, color: accent === 'green' ? 'var(--clr-green)' : accent === 'amber' ? '#ffd88a' : accent === 'red' ? '#ffb4b4' : accent === 'purple' ? 'var(--accent-purple)' : 'var(--clr-blue)' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>{hint}</div>}
    </GlassCard>
  );
}

import { Icon, type IconName } from './Icon';

export type Accent = 'blue' | 'green' | 'amber' | 'red' | 'purple';

/** Maps each accent to its brand/extended CSS custom property. */
export const ACCENT_VAR: Record<Accent, string> = {
  blue: 'var(--clr-blue)',
  green: 'var(--clr-green)',
  amber: 'var(--accent-amber)',
  red: 'var(--accent-red)',
  purple: 'var(--accent-purple)',
};

export function IconBadge({
  name,
  accent = 'blue',
  shape = 'circle',
  size = 40,
}: {
  name: IconName;
  accent?: Accent;
  shape?: 'circle' | 'square';
  size?: number;
}) {
  const color = ACCENT_VAR[accent];
  return (
    <span
      className="icon-badge"
      style={{
        width: size,
        height: size,
        borderRadius: shape === 'circle' ? '50%' : size * 0.32,
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
        color,
      }}
    >
      <Icon name={name} size={Math.round(size * 0.52)} />
    </span>
  );
}

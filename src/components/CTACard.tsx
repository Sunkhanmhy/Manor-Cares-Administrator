import { Link } from 'react-router-dom';
import { IconBadge, ACCENT_VAR, type Accent } from './icons/IconBadge';
import type { IconName } from './icons/Icon';

export function CTACard({
  icon,
  accent = 'blue',
  title,
  description,
  actionLabel,
  to,
  onClick,
}: {
  icon: IconName;
  accent?: Accent;
  title: string;
  description: string;
  actionLabel: string;
  to?: string;
  onClick?: () => void;
}) {
  const color = ACCENT_VAR[accent];
  const actionStyle: React.CSSProperties = {
    background: `color-mix(in srgb, ${color} 82%, black)`,
    color: 'var(--clr-white)',
    boxShadow: `0 8px 20px color-mix(in srgb, ${color} 35%, transparent)`,
  };

  return (
    <div className="cta-card" style={{ borderColor: `color-mix(in srgb, ${color} 40%, transparent)` }}>
      <IconBadge name={icon} accent={accent} shape="square" size={48} />
      <h3 className="cta-card-title">{title}</h3>
      <p className="cta-card-desc">{description}</p>
      {to ? (
        <Link to={to} className="btn cta-card-action" style={actionStyle}>
          {actionLabel}
        </Link>
      ) : (
        <button type="button" className="btn cta-card-action" style={actionStyle} onClick={onClick}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

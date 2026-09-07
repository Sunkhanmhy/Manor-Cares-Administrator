import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function Topbar({
  title,
  onMenuClick,
  theme,
  onToggleTheme,
}: {
  title: string;
  onMenuClick: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const initials = profile ? `${profile.first_name[0] ?? ''}${profile.last_name[0] ?? ''}`.toUpperCase() : '';

  return (
    <header className="glass topbar">
      <button
        className="btn btn-ghost hamburger-btn"
        onClick={onMenuClick}
        aria-label="Toggle navigation menu"
        style={{ padding: '8px 12px' }}
      >
        ☰
      </button>
      <h1 style={{ fontSize: 18 }}>{title}</h1>
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
        <button
          className="btn btn-ghost"
          onClick={() => navigate('/dashboard/notifications')}
          aria-label="Notifications"
          style={{ padding: '9px 12px' }}
        >
          🔔
        </button>
        <button
          className={`theme-toggle-3d ${theme === 'light' ? 'is-light' : 'is-dark'}`}
          onClick={onToggleTheme}
          type="button"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span className="theme-toggle-track">
            <span className="theme-toggle-knob">{theme === 'dark' ? '🌙' : '☀️'}</span>
          </span>
        </button>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--clr-blue), var(--clr-green))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--clr-white)',
          }}
        >
          {initials || '🙂'}
        </div>
      </div>
    </header>
  );
}

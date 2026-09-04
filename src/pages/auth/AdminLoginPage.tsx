import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { setRememberMe } from '../../lib/supabaseClient';
import { GlassCard } from '../../components/GlassCard';
import { Spinner } from '../../components/Spinner';
import { FullPageSpinner } from '../../components/Spinner';

export function AdminLoginPage() {
  const { session, loading, signIn, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Submitting stays true across the gap between signIn() resolving and the async
  // admin_profiles/role check in AuthContext finishing — clear it once that check
  // reports a failure (success instead unmounts this page via the `session` redirect below).
  useEffect(() => {
    if (authError) setSubmitting(false);
  }, [authError]);

  if (loading) return <FullPageSpinner label="Verifying session…" />;
  if (session) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    clearAuthError();

    if (!email.trim() || !password) {
      setError('Please enter both your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      setRememberMe(remember);
      await signIn(email.trim(), password);
      // Don't navigate here: signIn() only resolves once Supabase Auth accepts the
      // credentials — the admin_profiles/role/permission checks in AuthContext's
      // onAuthStateChange handler are still resolving asynchronously. Navigating
      // immediately raced ProtectedRoute (session was still null), bouncing back to
      // "/". Instead, the `if (session)` check above re-navigates once the admin
      // session has actually finished loading and been confirmed valid.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.');
      setSubmitting(false);
    }
  }

  const displayError = error ?? authError;

  return (
    <div className="auth-shell" style={{ justifyContent: 'center' }}>
      <div className="auth-col">
        <GlassCard strong style={{ padding: 'clamp(24px, 4vw, 40px)', width: '100%', maxWidth: 480 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              background: 'linear-gradient(135deg, var(--clr-blue), var(--clr-green))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              color: 'var(--clr-white)',
              marginBottom: 18,
              fontSize: 15,
            }}
          >
            MC
          </div>
          <h2 style={{ fontSize: 26, marginBottom: 6 }}>Administration Portal</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 13.5, marginBottom: 20 }}>
            Secure access for authorized management and staff.
          </p>

          <div className="security-banner" style={{ marginBottom: 22 }}>
            <span aria-hidden="true">🛡️</span>
            <span>
              This portal is restricted to verified administrative and staff accounts. All sign-ins and actions are logged for
              security and compliance.
            </span>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }} noValidate>
            <div className="field">
              <label htmlFor="admin-email">Email address</label>
              <input
                id="admin-email"
                type="email"
                className="input"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@manor-cares.com"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="admin-password">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  style={{
                    position: 'absolute',
                    right: 10,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="checkbox-row" style={{ alignItems: 'center' }}>
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Remember session
              </label>
              <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--clr-white)' }}>
                Forgot Password?
              </Link>
            </div>

            {displayError && (
              <p className="error-text" role="alert">
                {displayError}
              </p>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
              {submitting ? <Spinner size={16} /> : 'Sign In'}
            </button>
          </form>

          <p style={{ marginTop: 22, fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            Admin accounts are created by a Super Admin only. If you don&apos;t have credentials, contact your administrator.
          </p>
        </GlassCard>
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AuthService } from '../services/authService';
import { Icon } from '../components/Icons';

// Sanitize email on input: strip whitespace, lowercase
function sanitizeEmail(v: string): string {
  return v.replace(/\s/g, '').toLowerCase();
}

export default function DriverLoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail   ] = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw  ] = useState(false);
  const [loading,  setLoading ] = useState(false);
  const [error,    setError   ] = useState('');

  // Forgot password state
  const [showReset,    setShowReset   ] = useState(false);
  const [resetEmail,   setResetEmail  ] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg,     setResetMsg    ] = useState('');
  const [resetError,   setResetError  ] = useState('');

  // ── Login ──────────────────────────────────────────────────────────────────

  const handleLogin = async () => {
    setError('');
    if (!email)    return setError('Please enter your email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
                   return setError('Enter a valid email address');
    if (!password) return setError('Please enter your password');

    setLoading(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err: any) {
      const code: string = err?.code ?? '';
      if (code === 'auth/user-not-found' || code === 'auth/wrong-password' || code === 'auth/invalid-credential')
        setError('Incorrect email or password. Please try again.');
      else if (code === 'auth/too-many-requests')
        setError('Too many failed attempts. Please wait a moment and try again.');
      else if (code === 'auth/user-disabled')
        setError('This account has been disabled. Contact support.');
      else if (code === 'auth/network-request-failed')
        setError('Network error. Check your connection and try again.');
      else
        setError('Sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Password reset ─────────────────────────────────────────────────────────

  const handleResetPassword = async () => {
    setResetError('');
    setResetMsg('');
    const trimmed = resetEmail.replace(/\s/g, '').toLowerCase();
    if (!trimmed) return setResetError('Enter your email address');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed))
      return setResetError('Enter a valid email address');

    setResetLoading(true);
    try {
      await AuthService.resetPassword(trimmed);
      setResetMsg('Reset link sent! Check your inbox (and spam folder).');
    } catch (err: any) {
      const code: string = err?.code ?? '';
      if (code === 'auth/user-not-found')
        setResetError('No account found with that email address.');
      else
        setResetError('Failed to send reset email. Try again.');
    } finally {
      setResetLoading(false);
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={ss.screen}>
      {/* Top decoration */}
      <div style={ss.topDecor}>
        <div style={ss.logoCircle}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path d="M8 28c2-8 6-14 14-14s12 6 14 14" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <circle cx="22" cy="13" r="4" fill="white" />
            <path d="M14 34l4-6h8l4 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div style={ss.logoText}>OyeRide</div>
        <div style={ss.logoSub}>Driver Portal</div>
      </div>

      {/* Card */}
      <div style={ss.card}>

        {showReset ? (
          /* ── Forgot-password panel ── */
          <>
            <button style={ss.backLink} onClick={() => { setShowReset(false); setResetMsg(''); setResetError(''); }}>
              <Icon name="arrow-back" size={16} color="#061ffa" />
              Back to sign in
            </button>
            <h2 style={ss.cardTitle}>Reset Password</h2>
            <p style={ss.cardSub}>Enter your email and we'll send you a reset link.</p>

            {resetMsg   && <div style={ss.successBox}>{resetMsg}</div>}
            {resetError && <div style={ss.errorBox}>{resetError}</div>}

            <div style={ss.field}>
              <label style={ss.label}>Email Address</label>
              <div style={ss.inputWrap}>
                <Icon name="mail" size={18} color="#aaa" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(sanitizeEmail(e.target.value))}
                  style={ss.input}
                  inputMode="email"
                  onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                />
              </div>
            </div>

            <button
              style={{ ...ss.submitBtn, opacity: resetLoading ? 0.7 : 1 }}
              onClick={handleResetPassword}
              disabled={resetLoading}
            >
              {resetLoading ? <div style={ss.spinner} /> : null}
              {resetLoading ? 'Sending…' : 'Send Reset Link'}
            </button>
          </>

        ) : (
          /* ── Login panel ── */
          <>
            <h2 style={ss.cardTitle}>Welcome back, Driver</h2>
            <p style={ss.cardSub}>Sign in to start receiving ride requests</p>

            {error && <div style={ss.errorBox}>{error}</div>}

            <div style={ss.field}>
              <label style={ss.label}>Email Address</label>
              <div style={ss.inputWrap}>
                <Icon name="mail" size={18} color="#aaa" />
                <input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(sanitizeEmail(e.target.value))}
                  style={ss.input}
                  autoComplete="email"
                  inputMode="email"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>
            </div>

            <div style={ss.field}>
              <label style={ss.label}>Password</label>
              <div style={ss.inputWrap}>
                <Icon name="lock" size={18} color="#aaa" />
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="Your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={ss.input}
                  autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                />
                <button style={ss.eyeBtn} onClick={() => setShowPw(!showPw)} type="button">
                  <Icon name={showPw ? 'eye-off' : 'eye'} size={18} color="#aaa" />
                </button>
              </div>
            </div>

            <button style={ss.forgotBtn} onClick={() => { setShowReset(true); setResetEmail(email); }} type="button">
              Forgot Password?
            </button>

            <button
              style={{ ...ss.submitBtn, opacity: loading ? 0.7 : 1 }}
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? <div style={ss.spinner} /> : null}
              {loading ? 'Signing in…' : 'Sign In'}
            </button>

            <div style={ss.divider}>
              <div style={ss.dividerLine} />
              <span style={ss.dividerText}>New to OyeRide?</span>
              <div style={ss.dividerLine} />
            </div>

            <Link to="/signup" style={ss.registerBtn}>
              <Icon name="user" size={18} color="#061ffa" />
              Register as a Driver
            </Link>
          </>
        )}

        <div style={ss.passengerRow}>
          Looking for the passenger app?{' '}
          <a href="https://oyeride.app" style={ss.link}>oyeride.app</a>
        </div>
      </div>
    </div>
  );
}

const ss: Record<string, React.CSSProperties> = {
  screen: {
    flex: 1, height: '100%', display: 'flex', flexDirection: 'column',
    background: 'linear-gradient(160deg, #061ffa 0%, #0215be 40%, #f5f6fa 40%)',
    overflowY: 'auto',
  },
  topDecor: {
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    padding: '56px 20px 48px', gap: 12,
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 40,
    background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
    border: '1.5px solid rgba(255,255,255,0.3)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: {
    fontSize: 28, fontWeight: 600, color: 'white', letterSpacing: -0.5,
    fontFamily: "'Poppins', sans-serif",
  },
  logoSub: {
    fontSize: 13, color: 'rgba(255,255,255,0.7)',
    fontFamily: "'Poppins', sans-serif", fontWeight: 500,
    letterSpacing: 1, textTransform: 'uppercase',
  },
  card: {
    background: 'white', borderRadius: '24px 24px 0 0',
    padding: '28px 24px 36px', flex: 1,
    boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
  },
  backLink: {
    display: 'flex', alignItems: 'center', gap: 6,
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#061ffa', fontSize: 13, fontWeight: 600,
    fontFamily: "'Poppins', sans-serif", marginBottom: 16, padding: 0,
  },
  cardTitle: {
    fontSize: 22, fontWeight: 600, color: '#333',
    fontFamily: "'Poppins', sans-serif", marginBottom: 6,
  },
  cardSub: {
    fontSize: 14, color: '#888',
    fontFamily: "'Poppins', sans-serif", marginBottom: 24,
  },
  errorBox: {
    background: '#fff0f0', border: '1px solid #ffcccc', color: '#d32f2f',
    padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 16,
    fontFamily: "'Poppins', sans-serif",
  },
  successBox: {
    background: '#f0fff4', border: '1px solid #a3e6b8', color: '#1b7a3e',
    padding: '12px 16px', borderRadius: 12, fontSize: 13, marginBottom: 16,
    fontFamily: "'Poppins', sans-serif",
  },
  field: { marginBottom: 16 },
  label: {
    display: 'block', fontSize: 13, fontWeight: 600, color: '#555',
    marginBottom: 8, fontFamily: "'Poppins', sans-serif",
  },
  inputWrap: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: '#f5f5f5', borderRadius: 14, padding: '0 14px', height: 52,
  },
  input: {
    flex: 1, border: 'none', background: 'transparent',
    fontSize: 15, color: '#333', outline: 'none',
    fontFamily: "'Poppins', sans-serif",
  },
  eyeBtn: {
    background: 'transparent', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end', display: 'block', marginLeft: 'auto',
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#061ffa', fontSize: 13, fontWeight: 600,
    fontFamily: "'Poppins', sans-serif", marginBottom: 20, padding: 0,
  },
  submitBtn: {
    width: '100%', height: 56, borderRadius: 16,
    background: '#061ffa', border: 'none',
    color: 'white', fontSize: 16, fontWeight: 700,
    cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
    marginTop: 8, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8, transition: 'opacity 0.2s',
  },
  spinner: {
    width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)',
    borderTop: '2.5px solid white', borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  divider: {
    display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 16px',
  },
  dividerLine: { flex: 1, height: 1, background: '#eee' },
  dividerText: {
    fontSize: 12, color: '#aaa',
    fontFamily: "'Poppins', sans-serif", whiteSpace: 'nowrap',
  },
  registerBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', height: 52, borderRadius: 14,
    border: '1.5px solid #061ffa', background: '#f0f3ff',
    color: '#061ffa', fontSize: 15, fontWeight: 700,
    fontFamily: "'Poppins', sans-serif", textDecoration: 'none',
    cursor: 'pointer', marginBottom: 20,
  },
  passengerRow: {
    textAlign: 'center', fontSize: 13, color: '#aaa',
    fontFamily: "'Poppins', sans-serif", marginTop: 8,
  },
  link: { color: '#061ffa', fontWeight: 600 },
};

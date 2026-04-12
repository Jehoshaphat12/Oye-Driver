import React, { useEffect, useState } from 'react';

/**
 * InstallPrompt — Driver Portal
 *
 * Nudges drivers to install the PWA so they can:
 *  - Receive ride-request push notifications when the browser is closed
 *  - Get a native app icon on their home screen
 *  - Use the app in standalone (full-screen) mode
 *
 * Covers both Android/Chrome (beforeinstallprompt) and iOS Safari.
 * Dismissal is remembered in localStorage for 30 days.
 */

const STORAGE_KEY = 'oyeride_driver_pwa_dismissed';
const DISMISS_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days

const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as any).standalone === true;

const wasDismissed = (): boolean => {
  try {
    const ts = parseInt(localStorage.getItem(STORAGE_KEY) ?? '0', 10);
    return Date.now() - ts < DISMISS_TTL;
  } catch { return false; }
};

const saveDismissal = () => {
  try { localStorage.setItem(STORAGE_KEY, String(Date.now())); } catch {}
};

export default function InstallPrompt() {
  const [prompt,  setPrompt ] = useState<any>(null);
  const [visible, setVisible] = useState(false);
  const [ios,     setIos    ] = useState(false);

  useEffect(() => {
    if (isInstalled() || wasDismissed()) return;

    if (isIOS()) {
      const t = setTimeout(() => { setIos(true); setVisible(true); }, 4000);
      return () => clearTimeout(t);
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e);
      setTimeout(() => setVisible(true), 4000);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const install = async () => {
    if (ios) { dismiss(); return; }
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setPrompt(null);
  };

  const dismiss = () => { setVisible(false); saveDismissal(); };

  if (!visible) return null;

  return (
    <>
      <div onClick={dismiss} style={s.backdrop} />

      <div style={s.sheet}>
        <div style={s.handle} />

        {/* Header row */}
        <div style={s.row}>
          <img src="/icons/icon-96x96.png" alt="OyeRide Driver" style={s.icon} />
          <div>
            <p style={s.title}>Install OyeRide Driver</p>
            <p style={s.sub}>
              {ios
                ? 'Tap Share → "Add to Home Screen" to install. You\'ll receive ride requests even when the browser is closed.'
                : 'Install the app for instant ride alerts, offline access, and a faster experience.'}
            </p>
          </div>
        </div>

        {/* Key benefits */}
        <div style={s.benefits}>
          {[
            { icon: '🔔', text: 'Ride request push notifications' },
            { icon: '⚡', text: 'Faster load — works offline'     },
            { icon: '📱', text: 'Full-screen native feel'         },
          ].map(({ icon, text }) => (
            <div key={text} style={s.benefit}>
              <span style={s.benefitIcon}>{icon}</span>
              <span style={s.benefitText}>{text}</span>
            </div>
          ))}
        </div>

        {!ios && (
          <button style={s.installBtn} onClick={install}>
            Install App
          </button>
        )}
        <button style={s.dismissBtn} onClick={dismiss}>
          {ios ? 'Got it' : 'Maybe later'}
        </button>
      </div>
    </>
  );
}

const s: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed', inset: 0, zIndex: 8000,
    background: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    position: 'fixed', bottom: 0, left: '50%',
    transform: 'translateX(-50%)',
    width: '100%', maxWidth: 764,
    zIndex: 8001,
    background: '#fff',
    borderRadius: '20px 20px 0 0',
    padding: '12px 20px 36px',
    boxShadow: '0 -6px 40px rgba(0,0,0,0.2)',
    animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)',
  },
  handle: {
    width: 40, height: 4, borderRadius: 2,
    background: '#ddd', margin: '0 auto 20px',
  },
  row: {
    display: 'flex', alignItems: 'flex-start',
    gap: 14, marginBottom: 18,
  },
  icon: {
    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
  },
  title: {
    fontSize: 15, fontWeight: 700, color: '#111',
    fontFamily: "'Poppins', sans-serif", marginBottom: 4,
  },
  sub: {
    fontSize: 12, color: '#666', lineHeight: '1.55',
    fontFamily: "'Poppins', sans-serif",
  },
  benefits: {
    display: 'flex', flexDirection: 'column', gap: 10,
    background: '#f5f6ff', borderRadius: 12,
    padding: '12px 14px', marginBottom: 20,
  },
  benefit: { display: 'flex', alignItems: 'center', gap: 10 },
  benefitIcon: { fontSize: 18, flexShrink: 0 },
  benefitText: {
    fontSize: 13, color: '#333', fontFamily: "'Poppins', sans-serif",
  },
  installBtn: {
    width: '100%', height: 52, borderRadius: 14,
    background: '#061ffa', border: 'none',
    color: '#fff', fontSize: 15, fontWeight: 700,
    fontFamily: "'Poppins', sans-serif",
    cursor: 'pointer', marginBottom: 10,
  },
  dismissBtn: {
    width: '100%', height: 44, borderRadius: 14,
    background: 'transparent', border: 'none',
    color: '#888', fontSize: 13, fontWeight: 500,
    fontFamily: "'Poppins', sans-serif", cursor: 'pointer',
  },
};

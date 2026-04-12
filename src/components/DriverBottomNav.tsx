import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon, IconName } from './Icons';

interface Props { active: 'home' | 'earnings' | 'history' | 'profile'; }

const NAV_ITEMS: { key: string; label: string; icon: IconName; path: string }[] = [
  { key: 'home',     label: 'Home',     icon: 'home',    path: '/' },
  { key: 'earnings', label: 'Earnings', icon: 'cash',    path: '/earnings' },
  { key: 'history',  label: 'Rides',    icon: 'history', path: '/history' },
  { key: 'profile',  label: 'Profile',  icon: 'profile', path: '/profile' },
];

export default function DriverBottomNav({ active }: Props) {
  const navigate = useNavigate();
  return (
    <div style={styles.nav}>
      {NAV_ITEMS.map((item) => {
        const isActive = active === item.key;
        return (
          <button key={item.key} style={styles.navItem} onClick={() => navigate(item.path)}>
            <Icon name={item.icon} size={22} color={isActive ? '#061ffa' : '#bbb'}
              style={{ transition: 'color 0.2s', transform: isActive ? 'scale(1.1)' : 'scale(1)' }} />
            <span style={{ ...styles.navLabel, ...(isActive ? styles.navLabelActive : {}) }}>{item.label}</span>
            {isActive && <div style={styles.activeDot} />}
          </button>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  nav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 70,
    background: 'white', display: 'flex', borderTop: '1px solid #eee',
    boxShadow: '0 -2px 20px rgba(0,0,0,0.08)', zIndex: 250,
    paddingBottom: 'env(safe-area-inset-bottom, 0)',
  },
  navItem: {
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: 3, background: 'transparent', border: 'none',
    cursor: 'pointer', position: 'relative', paddingTop: 8,
  },
  navLabel: { fontSize: 10, fontWeight: 500, color: '#bbb', fontFamily: "'Poppins', sans-serif" },
  navLabelActive: { color: '#061ffa', fontWeight: 700 },
  activeDot: { position: 'absolute', bottom: 6, width: 4, height: 4, borderRadius: '50%', background: '#061ffa' },
};

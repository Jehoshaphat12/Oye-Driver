import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Icon, IconName } from './Icons';

interface Props { open: boolean; onClose: () => void; driver?: any; }

const MENU_ITEMS: { icon: IconName; label: string; path: string }[] = [
  { icon: 'home',     label: 'Home',        path: '/' },
  { icon: 'cash',     label: 'Earnings',    path: '/earnings' },
  { icon: 'history',  label: 'Trip History', path: '/history' },
  { icon: 'profile',  label: 'Profile',     path: '/profile' },
  { icon: 'help',     label: 'Help Center', path: '/help' },
  { icon: 'phone',    label: 'Contact Us',  path: '/contact' },
  { icon: 'shield',   label: 'Safety',      path: '/safety' },
  { icon: 'settings', label: 'Settings',    path: '/settings' },
];

export default function DriverSidebar({ open, onClose, driver }: Props) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleNav = (path: string) => { navigate(path); onClose(); };
  const handleLogout = async () => { await logout(); navigate('/login'); onClose(); };
  const displayName = driver?.name || user?.name || 'Driver';
  const displayPhoto = driver?.photoUrl || user?.photoUrl;
  const rating = driver?.rating ?? user?.rating;
  const totalTrips = driver?.totalTrips ?? 0;

  return (
    <>
      {open && <div style={styles.overlay} onClick={onClose} />}
      <div style={{ ...styles.drawer, transform: open ? 'translateX(0)' : 'translateX(-100%)' }}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.avatar}>
            {displayPhoto
              ? <img src={displayPhoto} alt="avatar" style={styles.avatarImg} />
              : <div style={styles.avatarPlaceholder}>{displayName[0].toUpperCase()}</div>}
          </div>
          <div style={styles.userInfo}>
            <div style={styles.userName}>{displayName}</div>
            <div style={styles.userEmail}>{driver?.email || user?.email || ''}</div>
            <div style={styles.badgeRow}>
              <div style={styles.ratingBadge}>
                <Icon name="star-fill" size={11} color="#ffc107" style={{ marginRight: 3 }} />
                {typeof rating === 'number' ? rating.toFixed(1) : '—'}
              </div>
              <div style={styles.tripsBadge}>
                <Icon name="history" size={11} color="rgba(255,255,255,0.8)" style={{ marginRight: 3 }} />
                {totalTrips} trips
              </div>
            </div>
          </div>
          <button style={styles.closeBtn} onClick={onClose}>
            <Icon name="close" size={16} color="white" />
          </button>
        </div>

        {/* Menu */}
        <div style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <button key={item.path} style={styles.menuItem} onClick={() => handleNav(item.path)}>
              <Icon name={item.icon} size={20} color="#555" />
              <span style={styles.menuLabel}>{item.label}</span>
              <Icon name="arrow-right" size={16} color="#ccc" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <button style={styles.logoutBtn} onClick={handleLogout}>
          <Icon name="logout" size={20} color="#f44336" />
          <span style={styles.logoutLabel}>Sign Out</span>
        </button>
        <div style={styles.footer}>
          <span style={styles.footerText}>OyeRide Driver v1.0</span>
        </div>
      </div>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 800 },
  drawer: {
    position: 'absolute', top: 0, left: 0, bottom: 0, width: '80%', maxWidth: 300,
    background: 'white', zIndex: 900, display: 'flex', flexDirection: 'column',
    transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '52px 20px 24px',
    background: 'linear-gradient(135deg, #061ffa, #0215be)', position: 'relative',
  },
  avatar: { flexShrink: 0 },
  avatarImg: { width: 54, height: 54, borderRadius: '50%', objectFit: 'cover', border: '2.5px solid rgba(255,255,255,0.3)' },
  avatarPlaceholder: {
    width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
    color: 'white', fontSize: 22, fontWeight: 700,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2.5px solid rgba(255,255,255,0.3)',
  },
  userInfo: { flex: 1, overflow: 'hidden' },
  userName: { fontSize: 16, fontWeight: 700, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis' },
  badgeRow: { display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  ratingBadge: {
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.2)', borderRadius: 20,
    padding: '2px 10px', fontSize: 11, color: 'white', fontWeight: 600,
  },
  tripsBadge: {
    display: 'inline-flex', alignItems: 'center',
    background: 'rgba(255,255,255,0.15)', borderRadius: 20,
    padding: '2px 10px', fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 500,
  },
  closeBtn: {
    position: 'absolute', top: 52, right: 16, width: 32, height: 32, borderRadius: '50%',
    background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  menu: { flex: 1, overflowY: 'auto', padding: '8px 0' },
  menuItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 14,
    padding: '15px 20px', background: 'transparent', border: 'none',
    cursor: 'pointer', textAlign: 'left', borderBottom: '1px solid #f5f5f5',
  },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: 500, color: '#333', fontFamily: "'Poppins', sans-serif" },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: '15px 20px', background: 'transparent', border: 'none',
    borderTop: '1px solid #eee', cursor: 'pointer', width: '100%',
  },
  logoutLabel: { fontSize: 15, fontWeight: 600, color: '#f44336', fontFamily: "'Poppins', sans-serif" },
  footer: { padding: '12px 20px', borderTop: '1px solid #f0f0f0' },
  footerText: { fontSize: 11, color: '#bbb' },
};

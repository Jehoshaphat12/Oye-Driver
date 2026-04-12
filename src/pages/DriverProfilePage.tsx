import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { Driver } from '../types';
import { Icon } from '../components/Icons';
import DriverBottomNav from '../components/DriverBottomNav';

export default function DriverProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [driver, setDriver] = useState<Driver | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    FirestoreService.getDriver(user.id).then(d => { setDriver(d); setLoading(false); });
  }, [user?.id]);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  const d = driver;
  const name = d?.name || user?.name || 'Driver';
  const vehicleType = d?.vehicle?.vehicleType || 'motor';

  return (
    <div style={ss.screen}>
      {/* Header */}
      <div style={ss.header}>
        <div style={ss.avatarWrap}>
          {d?.photoUrl
            ? <img src={d.photoUrl} alt="avatar" style={ss.avatarImg} />
            : <div style={ss.avatarPlaceholder}>{name[0].toUpperCase()}</div>}
          <div style={ss.onlineDot} />
        </div>
        <div style={ss.headerName}>{name}</div>
        <div style={ss.headerSub}>{d?.email || user?.email || ''}</div>
        <div style={ss.badgesRow}>
          <div style={ss.badge}><Icon name="star-fill" size={12} color="#ffc107" /><span>{typeof d?.rating === 'number' ? d.rating.toFixed(1) : '—'}</span></div>
          <div style={ss.badge}><Icon name="history" size={12} color="rgba(255,255,255,0.8)" /><span>{d?.totalTrips ?? 0} trips</span></div>
          <div style={ss.badge}>
            <Icon name={vehicleType === 'delivery' ? 'package' : 'motorcycle'} size={12} color="rgba(255,255,255,0.8)" />
            <span style={{ textTransform: 'capitalize' }}>{vehicleType}</span>
          </div>
        </div>
      </div>

      <div style={ss.body}>
        {loading ? (
          <div style={ss.loading}><div style={ss.spinner} /></div>
        ) : (
          <>
            {/* Vehicle info */}
            <div style={ss.section}>
              <div style={ss.sectionTitle}>Vehicle Info</div>
              <div style={ss.card}>
                <Row icon="motorcycle" label="Vehicle Type" value={d?.vehicle?.vehicleType || '—'} cap />
                <Row icon="map-pin" label="Plate Number" value={d?.vehicle?.vehicleNumber || '—'} />
                <Row icon="profile" label="Model" value={d?.vehicle?.vehicleModel || '—'} last />
              </div>
            </div>

            {/* Contact */}
            <div style={ss.section}>
              <div style={ss.sectionTitle}>Contact</div>
              <div style={ss.card}>
                <Row icon="phone" label="Phone" value={d?.phone || user?.phone || '—'} />
                <Row icon="mail" label="Email" value={d?.email || user?.email || '—'} last />
              </div>
            </div>

            {/* Account */}
            <div style={ss.section}>
              <div style={ss.sectionTitle}>Account</div>
              <div style={ss.card}>
                <MenuRow icon="settings" label="Settings" onPress={() => navigate('/settings')} />
                <MenuRow icon="help" label="Help Center" onPress={() => navigate('/help')} />
                <MenuRow icon="shield" label="Safety" onPress={() => navigate('/safety')} />
                <MenuRow icon="phone" label="Contact Us" onPress={() => navigate('/contact')} last />
              </div>
            </div>

            <button style={ss.logoutBtn} onClick={handleLogout}>
              <Icon name="logout" size={18} color="#f44336" />
              Sign Out
            </button>
          </>
        )}
        <div style={{ height: 90 }} />
      </div>
      <DriverBottomNav active="profile" />
    </div>
  );
}

function Row({ icon, label, value, cap = false, last = false }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: last ? 'none' : '1px solid #f0f0f0' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#e8edff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color="#061ffa" />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: '#aaa', fontFamily: "'Poppins', sans-serif" }}>{label}</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#333', fontFamily: "'Poppins', sans-serif", textTransform: cap ? 'capitalize' : 'none' }}>{value}</div>
      </div>
    </div>
  );
}

function MenuRow({ icon, label, onPress, last = false }: any) {
  return (
    <button onClick={onPress} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderBottom: last ? 'none' : '1px solid #f0f0f0', background: 'transparent', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={18} color="#555" />
      </div>
      <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#333', fontFamily: "'Poppins', sans-serif" }}>{label}</span>
      <Icon name="arrow-right" size={16} color="#ccc" />
    </button>
  );
}

const ss: Record<string, React.CSSProperties> = {
  screen: { flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f6fa', position: 'relative', overflow: 'hidden' },
  header: {
    background: 'linear-gradient(135deg, #061ffa, #0215be)', padding: '52px 20px 28px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0,
  },
  avatarWrap: { position: 'relative' },
  avatarImg: { width: 80, height: 80, borderRadius: 40, objectFit: 'cover', border: '3px solid rgba(255,255,255,0.4)' },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 500, color: 'white', border: '3px solid rgba(255,255,255,0.3)' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 18, height: 18, borderRadius: 9, background: '#4caf50', border: '3px solid white' },
  headerName: { fontSize: 20, fontWeight: 500, color: 'white', fontFamily: "'Poppins', sans-serif" },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.7)', fontFamily: "'Poppins', sans-serif" },
  badgesRow: { display: 'flex', gap: 8, marginTop: 4 },
  badge: { display: 'flex', alignItems: 'center', gap: 5, background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 500, color: 'white', fontFamily: "'Poppins', sans-serif" },
  body: { flex: 1, overflowY: 'auto', padding: '16px' },
  loading: { display: 'flex', justifyContent: 'center', padding: 40 },
  spinner: { width: 28, height: 28, border: '3px solid #e0e0e0', borderTop: '3px solid #061ffa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 500, color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, fontFamily: "'Poppins', sans-serif" },
  card: { background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  logoutBtn: {
    width: '100%', padding: '16px', borderRadius: 16, background: '#fff0f0', border: '1px solid #ffcccc',
    color: '#f44336', fontSize: 15, fontWeight: 500, cursor: 'pointer', fontFamily: "'Poppins', sans-serif",
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16,
  },
};

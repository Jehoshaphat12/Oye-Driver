import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { TripRecord } from '../types';
import { Icon } from '../components/Icons';
import DriverBottomNav from '../components/DriverBottomNav';

const STATUS_COLOR: Record<string, string> = {
  completed: '#4caf50', cancelled: '#f44336', accepted: '#ff9800',
  in_progress: '#061ffa', requesting: '#888',
};
const STATUS_LABEL: Record<string, string> = {
  completed: 'Completed', cancelled: 'Cancelled',
  accepted: 'Assigned', in_progress: 'Active', requesting: 'Pending',
};
const fmt = (n: number) => `GH₵${n.toFixed(2)}`;

export default function DriverHistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (!user?.id) return;
    FirestoreService.getDriverTrips(user.id).then(t => { setTrips(t); setLoading(false); });
  }, [user?.id]);

  const filtered = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  const fmtTime = (ts: any) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString() + ' · ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={ss.screen}>
      <div style={ss.header}>
        <button style={ss.backBtn} onClick={() => navigate('/')}>
          <Icon name="arrow-right" size={20} color="white" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span style={ss.headerTitle}>Trip History</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={ss.body}>
        {/* Filter tabs */}
        <div style={ss.filters}>
          {(['all', 'completed', 'cancelled'] as const).map(f => (
            <button key={f} style={{ ...ss.filterBtn, ...(filter === f ? ss.filterBtnActive : {}) }} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : f === 'completed' ? 'Completed' : 'Cancelled'}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={ss.loading}><div style={ss.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div style={ss.empty}>
            <Icon name="history" size={48} color="#ddd" />
            <div style={ss.emptyTitle}>No trips found</div>
            <div style={ss.emptySub}>Your completed trips will appear here</div>
          </div>
        ) : (
          <div style={ss.list}>
            {filtered.map(trip => {
              const color = STATUS_COLOR[trip.status] || '#888';
              const dest = trip.destinations?.[0];
              return (
                <div key={trip.id} style={ss.card}>
                  <div style={ss.cardLeft}>
                    <div style={{ ...ss.typeIcon, background: color + '18' }}>
                      <Icon name={trip.vehicleType === 'delivery' ? 'package' : 'motorcycle'} size={20} color={color} />
                    </div>
                  </div>
                  <div style={ss.cardInfo}>
                    <div style={ss.cardRoute}>
                      {trip.pickup?.address?.split(',')[0] || '—'} → {dest?.address?.split(',')[0] || '—'}
                    </div>
                    <div style={ss.cardPassenger}>{trip.passengerName || 'Passenger'}</div>
                    <div style={ss.cardTime}>{fmtTime(trip.completedAt || trip.requestedAt)}</div>
                  </div>
                  <div style={ss.cardRight}>
                    <span style={ss.cardFare}>{fmt(Number(trip.totalFare) || 0)}</span>
                    <span style={{ ...ss.cardStatus, color, background: color + '18' }}>
                      {STATUS_LABEL[trip.status] || trip.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <div style={{ height: 90 }} />
      </div>
      <DriverBottomNav active="history" />
    </div>
  );
}

const ss: Record<string, React.CSSProperties> = {
  screen: { flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f6fa', position: 'relative', overflow: 'hidden' },
  header: { background: 'linear-gradient(135deg, #061ffa, #0215be)', padding: '52px 16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 },
  backBtn: { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 700, color: 'white', fontFamily: "'Poppins', sans-serif" },
  body: { flex: 1, overflowY: 'auto', padding: '16px' },
  filters: { display: 'flex', gap: 8, marginBottom: 16 },
  filterBtn: { flex: 1, padding: '10px 4px', borderRadius: 12, background: 'white', border: '2px solid #eee', fontSize: 13, fontWeight: 600, color: '#888', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  filterBtnActive: { background: '#061ffa', border: '2px solid #061ffa', color: 'white' },
  loading: { display: 'flex', justifyContent: 'center', padding: 40 },
  spinner: { width: 28, height: 28, border: '3px solid #e0e0e0', borderTop: '3px solid #061ffa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: 700, color: '#888', fontFamily: "'Poppins', sans-serif" },
  emptySub: { fontSize: 13, color: '#bbb', fontFamily: "'Poppins', sans-serif" },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'white', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  cardLeft: { flexShrink: 0 },
  typeIcon: { width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, overflow: 'hidden' },
  cardRoute: { fontSize: 13, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" },
  cardPassenger: { fontSize: 12, color: '#888', marginTop: 2, fontFamily: "'Poppins', sans-serif" },
  cardTime: { fontSize: 11, color: '#bbb', marginTop: 2, fontFamily: "'Poppins', sans-serif" },
  cardRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 },
  cardFare: { fontSize: 15, fontWeight: 600, color: '#061ffa', fontFamily: "'Poppins', sans-serif" },
  cardStatus: { padding: '3px 10px', borderRadius: 10, fontSize: 10, fontWeight: 700, fontFamily: "'Poppins', sans-serif" },
};

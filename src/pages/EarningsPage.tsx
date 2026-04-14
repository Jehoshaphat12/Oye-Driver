import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { TripRecord } from '../types';
import { Icon } from '../components/Icons';
import DriverBottomNav from '../components/DriverBottomNav';

const fmt = (n: number) => `GH₵${n.toFixed(2)}`;

export default function EarningsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    if (!user?.id) return;
    FirestoreService.getDriverTrips(user.id).then(t => { setTrips(t); setLoading(false); });
  }, [user?.id]);

  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const filterByPeriod = (ts: any) => {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date();
    if (tab === 'today') return d >= startToday;
    if (tab === 'week') return d >= startWeek;
    return d >= startMonth;
  };

  const completed = trips.filter(t => t.status === 'completed' && filterByPeriod(t.completedAt || t.createdAt || t.requestedAt));
  const totalEarned = completed.reduce((s, t) => s + (Number(t.totalFare) || 0), 0);
  const avgFare = completed.length > 0 ? totalEarned / completed.length : 0;

  const fmtTime = (ts: any) => {
    if (!ts) return '';
    const d = ts?.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div style={ss.screen}>
      {/* Header */}
      <div style={ss.header}>
        <button style={ss.backBtn} onClick={() => navigate('/')}>
          <Icon name="arrow-right" size={20} color="white" style={{ transform: 'rotate(180deg)' }} />
        </button>
        <span style={ss.headerTitle}>Earnings</span>
        <div style={{ width: 40 }} />
      </div>

      <div style={ss.body}>
        {/* Period tabs */}
        <div style={ss.tabs}>
          {(['today', 'week', 'month'] as const).map(t => (
            <button key={t} style={{ ...ss.tab, ...(tab === t ? ss.tabActive : {}) }} onClick={() => setTab(t)}>
              {t === 'today' ? 'Today' : t === 'week' ? 'This Week' : 'This Month'}
            </button>
          ))}
        </div>

        {/* Summary card */}
        <div style={ss.summaryCard}>
          <div style={ss.summaryTop}>
            <div style={ss.summaryMain}>
              <span style={ss.summaryCurrency}>GH₵</span>
              <span style={ss.summaryAmount}>{totalEarned.toFixed(2)}</span>
            </div>
            <span style={ss.summaryLabel}>Total Earned</span>
          </div>
          <div style={ss.summaryStats}>
            <div style={ss.summaryStat}>
              <span style={ss.summaryStatValue}>{completed.length}</span>
              <span style={ss.summaryStatLabel}>Trips</span>
            </div>
            <div style={ss.summaryStatDivider} />
            <div style={ss.summaryStat}>
              <span style={ss.summaryStatValue}>{fmt(avgFare)}</span>
              <span style={ss.summaryStatLabel}>Avg per Trip</span>
            </div>
          </div>
        </div>

        {/* Trip list */}
        <div style={ss.sectionHeader}>
          <span style={ss.sectionTitle}>Breakdown</span>
          <span style={ss.sectionCount}>{completed.length} trips</span>
        </div>

        {loading ? (
          <div style={ss.loading}><div style={ss.spinner} /></div>
        ) : completed.length === 0 ? (
          <div style={ss.empty}>
            <Icon name="cash" size={48} color="#ddd" />
            <div style={ss.emptyTitle}>No earnings yet</div>
            <div style={ss.emptySub}>Complete trips to see your earnings</div>
          </div>
        ) : (
          <div style={ss.tripList}>
            {completed.map(trip => (
              <div key={trip.id} style={ss.tripCard}>
                <div style={ss.tripIconBox}>
                  <Icon name={trip.vehicleType === 'delivery' ? 'package' : 'motorcycle'} size={20} color="#061ffa" />
                </div>
                <div style={ss.tripInfo}>
                  <div style={ss.tripRoute}>
                    {trip.pickup?.address?.split(',')[0] || 'Pickup'} → {trip.destinations?.[0]?.address?.split(',')[0] || 'Destination'}
                  </div>
                  <div style={ss.tripPassenger}>{trip.passengerName || 'Passenger'}</div>
                  <div style={ss.tripTime}>{fmtTime(trip.completedAt || trip.createdAt || trip.requestedAt)}</div>
                </div>
                <span style={ss.tripFare}>{fmt(Number(trip.totalFare) || 0)}</span>
              </div>
            ))}
          </div>
        )}
        <div style={{ height: 90 }} />
      </div>

      <DriverBottomNav active="earnings" />
    </div>
  );
}

const ss: Record<string, React.CSSProperties> = {
  screen: { flex: 1, height: '100%', display: 'flex', flexDirection: 'column', background: '#f5f6fa', position: 'relative', overflow: 'hidden' },
  header: {
    background: 'linear-gradient(135deg, #061ffa, #0215be)', padding: '52px 16px 20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
  },
  backBtn: { width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 500, color: 'white', fontFamily: "'Poppins', sans-serif" },
  body: { flex: 1, overflowY: 'auto', padding: '16px' },

  tabs: { display: 'flex', gap: 8, marginBottom: 16 },
  tab: { flex: 1, padding: '10px 4px', borderRadius: 12, background: 'white', border: '2px solid #eee', fontSize: 13, fontWeight: 600, color: '#888', cursor: 'pointer', fontFamily: "'Poppins', sans-serif" },
  tabActive: { background: '#061ffa', border: '2px solid #061ffa', color: 'white' },

  summaryCard: {
    background: 'linear-gradient(135deg, #061ffa, #394cfc)', borderRadius: 20, padding: '24px 20px', marginBottom: 20,
  },
  summaryTop: { display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 },
  summaryMain: { display: 'flex', alignItems: 'flex-start', gap: 4 },
  summaryCurrency: { fontSize: 18, fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  summaryAmount: { fontSize: 52, fontWeight: 600, color: 'white', lineHeight: 1, fontFamily: "'Poppins', sans-serif" },
  summaryLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontFamily: "'Poppins', sans-serif" },
  summaryStats: { display: 'flex', alignItems: 'center' },
  summaryStat: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  summaryStatValue: { fontSize: 18, fontWeight: 500, color: 'white', fontFamily: "'Poppins', sans-serif" },
  summaryStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontFamily: "'Poppins', sans-serif" },
  summaryStatDivider: { width: 1, height: 32, background: 'rgba(255,255,255,0.2)' },

  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: 500, color: '#333', fontFamily: "'Poppins', sans-serif" },
  sectionCount: { fontSize: 13, color: '#888', fontFamily: "'Poppins', sans-serif" },
  tripList: { display: 'flex', flexDirection: 'column', gap: 10 },
  tripCard: { display: 'flex', alignItems: 'center', gap: 12, padding: '14px', background: 'white', borderRadius: 16, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' },
  tripIconBox: { width: 44, height: 44, borderRadius: 14, background: '#e8edff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  tripInfo: { flex: 1, overflow: 'hidden' },
  tripRoute: { fontSize: 13, fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" },
  tripPassenger: { fontSize: 12, color: '#888', marginTop: 2, fontFamily: "'Poppins', sans-serif" },
  tripTime: { fontSize: 11, color: '#bbb', marginTop: 1, fontFamily: "'Poppins', sans-serif" },
  tripFare: { fontSize: 16, fontWeight: 500, color: '#061ffa', fontFamily: "'Poppins', sans-serif", flexShrink: 0 },
  loading: { display: 'flex', justifyContent: 'center', padding: 40 },
  spinner: { width: 28, height: 28, border: '3px solid #e0e0e0', borderTop: '3px solid #061ffa', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
  empty: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px', gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: 500, color: '#888', fontFamily: "'Poppins', sans-serif" },
  emptySub: { fontSize: 13, color: '#bbb', fontFamily: "'Poppins', sans-serif" },
};

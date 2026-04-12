import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icons';
import { Earnings, TripRecord } from '../types';

interface Props {
  isOnline: boolean;
  loading: boolean;
  earnings: Earnings;
  recentTrips: TripRecord[];
  driverRating: number | null;
  onToggleOnline: () => void;
  onSeeAllTrips: () => void;
  onSeeAllEarnings: () => void;
}

const fmt = (n: number) => `GH₵${n.toFixed(2)}`;
const statusColor: Record<string, string> = {
  completed: '#4caf50', cancelled: '#f44336', accepted: '#ff9800',
  in_progress: '#061ffa', requesting: '#061ffa',
};
const statusLabel: Record<string, string> = {
  completed: 'Completed', cancelled: 'Cancelled',
  accepted: 'Assigned', in_progress: 'Active', requesting: 'Pending',
};
const fmtTime = (ts: any) => {
  if (!ts) return '';
  const d = ts?.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function DriverHomeSheet({
  isOnline, loading, earnings, recentTrips, driverRating, onToggleOnline, onSeeAllTrips, onSeeAllEarnings,
}: Props) {
  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: -40, bottom: 400 }}
      dragElastic={0.1}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      style={ss.sheet}
    >
      {/* Handle */}
      <div style={{ width: '100%', padding: '12px 0', cursor: 'grab' }}>
        <div style={ss.handle} />
      </div>

      <div style={ss.content}>
        {/* Online Toggle */}
        <div style={{ ...ss.toggleCard, background: isOnline ? '#e8f5e9' : '#f5f5f5' }}>
          <div style={ss.toggleLeft}>
            <div style={{ ...ss.statusDot, background: isOnline ? '#4caf50' : '#f44336' }} />
            <div>
              <div style={{ ...ss.statusText, color: isOnline ? '#2e7d32' : '#333' }}>
                {isOnline ? "You're Online" : "You're Offline"}
              </div>
              <div style={ss.statusSub}>
                {isOnline ? 'Accepting ride requests' : 'Toggle to start receiving rides'}
              </div>
            </div>
          </div>
          <button
            style={{ ...ss.toggleBtn, background: isOnline ? '#4caf50' : '#ccc' }}
            onClick={onToggleOnline}
            disabled={loading}
          >
            <div style={{ ...ss.toggleThumb, transform: isOnline ? 'translateX(22px)' : 'translateX(2px)' }} />
          </button>
        </div>

        {/* Quick Earnings */}
        {isOnline && (
          <div style={ss.quickEarnings}>
            <div style={ss.earningItem}>
              <div style={ss.earningIconBox}><Icon name="history" size={18} color="#061ffa" /></div>
              <div>
                <div style={ss.earningLabel}>Today</div>
                <div style={ss.earningValue}>{fmt(earnings.today)}</div>
              </div>
            </div>
            <div style={ss.earningDivider} />
            <div style={ss.earningItem}>
              <div style={ss.earningIconBox}><Icon name="motorcycle" size={18} color="#061ffa" /></div>
              <div>
                <div style={ss.earningLabel}>Trips Today</div>
                <div style={ss.earningValue}>{earnings.tripsToday}</div>
              </div>
            </div>
          </div>
        )}

        {/* Stats Grid (online only) */}
        {isOnline && (
          <div style={ss.statsGrid}>
            <div style={ss.statCard}>
              <div style={{ ...ss.statIcon, background: '#e8edff' }}>
                <Icon name="history" size={22} color="#061ffa" />
              </div>
              <div style={ss.statValue}>{earnings.weeklyTrips}</div>
              <div style={ss.statLabel}>Weekly Trips</div>
            </div>
            <div style={ss.statCard}>
              <div style={{ ...ss.statIcon, background: '#fff8e1' }}>
                <Icon name="star-fill" size={22} color="#ffc107" />
              </div>
              <div style={ss.statValue}>{driverRating !== null ? driverRating.toFixed(1) : '—'}</div>
              <div style={ss.statLabel}>Rating</div>
            </div>
            <div style={ss.statCard}>
              <div style={{ ...ss.statIcon, background: '#e8f5e9' }}>
                <Icon name="cash" size={22} color="#4caf50" />
              </div>
              <div style={ss.statValue}>{fmt(earnings.weekly)}</div>
              <div style={ss.statLabel}>This Week</div>
            </div>
          </div>
        )}

        {/* Recent Trips (online only) */}
        {isOnline && (
          <div style={ss.section}>
            <div style={ss.sectionHeader}>
              <span style={ss.sectionTitle}>Recent Trips</span>
              <button style={ss.seeAllBtn} onClick={onSeeAllTrips}>
                <span style={ss.seeAllText}>See all</span>
                <Icon name="arrow-right" size={14} color="#aaa" />
              </button>
            </div>
            {recentTrips.length > 0 ? (
              <div style={ss.tripList}>
                {recentTrips.slice(0, 5).map(trip => {
                  const color = statusColor[trip.status] || '#888';
                  const dest = trip.destinations?.[0];
                  return (
                    <div key={trip.id} style={ss.tripRow}>
                      <div style={ss.tripIconBox}><Icon name="history" size={18} color="#888" /></div>
                      <div style={ss.tripInfo}>
                        <div style={ss.tripRoute} title={dest?.address}>
                          {trip.pickup?.address?.split(',')[0] || '—'} → {dest?.address?.split(',')[0] || '—'}
                        </div>
                        <div style={ss.tripTime}>{fmtTime(trip.completedAt || trip.requestedAt)}</div>
                      </div>
                      <div style={ss.tripRight}>
                        <div style={ss.tripFare}>{fmt(trip.totalFare || 0)}</div>
                        <div style={{ ...ss.tripStatus, color, background: color + '22' }}>
                          {statusLabel[trip.status] || trip.status}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={ss.emptyBox}>
                <Icon name="history" size={36} color="#ddd" />
                <div style={ss.emptyText}>No trips yet</div>
                <div style={ss.emptySub}>Complete trips to see them here</div>
              </div>
            )}
          </div>
        )}

        {/* Offline state */}
        {!isOnline && (
          <div style={ss.offlineBox}>
            <div style={ss.offlineIconBox}>
              <Icon name="cloud-off" size={44} color="#ccc" />
            </div>
            <div style={ss.offlineTitle}>You're Offline</div>
            <div style={ss.offlineText}>
              Toggle online to start receiving ride requests and earning
            </div>
          </div>
        )}

        <div style={{ height: 80 }} />
      </div>
    </motion.div>
  );
}

const ss: Record<string, React.CSSProperties> = {
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'white', borderRadius: '24px 24px 0 0',
    boxShadow: '0 -4px 30px rgba(0,0,0,0.12)',
    zIndex: 200, height: '72%', display: 'flex', flexDirection: 'column',
    touchAction: 'none',
  },
  handle: { width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto' },
  content: { flex: 1, overflowY: 'auto', padding: '0 20px', touchAction: 'pan-y' },

  // Toggle
  toggleCard: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 16px', borderRadius: 16, marginBottom: 16, marginTop: 8,
    transition: 'background 0.3s',
  },
  toggleLeft: { display: 'flex', alignItems: 'center', gap: 12 },
  statusDot: { width: 12, height: 12, borderRadius: '50%', flexShrink: 0, transition: 'background 0.3s' },
  statusText: { fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', sans-serif" },
  statusSub: { fontSize: 12, color: '#888', marginTop: 2, fontFamily: "'Poppins', sans-serif" },
  toggleBtn: {
    width: 52, height: 30, borderRadius: 15, border: 'none', cursor: 'pointer',
    position: 'relative', transition: 'background 0.3s', flexShrink: 0,
    padding: 0,
  },
  toggleThumb: {
    position: 'absolute', top: 3, width: 24, height: 24, borderRadius: '50%',
    background: 'white', transition: 'transform 0.3s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
  },

  // Quick Earnings
  quickEarnings: {
    display: 'flex', padding: '14px 16px', background: '#f8f9ff', borderRadius: 16, marginBottom: 16, gap: 0,
  },
  earningItem: { flex: 1, display: 'flex', alignItems: 'center', gap: 12 },
  earningIconBox: {
    width: 40, height: 40, borderRadius: 12, background: '#e8edff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  earningDivider: { width: 1, background: '#e0e0e0', margin: '0 16px' },
  earningLabel: { fontSize: 12, color: '#888', fontFamily: "'Poppins', sans-serif" },
  earningValue: { fontSize: 18, fontWeight: 600, color: '#333', fontFamily: "'Poppins', sans-serif" },

  // Stats
  statsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 },
  statCard: {
    background: '#f8f8f8', borderRadius: 16, padding: '14px 10px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
  },
  statIcon: {
    width: 44, height: 44, borderRadius: 22,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: 18, fontWeight: 600, color: '#333', fontFamily: "'Poppins', sans-serif" },
  statLabel: { fontSize: 11, color: '#888', textAlign: 'center', fontFamily: "'Poppins', sans-serif" },

  // Trips section
  section: { marginBottom: 20 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: 700, color: '#333', fontFamily: "'Poppins', sans-serif" },
  seeAllBtn: { display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer' },
  seeAllText: { fontSize: 13, color: '#aaa', fontFamily: "'Poppins', sans-serif" },
  tripList: { display: 'flex', flexDirection: 'column', gap: 10 },
  tripRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    background: '#f8f8f8', borderRadius: 14,
  },
  tripIconBox: {
    width: 38, height: 38, borderRadius: 12, background: '#eee',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  tripInfo: { flex: 1, overflow: 'hidden' },
  tripRoute: {
    fontSize: 13, fontWeight: 600, color: '#333', overflow: 'hidden',
    textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif",
  },
  tripTime: { fontSize: 11, color: '#aaa', marginTop: 2, fontFamily: "'Poppins', sans-serif" },
  tripRight: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 },
  tripFare: { fontSize: 15, fontWeight: 600, color: '#061ffa', fontFamily: "'Poppins', sans-serif" },
  tripStatus: { padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 700, fontFamily: "'Poppins', sans-serif" },

  // Offline
  offlineBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 12 },
  offlineIconBox: {
    width: 80, height: 80, borderRadius: 40, background: '#f5f5f5',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  offlineTitle: { fontSize: 20, fontWeight: 700, color: '#333', fontFamily: "'Poppins', sans-serif" },
  offlineText: { fontSize: 14, color: '#888', textAlign: 'center', paddingLeft: 32, paddingRight: 32, fontFamily: "'Poppins', sans-serif", maxWidth: 280, lineHeight: '1.5' },

  emptyBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 20px', gap: 8, background: '#f8f8f8', borderRadius: 16 },
  emptyText: { fontSize: 15, fontWeight: 600, color: '#888', fontFamily: "'Poppins', sans-serif" },
  emptySub: { fontSize: 13, color: '#aaa', fontFamily: "'Poppins', sans-serif" },
};

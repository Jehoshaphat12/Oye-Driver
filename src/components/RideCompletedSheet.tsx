import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icons';

interface CompletedData {
  id: string;
  pickupAddress: string;
  destinationAddress: string;
  passengerName: string;
  totalFare: number;
  distance?: number;
  duration?: number;
  vehicleType?: string;
  rideDate?: string;
  rideTime?: string;
}

interface Props {
  data: CompletedData;
  onClose: () => void;
  onReportIssue?: () => void;
}

export default function RideCompletedSheet({ data, onClose, onReportIssue }: Props) {
  return (
    <>
      <div style={ss.backdrop} />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 280 }}
        style={ss.sheet}
      >
        <div style={ss.handle} />

        {/* Success header */}
        <div style={ss.successHeader}>
          <div style={ss.checkCircle}>
            <Icon name="check" size={32} color="white" strokeWidth={2.5} />
          </div>
          <div style={ss.successTitle}>Trip Completed!</div>
          <div style={ss.successSub}>Great job! Here's your trip summary</div>
        </div>

        {/* Fare card */}
        <div style={ss.fareCard}>
          <div style={ss.fareMain}>
            <span style={ss.fareCurrency}>GH₵</span>
            <span style={ss.fareAmount}>{(data.totalFare || 0).toFixed(2)}</span>
          </div>
          <div style={ss.fareLabel}>Total Earned</div>
        </div>

        {/* Trip details */}
        <div style={ss.detailsCard}>
          <div style={ss.detailRow}>
            <Icon name="profile" size={16} color="#888" />
            <span style={ss.detailLabel}>Passenger</span>
            <span style={ss.detailValue}>{data.passengerName}</span>
          </div>
          {data.distance && (
            <div style={ss.detailRow}>
              <Icon name="map-pin" size={16} color="#888" />
              <span style={ss.detailLabel}>Distance</span>
              <span style={ss.detailValue}>{data.distance.toFixed(1)} km</span>
            </div>
          )}
          {data.duration && (
            <div style={ss.detailRow}>
              <Icon name="history" size={16} color="#888" />
              <span style={ss.detailLabel}>Duration</span>
              <span style={ss.detailValue}>{data.duration} min</span>
            </div>
          )}
          {data.rideDate && (
            <div style={ss.detailRow}>
              <Icon name="history" size={16} color="#888" />
              <span style={ss.detailLabel}>Date</span>
              <span style={ss.detailValue}>{data.rideDate} {data.rideTime}</span>
            </div>
          )}
        </div>

        {/* Route mini */}
        <div style={ss.routeMini}>
          <div style={ss.routeMiniRow}>
            <div style={{ ...ss.miniDot, background: '#061ffa' }} />
            <span style={ss.miniAddr}>{data.pickupAddress}</span>
          </div>
          <div style={ss.miniLine} />
          <div style={ss.routeMiniRow}>
            <div style={{ ...ss.miniDot, background: '#f97316' }} />
            <span style={ss.miniAddr}>{data.destinationAddress}</span>
          </div>
        </div>

        {/* Actions */}
        <div style={ss.actions}>
          {onReportIssue && (
            <button style={ss.reportBtn} onClick={onReportIssue}>
              <Icon name="shield" size={16} color="#f44336" />
              Report Issue
            </button>
          )}
          <button style={ss.doneBtn} onClick={onClose}>
            Find Next Ride
          </button>
        </div>
      </motion.div>
    </>
  );
}

const ss: Record<string, React.CSSProperties> = {
  backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 490 },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, background: 'white',
    borderRadius: '24px 24px 0 0', padding: '0 20px 40px',
    boxShadow: '0 -8px 40px rgba(0,0,0,0.18)', zIndex: 500,
    maxHeight: '88%', overflowY: 'auto',
  },
  handle: { width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '12px auto 0' },

  successHeader: { display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 24, gap: 10, marginBottom: 24 },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36, background: 'linear-gradient(135deg, #4caf50, #2e7d32)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    boxShadow: '0 8px 24px rgba(76,175,80,0.4)',
  },
  successTitle: { fontSize: 22, fontWeight: 600, color: '#333', fontFamily: "'Poppins', sans-serif" },
  successSub: { fontSize: 13, color: '#888', fontFamily: "'Poppins', sans-serif" },

  fareCard: {
    background: 'linear-gradient(135deg, #061ffa, #0215be)', borderRadius: 20,
    padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16,
  },
  fareMain: { display: 'flex', alignItems: 'flex-start', gap: 4 },
  fareCurrency: { fontSize: 20, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginTop: 6 },
  fareAmount: { fontSize: 48, fontWeight: 600, color: 'white', fontFamily: "'Poppins', sans-serif", lineHeight: 1 },
  fareLabel: { fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4, fontFamily: "'Poppins', sans-serif" },

  detailsCard: { background: '#f8f8f8', borderRadius: 16, padding: '4px 0', marginBottom: 14 },
  detailRow: {
    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
    borderBottom: '1px solid #eee',
  },
  detailLabel: { flex: 1, fontSize: 13, color: '#888', fontFamily: "'Poppins', sans-serif" },
  detailValue: { fontSize: 13, fontWeight: 600, color: '#333', fontFamily: "'Poppins', sans-serif" },

  routeMini: { padding: '14px 16px', background: '#f8f9ff', borderRadius: 14, border: '1px solid #e8edff', marginBottom: 20 },
  routeMiniRow: { display: 'flex', alignItems: 'center', gap: 10 },
  miniDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  miniAddr: { fontSize: 12, color: '#555', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'Poppins', sans-serif" },
  miniLine: { width: 2, height: 16, background: '#dde3ff', marginLeft: 4, marginTop: 2, marginBottom: 2 },

  actions: { display: 'flex', flexDirection: 'column', gap: 10 },
  reportBtn: {
    padding: '14px', borderRadius: 12, background: '#fff0f0', border: '1px solid #ffcccc',
    color: '#f44336', fontSize: 14, fontWeight: 600, cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  doneBtn: {
    padding: '16px', borderRadius: 16, background: '#061ffa', border: 'none',
    color: 'white', fontSize: 15, fontWeight: 700, cursor: 'pointer',
    fontFamily: "'Poppins', sans-serif",
  },
};

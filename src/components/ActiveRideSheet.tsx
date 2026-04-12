import React from 'react';
import { motion } from 'framer-motion';
import { Icon } from './Icons';
import { DriverRideState, ActiveRide } from '../types';

interface Props {
  state: DriverRideState;
  ride: ActiveRide | null;
  eta?: string;
  distance?: string;
  onArrived: () => void;
  onStartTrip: () => void;
  onComplete: () => void;
  onCancel: () => void;
  onChat: () => void;
  onCall: () => void;
}

const STATE_INFO: Record<string, { title: string; sub: string; color: string }> = {
  accepted:    { title: 'Heading to Pickup',   sub: 'Navigate to the passenger pickup location', color: '#061ffa' },
  arrived:     { title: 'Arrived at Pickup',   sub: 'Waiting for the passenger to board',        color: '#f97316' },
  in_progress: { title: 'Trip in Progress',    sub: 'On the way to the destination',             color: '#4caf50' },
};

export default function ActiveRideSheet({ state, ride, eta, distance, onArrived, onStartTrip, onComplete, onCancel, onChat, onCall }: Props) {
  if (!ride) return null;
  const info = STATE_INFO[state] || STATE_INFO.accepted;
  const isDelivery = ride.vehicleType === 'delivery' || ride.vehicleType === 'bicycle_delivery';
  const dest = ride.stops?.[ride.stops.length - 1] ?? ride.destination;

  return (
    <motion.div
      drag="y"
      dragConstraints={{ top: 0, bottom: 300 }}
      dragElastic={0.08}
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      style={ss.sheet}
    >
      <div style={{ width: '100%', padding: '12px 0', cursor: 'grab' }}>
        <div style={ss.handle} />
      </div>

      <div style={ss.inner}>
        {/* Status banner */}
        <div style={{ ...ss.statusBanner, background: info.color + '12', borderColor: info.color + '30' }}>
          <div style={{ ...ss.statusDot, background: info.color }} />
          <div style={{ flex: 1 }}>
            <div style={{ ...ss.statusTitle, color: info.color }}>{info.title}</div>
            <div style={ss.statusSub}>{info.sub}</div>
          </div>
          {(eta || distance) && (
            <div style={{ ...ss.etaBadge, background: info.color + '18' }}>
              {eta && <span style={{ ...ss.etaValue, color: info.color }}>{eta}</span>}
              {distance && <span style={ss.etaLabel}>{distance}</span>}
            </div>
          )}
        </div>

        {/* Passenger card */}
        <div style={ss.passengerCard}>
          <div style={ss.passengerAvatar}>
            <span style={ss.passengerInitial}>{(ride.passengerName || 'P')[0].toUpperCase()}</span>
          </div>
          <div style={ss.passengerInfo}>
            <div style={ss.passengerName}>{ride.passengerName}</div>
            <div style={ss.ratingRow}>
              <Icon name="star-fill" size={12} color="#ffc107" />
              <span style={ss.ratingText}>{(ride.passengerRating || 4.8).toFixed(1)}</span>
              {isDelivery && <span style={ss.deliveryBadge}>📦 Delivery</span>}
            </div>
          </div>
          <div style={ss.fareBox}>
            <span style={ss.fareValue}>GH₵{ride.fare || ride.totalFare || 0}</span>
            <span style={ss.fareLabel}>Fare</span>
          </div>
        </div>

        {/* Route summary */}
        <div style={ss.routeCard}>
          <div style={ss.routeRow}>
            <div style={ss.routeIconCol}>
              <div style={{ ...ss.dot, background: '#061ffa' }} />
              <div style={ss.line} />
            </div>
            <div style={ss.routeInfo}>
              <div style={ss.routeLabel}>PICKUP</div>
              <div style={ss.routeAddr}>{ride.pickup?.address || 'Pickup'}</div>
            </div>
          </div>
          <div style={{ ...ss.routeRow, marginBottom: 0 }}>
            <div style={ss.routeIconCol}>
              <div style={{ ...ss.dot, background: '#f97316' }} />
            </div>
            <div style={ss.routeInfo}>
              <div style={ss.routeLabel}>DROP-OFF</div>
              <div style={ss.routeAddr}>{dest?.address || ride.destination?.address || 'Destination'}</div>
            </div>
          </div>
        </div>

        {/* Contact row */}
        <div style={ss.contactRow}>
          <button style={ss.contactBtn} onClick={onCall}>
            <div style={{ ...ss.contactIconBox, background: '#e8f5e9' }}>
              <Icon name="phone" size={18} color="#4caf50" strokeWidth={1.75} />
            </div>
            <span style={ss.contactLabel}>Call</span>
          </button>
          <button style={ss.contactBtn} onClick={onChat}>
            <div style={{ ...ss.contactIconBox, background: '#e8edff' }}>
              <Icon name="chat" size={18} color="#061ffa" strokeWidth={1.75} />
            </div>
            <span style={{ ...ss.contactLabel, color: '#061ffa' }}>Chat</span>
          </button>
          {ride.passengerPhone && (
            <a href={`https://wa.me/${ride.passengerPhone?.replace(/\D/g, '')}`}
              target="_blank" rel="noopener noreferrer" style={ss.contactBtn}>
              <div style={{ ...ss.contactIconBox, background: '#e8f5e9' }}>
                <Icon name="whatsapp" size={18} color="#25d366" />
              </div>
              <span style={ss.contactLabel}>WhatsApp</span>
            </a>
          )}
          <button style={ss.contactBtn} onClick={onCancel}>
            <div style={{ ...ss.contactIconBox, background: '#ffebee' }}>
              <Icon name="cancel" size={18} color="#f44336" strokeWidth={1.75} />
            </div>
            <span style={{ ...ss.contactLabel, color: '#f44336' }}>Cancel</span>
          </button>
        </div>

        {/* Primary action button */}
        {state === 'accepted' && (
          <button style={ss.primaryBtn} onClick={onArrived}>
            <Icon name="map-pin" size={20} color="#fff" />
            I've Arrived at Pickup
          </button>
        )}
        {state === 'arrived' && (
          <button style={{ ...ss.primaryBtn, background: '#f97316' }} onClick={onStartTrip}>
            <Icon name="motorcycle" size={20} color="#fff" />
            Start Trip
          </button>
        )}
        {state === 'in_progress' && (
          <button style={{ ...ss.primaryBtn, background: '#4caf50' }} onClick={onComplete}>
            <Icon name="check" size={20} color="#fff" />
            Complete Trip
          </button>
        )}
      </div>
    </motion.div>
  );
}

const ss: Record<string, React.CSSProperties> = {
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'white', borderRadius: '24px 24px 0 0',
    boxShadow: '0 -4px 30px rgba(0,0,0,0.15)', zIndex: 300,
    touchAction: 'none',
  },
  handle: { width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto' },
  inner: { padding: '4px 20px 36px', display: 'flex', flexDirection: 'column', gap: 14 },

  statusBanner: {
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 14px', borderRadius: 14, border: '1px solid',
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  statusTitle: { fontSize: 14, fontWeight: 700, fontFamily: "'Poppins', sans-serif" },
  statusSub: { fontSize: 11, color: '#888', marginTop: 1, fontFamily: "'Poppins', sans-serif" },
  etaBadge: { padding: '6px 10px', borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 },
  etaValue: { fontSize: 15, fontWeight: 600, fontFamily: "'Poppins', sans-serif" },
  etaLabel: { fontSize: 10, color: '#888', fontFamily: "'Poppins', sans-serif" },

  passengerCard: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '14px 16px', background: '#f8f8f8', borderRadius: 16,
  },
  passengerAvatar: {
    width: 48, height: 48, borderRadius: 24, background: '#e8edff',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  passengerInitial: { fontSize: 20, fontWeight: 700, color: '#061ffa' },
  passengerInfo: { flex: 1 },
  passengerName: { fontSize: 15, fontWeight: 700, color: '#333', fontFamily: "'Poppins', sans-serif" },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 },
  ratingText: { fontSize: 12, color: '#888', fontFamily: "'Poppins', sans-serif" },
  deliveryBadge: { fontSize: 11, background: '#fff8e1', padding: '2px 8px', borderRadius: 10, marginLeft: 4 },
  fareBox: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
  fareValue: { fontSize: 17, fontWeight: 600, color: '#061ffa', fontFamily: "'Poppins', sans-serif" },
  fareLabel: { fontSize: 10, color: '#aaa', fontFamily: "'Poppins', sans-serif" },

  routeCard: { background: '#f8f9ff', borderRadius: 14, padding: '12px 14px', border: '1px solid #e8edff' },
  routeRow: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  routeIconCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12, marginTop: 4 },
  dot: { width: 12, height: 12, borderRadius: 6, flexShrink: 0 },
  line: { width: 2, height: 24, background: '#dde3ff', marginTop: 3 },
  routeInfo: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 0.8, marginBottom: 2, fontFamily: "'Poppins', sans-serif" },
  routeAddr: { fontSize: 13, fontWeight: 500, color: '#333', lineHeight: '1.4', fontFamily: "'Poppins', sans-serif" },

  contactRow: { display: 'flex', gap: 8 },
  contactBtn: {
    flex: 1, padding: '10px 6px', background: '#f9f9f9', borderRadius: 12,
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
    border: 'none', cursor: 'pointer', textDecoration: 'none',
  },
  contactIconBox: { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  contactLabel: { fontSize: 11, fontWeight: 600, color: '#555', fontFamily: "'Poppins', sans-serif" },

  primaryBtn: {
    height: 56, background: '#061ffa', borderRadius: 16, border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
    color: 'white', fontSize: 15, fontWeight: 700, fontFamily: "'Poppins', sans-serif",
    transition: 'transform 0.1s, opacity 0.1s',
  },
};

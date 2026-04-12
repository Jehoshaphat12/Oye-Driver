import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icons';
import { IncomingRide } from '../types';

const COUNTDOWN_TOTAL = 30;

interface Props {
  visible: boolean;
  ride: IncomingRide | null;
  onAccept: () => void;
  onDecline: () => void;
  isAccepting?: boolean;
}

export default function IncomingRideSheet({ visible, ride, onAccept, onDecline, isAccepting = false }: Props) {
  const [countdown, setCountdown] = useState(COUNTDOWN_TOTAL);
  const [pulse, setPulse] = useState(1);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pulseRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!visible || !ride) return;
    setCountdown(COUNTDOWN_TOTAL);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); onDecline(); return 0; }
        return prev - 1;
      });
    }, 1000);
    pulseRef.current = setInterval(() => setPulse(p => p === 1 ? 1.06 : 1), 700);
    return () => {
      clearInterval(timerRef.current!);
      clearInterval(pulseRef.current!);
    };
  }, [visible, ride?.id]);

  const ringColor = countdown > 20 ? '#22c55e' : countdown > 10 ? '#f97316' : '#ef4444';
  const progress = countdown / COUNTDOWN_TOTAL;
  const isDelivery = ride?.isDelivery || ride?.vehicleType === 'delivery' || ride?.vehicleType === 'bicycle_delivery';

  const circumference = 2 * Math.PI * 20;

  if (!ride) return null;

  return (
    <AnimatePresence>
      {visible && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={ss.backdrop}
            onClick={onDecline}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={ss.sheet}
          >
            {/* Handle */}
            <div style={ss.handle} />

            {/* Header: type badge + countdown */}
            <div style={ss.headerRow}>
              <div style={{ ...ss.typeBadge, background: isDelivery ? '#fff8e1' : '#e8edff' }}>
                <Icon name={isDelivery ? 'package' : 'motorcycle'} size={14}
                  color={isDelivery ? '#f59e0b' : '#061ffa'} />
                <span style={{ ...ss.typeBadgeText, color: isDelivery ? '#f59e0b' : '#061ffa' }}>
                  {isDelivery ? 'DELIVERY REQUEST' : 'RIDE REQUEST'}
                </span>
              </div>
              {/* Countdown SVG ring */}
              <div style={{ ...ss.countdownWrap, transform: `scale(${pulse})`, transition: 'transform 0.4s' }}>
                <svg width={52} height={52} style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                  <circle cx={26} cy={26} r={20} fill="none" stroke="#eee" strokeWidth={3} />
                  <circle cx={26} cy={26} r={20} fill="none" stroke={ringColor} strokeWidth={3}
                    strokeDasharray={circumference}
                    strokeDashoffset={circumference * (1 - progress)}
                    strokeLinecap="round"
                    style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.5s' }}
                  />
                </svg>
                <span style={{ ...ss.countdownNum, color: ringColor }}>{countdown}</span>
              </div>
            </div>

            {/* Passenger row */}
            <div style={ss.passengerRow}>
              <div style={ss.avatar}>
                <span style={ss.avatarInitial}>{(ride.passengerName || 'P')[0].toUpperCase()}</span>
              </div>
              <div style={ss.passengerInfo}>
                <div style={ss.passengerName}>{ride.passengerName}</div>
                <div style={ss.ratingRow}>
                  <Icon name="star-fill" size={12} color="#ffc107" />
                  <span style={ss.ratingText}>{(ride.passengerRating || 4.8).toFixed(1)}</span>
                  {ride.distanceFromDriver !== undefined && (
                    <span style={ss.distText}> · {ride.distanceFromDriver.toFixed(1)} km away</span>
                  )}
                </div>
              </div>
              <div style={ss.farePill}>
                <span style={ss.fareAmount}>GH₵{ride.fare}</span>
                {ride.distance && <span style={ss.fareDistance}>{ride.distance}</span>}
              </div>
            </div>

            {/* Route card */}
            <div style={ss.routeCard}>
              {/* Pickup */}
              <div style={ss.routeRow}>
                <div style={ss.routeIconCol}>
                  <div style={{ ...ss.routeDot, background: '#061ffa' }} />
                  <div style={ss.routeLine} />
                </div>
                <div style={ss.routeTexts}>
                  <div style={ss.routeLabel}>PICKUP</div>
                  <div style={ss.routeAddress}>{ride.pickup?.address || 'Pickup location'}</div>
                </div>
              </div>
              {/* Stops */}
              {ride.stops?.map((stop, i) => (
                <div key={i} style={ss.routeRow}>
                  <div style={ss.routeIconCol}>
                    <div style={{ ...ss.routeDotSmall, borderColor: '#aaa' }} />
                    <div style={ss.routeLine} />
                  </div>
                  <div style={ss.routeTexts}>
                    <div style={ss.routeLabel}>STOP {i + 1}</div>
                    <div style={ss.routeAddress}>{stop.address}</div>
                  </div>
                </div>
              ))}
              {/* Destination */}
              <div style={{ ...ss.routeRow, marginBottom: 0 }}>
                <div style={ss.routeIconCol}>
                  <div style={{ ...ss.routeDot, background: '#f97316' }} />
                </div>
                <div style={ss.routeTexts}>
                  <div style={ss.routeLabel}>DROP-OFF</div>
                  <div style={ss.routeAddress}>{ride.destination?.address || 'Destination'}</div>
                </div>
              </div>
              {/* Package info */}
              {isDelivery && ride.packageInfo?.itemDescription && (
                <div style={ss.packageRow}>
                  <Icon name="package" size={14} color="#888" />
                  <span style={ss.packageText}>{ride.packageInfo.itemDescription}</span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div style={ss.buttonsRow}>
              <button style={ss.declineBtn} onClick={onDecline} disabled={isAccepting}>
                <Icon name="close" size={20} color="#fff" />
                <span style={ss.declineBtnText}>DECLINE</span>
              </button>
              <button
                style={{ ...ss.acceptBtn, ...(isAccepting ? ss.acceptBtnLoading : {}) }}
                onClick={onAccept}
                disabled={isAccepting}
              >
                {isAccepting
                  ? <div style={ss.spinner} />
                  : <Icon name="check" size={20} color="#fff" />}
                <span style={ss.acceptBtnText}>{isAccepting ? 'ACCEPTING…' : 'ACCEPT'}</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

const ss: Record<string, React.CSSProperties> = {
  backdrop: { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 490 },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    background: 'white', borderRadius: '24px 24px 0 0',
    padding: '0 20px 32px', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', zIndex: 500,
  },
  handle: { width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '12px auto 20px' },
  headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  typeBadge: {
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 20,
  },
  typeBadgeText: { fontSize: 11, fontWeight: 700, letterSpacing: 0.8, fontFamily: "'Poppins', sans-serif" },
  countdownWrap: {
    width: 52, height: 52, position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  countdownNum: { fontSize: 16, fontWeight: 600, fontFamily: "'Poppins', sans-serif", position: 'relative', zIndex: 1 },

  passengerRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    background: '#e8edff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  avatarInitial: { fontSize: 22, fontWeight: 700, color: '#061ffa', fontFamily: "'Poppins', sans-serif" },
  passengerInfo: { flex: 1 },
  passengerName: { fontSize: 16, fontWeight: 700, color: '#333', fontFamily: "'Poppins', sans-serif" },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 },
  ratingText: { fontSize: 13, color: '#666', fontFamily: "'Poppins', sans-serif" },
  distText: { fontSize: 12, color: '#aaa', fontFamily: "'Poppins', sans-serif" },
  farePill: {
    background: '#e8edff', borderRadius: 14, padding: '8px 14px',
    display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
  },
  fareAmount: { fontSize: 17, fontWeight: 600, color: '#061ffa', fontFamily: "'Poppins', sans-serif" },
  fareDistance: { fontSize: 11, color: '#888', marginTop: 2, fontFamily: "'Poppins', sans-serif" },

  routeCard: {
    background: '#f8f9ff', borderRadius: 16, border: '1px solid #e8edff',
    padding: 16, marginBottom: 18,
  },
  routeRow: { display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 },
  routeIconCol: { display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14, marginTop: 3 },
  routeDot: { width: 12, height: 12, borderRadius: 6 },
  routeDotSmall: { width: 10, height: 10, borderRadius: 5, border: '2px solid', background: 'transparent' },
  routeLine: { width: 2, flex: 1, background: '#dde3ff', minHeight: 20, marginTop: 2 },
  routeTexts: { flex: 1 },
  routeLabel: { fontSize: 10, fontWeight: 700, color: '#aaa', letterSpacing: 0.8, marginBottom: 2, fontFamily: "'Poppins', sans-serif" },
  routeAddress: { fontSize: 13, fontWeight: 500, color: '#333', lineHeight: '1.4', fontFamily: "'Poppins', sans-serif" },
  packageRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 12, paddingTop: 12, borderTop: '1px solid #e0e0e0' },
  packageText: { fontSize: 13, color: '#888', flex: 1, fontFamily: "'Poppins', sans-serif" },

  buttonsRow: { display: 'flex', gap: 12 },
  declineBtn: {
    flex: 1, height: 56, background: '#dc2626', borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', cursor: 'pointer',
  },
  declineBtnText: { fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.5, fontFamily: "'Poppins', sans-serif" },
  acceptBtn: {
    flex: 2, height: 56, background: '#16a34a', borderRadius: 16,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    border: 'none', cursor: 'pointer',
  },
  acceptBtnLoading: { background: '#15803d', opacity: 0.85 },
  acceptBtnText: { fontSize: 13, fontWeight: 700, color: '#fff', letterSpacing: 0.5, fontFamily: "'Poppins', sans-serif" },
  spinner: {
    width: 20, height: 20, border: '2.5px solid rgba(255,255,255,0.3)',
    borderTop: '2.5px solid white', borderRadius: '50%', animation: 'spin 0.8s linear infinite',
  },
};

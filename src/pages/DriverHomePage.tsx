import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FirestoreService } from '../services/firestoreService';
import { firestore } from '../lib/firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { Driver, DriverRideState, IncomingRide, ActiveRide, Earnings, TripRecord, MotorMode, VehicleType } from '../types';
import { Icon } from '../components/Icons';
import DriverBottomNav from '../components/DriverBottomNav';
import DriverSidebar from '../components/DriverSidebar';
import DriverHomeSheet from '../components/DriverHomeSheet';
import IncomingRideSheet from '../components/IncomingRideSheet';
import ActiveRideSheet from '../components/ActiveRideSheet';
import RideCompletedSheet from '../components/RideCompletedSheet';
import MapView from '../components/MapView';

function calcDist(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const MOTOR_MODES: MotorMode[] = ['both', 'rides', 'deliveries'];
const MOTOR_MODE_LABELS: Record<MotorMode, string> = {
  both: 'Rides & Deliveries', rides: 'Rides Only', deliveries: 'Deliveries Only',
};
const MOTOR_MODE_ICONS: Record<MotorMode, string> = {
  both: '⇄', rides: '🏍', deliveries: '📦',
};

export default function DriverHomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [driverState, setDriverState] = useState<DriverRideState>('offline');
  const [isOnline, setIsOnline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [driverProfile, setDriverProfile] = useState<Driver | null>(null);
  const [motorMode, setMotorMode] = useState<MotorMode>('both');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [currentRequest, setCurrentRequest] = useState<IncomingRide | null>(null);
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null);
  const [completedData, setCompletedData] = useState<any>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [eta, setEta] = useState('');
  const [distanceToTarget, setDistanceToTarget] = useState('');

  const [earnings, setEarnings] = useState<Earnings>({ today: 0, weekly: 0, tripsToday: 0, weeklyTrips: 0 });
  const [recentTrips, setRecentTrips] = useState<TripRecord[]>([]);
  const [driverRating, setDriverRating] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const unsubRef = useRef<(() => void) | null>(null);
  const processedRef = useRef<Set<string>>(new Set());
  const locationRef = useRef<{ lat: number; lng: number } | null>(null);
  const stateRef = useRef<DriverRideState>('offline');

  useEffect(() => { stateRef.current = driverState; }, [driverState]);
  useEffect(() => { locationRef.current = userLocation; }, [userLocation]);

  // GPS
  useEffect(() => {
    const id = navigator.geolocation?.watchPosition(
      p => setUserLocation({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => setUserLocation({ lat: 5.6037, lng: -0.187 }),
      { enableHighAccuracy: true, maximumAge: 5000 },
    );
    return () => { if (id) navigator.geolocation.clearWatch(id); };
  }, []);

  // Load driver profile
  useEffect(() => {
    if (!user?.id) return;
    FirestoreService.getDriver(user.id).then(d => {
      if (!d) return;
      setDriverProfile(d);
      setDriverRating(typeof d.rating === 'number' ? d.rating : null);
      setIsOnline(d.isOnline ?? false);
      setDriverState(d.isOnline ? 'online' : 'offline');
    });
  }, [user?.id]);

  // Load trips + compute earnings
  const loadTrips = useCallback(() => {
    if (!user?.id) return;
    FirestoreService.getDriverTrips(user.id).then(trips => {
      setRecentTrips(trips);
      const now = new Date();
      const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const last7 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      let todayEarn = 0, weekEarn = 0, todayTrips = 0, weekTrips = 0;
      trips.filter(r => r.status === 'completed').forEach(r => {
        const ts = r.completedAt || r.requestedAt;
        const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : new Date();
        const fare = Number(r.totalFare) || 0;
        if (d >= startToday) { todayEarn += fare; todayTrips++; }
        if (d >= last7) { weekEarn += fare; weekTrips++; }
      });
      setEarnings({ today: todayEarn, weekly: weekEarn, tripsToday: todayTrips, weeklyTrips: weekTrips });
    });
  }, [user?.id]);

  useEffect(() => { loadTrips(); }, [loadTrips, isOnline]);

  // Firestore ride listener
  useEffect(() => {
    unsubRef.current?.();
    unsubRef.current = null;
    if (!isOnline || !user?.id || !userLocation) return;

    const vt = driverProfile?.vehicle?.vehicleType || 'motor';
    const vehicleTypes: string[] =
      vt === 'motor'
        ? motorMode === 'rides' ? ['motor'] : motorMode === 'deliveries' ? ['delivery'] : ['motor', 'delivery']
        : [vt];

    const unsubs: (() => void)[] = [];

    vehicleTypes.forEach(vehicleType => {
      const q = query(
        collection(firestore, 'rides'),
        where('status', '==', 'requesting'),
        where('vehicleType', '==', vehicleType),
        orderBy('requestedAt', 'desc'),
      );
      const unsub = onSnapshot(q, snap => {
        snap.docChanges().forEach(change => {
          if (change.type !== 'added') return;
          const s = stateRef.current;
          if (['request_received', 'accepted', 'arrived', 'in_progress'].includes(s)) return;

          const data = change.doc.data() as any;
          const ride = { id: change.doc.id, ...data };
          if (processedRef.current.has(ride.id)) return;
          if (!ride.pickup?.latitude) return;

          const loc = locationRef.current || userLocation;
          const dist = calcDist(loc.lat, loc.lng, ride.pickup.latitude, ride.pickup.longitude);

          if (dist <= 5) {
            processedRef.current.add(ride.id);
            const isDelivery = vehicleType === 'delivery' || vehicleType === 'bicycle_delivery';
            setCurrentRequest({
              id: ride.id,
              passengerName: ride.passengerName || 'Passenger',
              passengerRating: ride.passengerRating || 4.8,
              passengerPhone: ride.passengerPhone,
              pickup: ride.pickup,
              destination: ride.destinations?.[ride.destinations.length - 1],
              stops: ride.destinations?.slice(0, -1),
              fare: ride.totalFare || 0,
              distance: ride.distance ? `${Number(ride.distance).toFixed(1)} km` : undefined,
              distanceFromDriver: dist,
              vehicleType: vehicleType as VehicleType,
              isDelivery,
              packageInfo: ride.packageInfo,
            });
            setDriverState('request_received');
          }
        });
      }, err => console.error('Ride listener error:', err));
      unsubs.push(unsub);
    });

    unsubRef.current = () => unsubs.forEach(u => u());
    return () => { unsubRef.current?.(); unsubRef.current = null; };
  }, [isOnline, userLocation, user?.id, motorMode, driverProfile?.vehicle?.vehicleType]);

  // ETA calculation
  useEffect(() => {
    if (!userLocation || !activeRide) { setEta(''); setDistanceToTarget(''); return; }
    const dests = activeRide.stops as any[] | undefined;
    const target = driverState === 'accepted'
      ? activeRide.pickup
      : (dests?.[dests.length - 1] ?? activeRide.destination);
    if (!target?.latitude) return;
    const dist = calcDist(userLocation.lat, userLocation.lng, target.latitude, target.longitude);
    setDistanceToTarget(`${dist.toFixed(1)} km`);
    setEta(`${Math.max(1, Math.round(dist / 30 * 60))} min`);
  }, [userLocation, activeRide, driverState]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const toggleOnline = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const next = !isOnline;
      await FirestoreService.updateDriverAvailability(user.id, next, next);
      setIsOnline(next);
      setDriverState(next ? 'online' : 'offline');
      if (!next) processedRef.current.clear();
    } catch { alert('Failed to update online status. Please try again.'); }
    finally { setLoading(false); }
  };

  const handleAcceptRide = async () => {
    if (!currentRequest || !user || isAccepting) return;
    setIsAccepting(true);
    try {
      await FirestoreService.acceptRide(currentRequest.id, user.id);
      setActiveRide({ ...currentRequest, status: 'accepted' } as unknown as ActiveRide);
      setDriverState('accepted');
      setCurrentRequest(null);
    } catch (e: any) {
      processedRef.current.delete(currentRequest.id);
      setCurrentRequest(null);
      setDriverState('online');
      if (e?.message?.includes('already')) alert('This ride was already accepted by another driver.');
      else alert('Failed to accept ride. Please try again.');
    } finally { setIsAccepting(false); }
  };

  const handleDeclineRide = () => {
    if (currentRequest) processedRef.current.delete(currentRequest.id);
    setCurrentRequest(null);
    setDriverState('online');
  };

  const handleArrived = async () => {
    if (!activeRide) return;
    await FirestoreService.updateRideStatus(activeRide.id, 'arrived').catch(() => {});
    setDriverState('arrived');
  };

  const handleStartTrip = async () => {
    if (!activeRide) return;
    await FirestoreService.updateRideStatus(activeRide.id, 'in_progress').catch(() => {});
    setDriverState('in_progress');
  };

  const handleCompleteRide = async () => {
    if (!activeRide) return;
    try {
      await FirestoreService.updateRideStatus(activeRide.id, 'completed');
      const dests = activeRide.stops as any[] | undefined;
      const destAddr = (dests?.[dests.length - 1] ?? activeRide.destination)?.address;
      setCompletedData({
        id: activeRide.id,
        pickupAddress: activeRide.pickup?.address || 'Pickup',
        destinationAddress: destAddr || 'Destination',
        passengerName: activeRide.passengerName || 'Passenger',
        totalFare: Number(activeRide.fare || activeRide.totalFare) || 0,
        distance: activeRide.distance ? Number(activeRide.distance) : undefined,
        rideDate: new Date().toLocaleDateString(),
        rideTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      });
      setDriverState('completed');
    } catch { alert('Failed to complete trip. Please try again.'); }
  };

  const handleCancelRide = async () => {
    if (activeRide) await FirestoreService.updateRideStatus(activeRide.id, 'cancelled').catch(() => {});
    setActiveRide(null); setCurrentRequest(null); setDriverState('online');
  };

  const handleCompletedClose = () => {
    setCompletedData(null); setActiveRide(null); setDriverState('online');
    loadTrips();
  };

  const cycleModes = () => {
    const idx = MOTOR_MODES.indexOf(motorMode);
    setMotorMode(MOTOR_MODES[(idx + 1) % MOTOR_MODES.length]);
  };

  const isMotorDriver = driverProfile?.vehicle?.vehicleType === 'motor';
  const showHomeSheet = driverState === 'offline' || driverState === 'online';
  const showIncoming = driverState === 'request_received';
  const showActive = driverState === 'accepted' || driverState === 'arrived' || driverState === 'in_progress';
  const showCompleted = driverState === 'completed';

  return (
    <div style={ss.screen}>
      {/* Map background */}
      <div style={ss.mapBg}>
        <div style={ss.mapGrid} />
        {/* Online/offline map overlay tint */}
        <div style={{ ...ss.mapTint, background: isOnline ? 'rgba(6,31,250,0.04)' : 'rgba(0,0,0,0.04)' }} />
        <div style={ss.mapCenter}>
          <div style={{ ...ss.mapPulse, background: isOnline ? '#4caf50' : '#ccc' }} />
          <span style={ss.mapLabel}>{isOnline ? 'Waiting for rides…' : 'Go online to receive rides'}</span>
        </div>
      </div>
      {/* MapView Component */}
        <MapView userLocation={userLocation} pickup={activeRide?.pickup || null} destination={activeRide?.destination || null} travelMode="BICYCLING" />

      {/* Top bar */}
      <div style={ss.topBar}>
        <button style={ss.iconBtn} onClick={() => setSidebarOpen(true)}>
          <Icon name="menu" size={22} color="#333" />
        </button>

        {showHomeSheet && (
          <div style={{ ...ss.statusPill, background: isOnline ? '#e8f5e9' : '#f5f5f5' }}>
            <div style={{ ...ss.pillDot, background: isOnline ? '#4caf50' : '#ccc',
              animation: isOnline ? 'pulse 1.5s ease-in-out infinite' : 'none' }} />
            <span style={{ ...ss.pillText, color: isOnline ? '#2e7d32' : '#888' }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        )}

        {showActive && (
          <div style={ss.activeRidePill}>
            <div style={ss.activeRideDot} />
            <span style={ss.activeRideText}>
              {driverState === 'accepted' ? 'To Pickup' : driverState === 'arrived' ? 'Waiting' : 'Trip Active'}
            </span>
            {eta && <span style={ss.etaChip}>{eta}</span>}
          </div>
        )}

        {/* Motor mode badge */}
        {isMotorDriver && isOnline && showHomeSheet && (
          <button style={ss.modeBadge} onClick={cycleModes} title="Tap to cycle mode">
            <span>{MOTOR_MODE_ICONS[motorMode]}</span>
            <span style={ss.modeBadgeText}>{MOTOR_MODE_LABELS[motorMode]}</span>
          </button>
        )}

        <div style={{ marginLeft: 'auto' }}>
          <button style={ss.iconBtn}>
            <Icon name="bell" size={22} color="#333" />
          </button>
        </div>
      </div>

      {/* Sheets */}
      {showHomeSheet && (
        <DriverHomeSheet
          isOnline={isOnline}
          loading={loading}
          earnings={earnings}
          recentTrips={recentTrips}
          driverRating={driverRating}
          onToggleOnline={toggleOnline}
          onSeeAllTrips={() => navigate('/history')}
          onSeeAllEarnings={() => navigate('/earnings')}
        />
      )}

      <IncomingRideSheet
        visible={showIncoming}
        ride={currentRequest}
        onAccept={handleAcceptRide}
        onDecline={handleDeclineRide}
        isAccepting={isAccepting}
      />

      {showActive && (
        <ActiveRideSheet
          state={driverState}
          ride={activeRide}
          eta={eta}
          distance={distanceToTarget}
          onArrived={handleArrived}
          onStartTrip={handleStartTrip}
          onComplete={handleCompleteRide}
          onCancel={handleCancelRide}
          onChat={() => activeRide?.id && navigate(`/chat?rideId=${activeRide.id}`)}
          onCall={() => { if (activeRide?.passengerPhone) window.open(`tel:${activeRide.passengerPhone}`); }}
        />
      )}

      {showCompleted && completedData && (
        <RideCompletedSheet
          data={completedData}
          onClose={handleCompletedClose}
          onReportIssue={() => alert('Report issue coming soon')}
        />
      )}

      {showHomeSheet && <DriverBottomNav active="home" />}
      <DriverSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} driver={driverProfile} />
    </div>
  );
}

const ss: Record<string, React.CSSProperties> = {
  screen: { flex: 1, height: '100%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' },

  mapBg: { position: 'absolute', inset: 0, background: '#eef0f5' },
  mapGrid: {
    position: 'absolute', inset: 0,
    backgroundImage: 'linear-gradient(rgba(6,31,250,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(6,31,250,0.06) 1px, transparent 1px)',
    backgroundSize: '44px 44px',
  },
  mapTint: { position: 'absolute', inset: 0, transition: 'background 0.5s' },
  mapCenter: { position: 'absolute', top: '38%', left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 },
  mapPulse: { width: 16, height: 16, borderRadius: 8, boxShadow: '0 0 0 6px rgba(76,175,80,0.18)', transition: 'background 0.4s' },
  mapLabel: { fontSize: 13, color: '#999', fontFamily: "'Poppins', sans-serif", fontWeight: 500 },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100,
    padding: '20px 16px 12px', display: 'flex', alignItems: 'center', gap: 10, pointerEvents: 'none',
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 12, background: 'white',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)', border: 'none', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, pointerEvents: 'all',
  },
  statusPill: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 20,
    boxShadow: '0 2px 12px rgba(0,0,0,0.10)',
  },
  pillDot: { width: 8, height: 8, borderRadius: '50%', transition: 'background 0.3s' },
  pillText: { fontSize: 13, fontWeight: 700, fontFamily: "'Poppins', sans-serif" },
  activeRidePill: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', borderRadius: 20,
    background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', pointerEvents: 'none',
  },
  activeRideDot: { width: 8, height: 8, borderRadius: '50%', background: '#061ffa', animation: 'pulse 1.5s ease-in-out infinite' },
  activeRideText: { fontSize: 13, fontWeight: 700, color: '#061ffa', fontFamily: "'Poppins', sans-serif" },
  etaChip: { fontSize: 11, fontWeight: 700, color: 'white', background: '#061ffa', padding: '2px 8px', borderRadius: 10, fontFamily: "'Poppins', sans-serif" },
  modeBadge: {
    display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 20,
    background: 'white', boxShadow: '0 2px 12px rgba(0,0,0,0.12)', border: 'none', cursor: 'pointer',
    pointerEvents: 'all',
  },
  modeBadgeText: { fontSize: 12, fontWeight: 700, color: '#061ffa', fontFamily: "'Poppins', sans-serif" },
};

import { db } from '../lib/firebase';
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  updateDoc, serverTimestamp, onSnapshot, Unsubscribe, setDoc,
} from 'firebase/firestore';
import { uploadProfilePicture } from '../lib/supabase';
import { Driver, TripRecord, User, VehicleType } from '../types';

interface DriverProfilePayload {
  name: string;
  email: string;
  phone: string;
  vehicle: {
    vehicleType: VehicleType;
    vehicleModel: string;
    vehicleNumber: string;
    color: string;
  };
  isAvailable: boolean;
  isOnline: boolean;
  rating: number;
  totalTrips: number;
  isVerified: boolean;
  photoUrl?: string;
}

export const FirestoreService = {
  // ── Profile ────────────────────────────────────────────────────────────────

  async getDriver(driverId: string): Promise<Driver | null> {
    try {
      const snap = await getDoc(doc(db, 'drivers', driverId));
      return snap.exists() ? ({ id: snap.id, ...snap.data() } as Driver) : null;
    } catch { return null; }
  },

  async updateUser(userId: string, data: Partial<User>): Promise<void> {
    await setDoc(doc(db, 'users', userId), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  },

  async createDriverProfile(driverId: string, payload: DriverProfilePayload): Promise<void> {
    await setDoc(doc(db, 'drivers', driverId), {
      ...payload,
      userId: driverId,
      currentLocation: { latitude: 0, longitude: 0 },
      geohash: '',
      earnings: { today: 0, weekly: 0, monthly: 0, total: 0 },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  /**
   * Upload photo to Supabase Storage (same bucket as the mobile app),
   * then patch photoUrl into both drivers/{id} and users/{id} in Firestore.
   */
  async uploadProfilePhoto(driverId: string, file: File, oldUrl?: string): Promise<string> {
    const publicUrl = await uploadProfilePicture(file, driverId, oldUrl);

    // Patch Firestore — same dual-write as the mobile app
    await Promise.all([
      updateDoc(doc(db, 'drivers', driverId), { photoUrl: publicUrl, updatedAt: serverTimestamp() }),
      setDoc(doc(db, 'users', driverId), { photoUrl: publicUrl, updatedAt: serverTimestamp() }, { merge: true }),
    ]);

    return publicUrl;
  },

  // ── Availability ──────────────────────────────────────────────────────────

  async updateDriverAvailability(driverId: string, isOnline: boolean, isAvailable?: boolean): Promise<void> {
    await updateDoc(doc(db, 'drivers', driverId), {
      isOnline,
      isAvailable: isAvailable ?? isOnline,
      lastSeen: serverTimestamp(),
    });
  },

  // ── Trips ─────────────────────────────────────────────────────────────────
  //
  // FIXED: Mobile app uses:
  //   - field: "driverId"  (not "driver_id")
  //   - ordering: "createdAt" (not "requestedAt")
  //   - explicit status `in` filter so Firestore can satisfy the composite index
  //
  async getDriverTrips(driverId: string): Promise<TripRecord[]> {
    try {
      const q = query(
        collection(db, 'rides'),
        where('driverId', '==', driverId),
        where('status', 'in', ['requesting', 'accepted', 'in_progress', 'completed', 'cancelled']),
        orderBy('createdAt', 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TripRecord));
    } catch (err) {
      console.error('[getDriverTrips] query failed:', err);
      // Fallback — no ordering so it doesn't need a composite index
      try {
        const fallback = query(
          collection(db, 'rides'),
          where('driverId', '==', driverId),
          limit(50),
        );
        const snap = await getDocs(fallback);
        const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() } as TripRecord));
        // Sort client-side
        return trips.sort((a: any, b: any) => {
          const ta = a.createdAt?.toDate?.() ?? new Date(a.createdAt ?? 0);
          const tb = b.createdAt?.toDate?.() ?? new Date(b.createdAt ?? 0);
          return tb.getTime() - ta.getTime();
        });
      } catch { return []; }
    }
  },

  // ── Ride actions ──────────────────────────────────────────────────────────

  async acceptRide(rideId: string, driverId: string): Promise<void> {
    await updateDoc(doc(db, 'rides', rideId), {
      status: 'accepted', driverId, acceptedAt: serverTimestamp(),
    });
  },

  async updateRideStatus(rideId: string, status: string): Promise<void> {
    const update: any = { status, updatedAt: serverTimestamp() };
    if (status === 'in_progress') update.startedAt   = serverTimestamp();
    if (status === 'completed')   update.completedAt = serverTimestamp();
    await updateDoc(doc(db, 'rides', rideId), update);
  },

  subscribeToRide(rideId: string, cb: (data: any) => void): Unsubscribe {
    return onSnapshot(doc(db, 'rides', rideId), (snap) => {
      if (snap.exists()) cb({ id: snap.id, ...snap.data() });
    });
  },
};

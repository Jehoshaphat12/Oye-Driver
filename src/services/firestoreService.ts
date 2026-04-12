import { storage, db } from '../lib/firebase';
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, limit,
  updateDoc, serverTimestamp, onSnapshot, Unsubscribe, setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

  /**
   * Creates the drivers/{driverId} document with vehicle info.
   * Called after a successful driver registration.
   */
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
   * Uploads a driver profile photo to Firebase Storage and returns the download URL.
   * Path: driver-photos/{driverId}/profile.{ext}
   */
  async uploadProfilePhoto(driverId: string, file: File): Promise<string> {
    const ext = file.name.split('.').pop() ?? 'jpg';
    const storageRef = ref(storage, `driver-photos/${driverId}/profile.${ext}`);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });
    return getDownloadURL(snapshot.ref);
  },

  // ── Availability ──────────────────────────────────────────────────────────

  async updateDriverAvailability(driverId: string, isOnline: boolean, isAvailable: boolean): Promise<void> {
    await updateDoc(doc(db, 'drivers', driverId), { isAvailable, isOnline, lastSeen: serverTimestamp() });
  },

  // ── Trips ─────────────────────────────────────────────────────────────────

  async getDriverTrips(driverId: string): Promise<TripRecord[]> {
    try {
      const q = query(
        collection(db, 'rides'),
        where('driverId', '==', driverId),
        orderBy('requestedAt', 'desc'),
        limit(50),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as TripRecord));
    } catch { return []; }
  },

  // ── Ride actions ──────────────────────────────────────────────────────────

  async acceptRide(rideId: string, driverId: string): Promise<void> {
    await updateDoc(doc(db, 'rides', rideId), {
      status: 'accepted', driverId, acceptedAt: serverTimestamp(),
    });
  },

  async updateRideStatus(rideId: string, status: string): Promise<void> {
    const update: any = { status };
    if (status === 'in_progress') update.startedAt = serverTimestamp();
    if (status === 'completed')   update.completedAt = serverTimestamp();
    await updateDoc(doc(db, 'rides', rideId), update);
  },

  subscribeToRide(rideId: string, cb: (data: any) => void): Unsubscribe {
    return onSnapshot(doc(db, 'rides', rideId), (snap) => {
      if (snap.exists()) cb({ id: snap.id, ...snap.data() });
    });
  },
};

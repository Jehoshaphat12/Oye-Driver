/// <reference types="vite/client" />

import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  limit,
  updateDoc,
  doc,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import app, { firestore } from '../lib/firebase';
import { FirestoreService } from './firestoreService';

// VAPID key from Firebase Console → Project Settings → Cloud Messaging → Web Push certificates
// Replace this with your actual VAPID key from: Firebase Console → Project Settings → Cloud Messaging
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || 'YOUR_VAPID_KEY_HERE';

export interface AppNotification {
  id: string;
  type:
    | 'ride_accepted'
    | 'ride_cancelled'
    | 'ride_completed'
    | 'chat_message'
    | 'rating_received'
    | 'ride_request';
  title: string;
  body: string;
  rideId?: string;
  screen?: string;
  read: boolean;
  createdAt: any;
}

export class WebNotificationService {
  private static messagingInstance: any = null;

  /**
   * Check if FCM is supported in this browser
   */
  static async isMessagingSupported(): Promise<boolean> {
    try {
      return await isSupported();
    } catch {
      return false;
    }
  }

  /**
   * Request browser notification permission and register FCM token
   */
  static async requestPermissionAndGetToken(userId: string): Promise<string | null> {
    try {
      const supported = await this.isMessagingSupported();
      if (!supported) {
        console.log('FCM not supported in this browser');
        return null;
      }

      // Request permission
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return null;
      }

      // Register service worker
      let swRegistration: ServiceWorkerRegistration | undefined;
      if ('serviceWorker' in navigator) {
        swRegistration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        console.log('Service worker registered:', swRegistration);
      }

      const messaging = getMessaging(app);
      this.messagingInstance = messaging;

      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (token) {
        // console.log('FCM Token:', token);
        // Save to Firestore so the driver-side backend can send notifications to this passenger
        await FirestoreService.updateUser(userId, {
          fcmToken: token,
          tokenUpdatedAt: new Date(),
        } as any);
        return token;
      }

      return null;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Listen for foreground FCM messages (app is open/focused)
   * Returns unsubscribe function
   */
  static onForegroundMessage(
    callback: (payload: { type: string; title: string; body: string; data: any }) => void,
  ): () => void {
    if (!this.messagingInstance) {
      try {
        this.messagingInstance = getMessaging(app);
      } catch {
        return () => {};
      }
    }

    const unsubscribe = onMessage(this.messagingInstance, (payload) => {
      console.log('Foreground FCM message:', payload);
      const { title = 'OyeRide', body = '' } = payload.notification || {};
      const data = payload.data || {};
      callback({ type: data.type || '', title, body, data });
    });

    return unsubscribe;
  }

  /**
   * Remove FCM token on logout
   */
  static async removeToken(userId: string): Promise<void> {
    try {
      await FirestoreService.updateUser(userId, {
        fcmToken: null,
        tokenUpdatedAt: new Date(),
      } as any);
    } catch (error) {
      console.error('Error removing FCM token:', error);
    }
  }

  /**
   * Subscribe to in-app notification inbox from Firestore
   */
  static subscribeToNotifications(
    userId: string,
    callback: (notifications: AppNotification[]) => void,
  ): () => void {
    const notifRef = collection(firestore, 'users', userId, 'notifications');
    const q = query(notifRef, orderBy('createdAt', 'desc'), limit(30));

    return onSnapshot(q, (snapshot) => {
      const notifications: AppNotification[] = snapshot.docs.map((d) => ({
        id: d.id,
        ...(d.data() as Omit<AppNotification, 'id'>),
      }));
      callback(notifications);
    });
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(userId: string, notificationId: string): Promise<void> {
    const notifDoc = doc(firestore, 'users', userId, 'notifications', notificationId);
    await updateDoc(notifDoc, { read: true });
  }

  /**
   * Mark all notifications as read
   */
  static async markAllAsRead(userId: string, unreadIds: string[]): Promise<void> {
    await Promise.all(
      unreadIds.map((id) =>
        updateDoc(doc(firestore, 'users', userId, 'notifications', id), { read: true }),
      ),
    );
  }

  /**
   * Write a local in-app notification to Firestore
   * (normally this is done server-side, but useful for testing / local events)
   */
  static async addLocalNotification(
    userId: string,
    type: AppNotification['type'],
    title: string,
    body: string,
    rideId?: string,
    screen?: string,
  ): Promise<void> {
    const notifRef = collection(firestore, 'users', userId, 'notifications');
    await addDoc(notifRef, {
      type,
      title,
      body,
      rideId: rideId || null,
      screen: screen || null,
      createdAt: serverTimestamp(),
      read: false,
    });
  }

  /**
   * Handle a notification click from the service worker
   * (receives messages posted by the SW via postMessage)
   */
  static listenForSwNotificationClicks(
    callback: (data: any) => void,
  ): () => void {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'NOTIFICATION_CLICK') {
        callback(event.data.data);
      }
    };
    navigator.serviceWorker?.addEventListener('message', handler);
    return () => navigator.serviceWorker?.removeEventListener('message', handler);
  }
}

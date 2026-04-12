import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppNotification, WebNotificationService } from '../services/webNotificationService';


/// <reference types="vite/client" />

export interface ToastNotification {
  id: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  rideId?: string;
  timestamp: number;
}

export function useNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const unsubInboxRef = useRef<(() => void) | null>(null);
  const unsubForegroundRef = useRef<(() => void) | null>(null);
  const unsubSwRef = useRef<(() => void) | null>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Dismiss a toast
  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Show an in-app toast banner
  const showToast = useCallback((notification: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const toast: ToastNotification = {
      ...notification,
      id: `toast-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
    };
    setToasts((prev) => [...prev.slice(-2), toast]); // Max 3 toasts at once
    // Auto-dismiss after 5 seconds
    setTimeout(() => dismissToast(toast.id), 5000);
  }, [dismissToast]);

  // Handle notification deep-link navigation
  const handleNotificationAction = useCallback((type: string, rideId?: string) => {
    switch (type) {
      case 'ride_accepted':
      case 'ride_completed':
      case 'ride_cancelled':
        navigate('/');
        break;
      case 'chat_message':
        if (rideId) navigate(`/chat?rideId=${rideId}`);
        else navigate('/');
        break;
      case 'ride_request':
        navigate('/history');
        break;
      default:
        break;
    }
  }, [navigate]);

  // Initialize FCM + request permission
  const initNotifications = useCallback(async () => {
    if (!user?.id) return;

    const currentPermission = typeof Notification !== 'undefined'
      ? Notification.permission
      : 'denied';
    setPermissionStatus(currentPermission as NotificationPermission);

    if (currentPermission === 'denied') return;

    const token = await WebNotificationService.requestPermissionAndGetToken(user.id);
    if (token) {
      setFcmToken(token);
      setPermissionStatus('granted');
    }
  }, [user?.id]);

  // Request permission explicitly (call from UI)
  const requestPermission = useCallback(async () => {
    if (!user?.id) return false;
    const token = await WebNotificationService.requestPermissionAndGetToken(user.id);
    if (token) {
      setFcmToken(token);
      setPermissionStatus('granted');
      return true;
    }
    setPermissionStatus('denied');
    return false;
  }, [user?.id]);

  // Set up all listeners when user logs in
  useEffect(() => {
    if (!user?.id) {
      // Clean up on logout
      unsubInboxRef.current?.();
      unsubForegroundRef.current?.();
      unsubSwRef.current?.();
      setNotifications([]);
      setToasts([]);
      setFcmToken(null);
      return;
    }

    // 1. Init FCM (non-blocking)
    initNotifications();

    // 2. Subscribe to Firestore notification inbox
    unsubInboxRef.current = WebNotificationService.subscribeToNotifications(
      user.id,
      (incoming) => {
        setNotifications((prev) => {
          // Show toast for new notifications that weren't there before
          const prevIds = new Set(prev.map((n) => n.id));
          incoming
            .filter((n) => !n.read && !prevIds.has(n.id))
            .forEach((n) => {
              showToast({
                type: n.type,
                title: n.title,
                body: n.body,
                rideId: n.rideId,
              });
            });
          return incoming;
        });
      },
    );

    // 3. Listen for foreground FCM messages
    unsubForegroundRef.current = WebNotificationService.onForegroundMessage(
      ({ type, title, body, data }) => {
        showToast({ type: type as AppNotification['type'], title, body, rideId: data.rideId });
      },
    );

    // 4. Listen for service worker notification clicks (background → foreground)
    if ('serviceWorker' in navigator) {
      unsubSwRef.current = WebNotificationService.listenForSwNotificationClicks((data) => {
        handleNotificationAction(data.type, data.rideId);
      });
    }

    return () => {
      unsubInboxRef.current?.();
      unsubForegroundRef.current?.();
      unsubSwRef.current?.();
    };
  }, [user?.id]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id) return;
    await WebNotificationService.markAsRead(user.id, notificationId);
  }, [user?.id]);

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;
    const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unreadIds.length > 0) {
      await WebNotificationService.markAllAsRead(user.id, unreadIds);
    }
  }, [user?.id, notifications]);

  return {
    notifications,
    unreadCount,
    toasts,
    fcmToken,
    permissionStatus,
    dismissToast,
    markAsRead,
    markAllAsRead,
    requestPermission,
    handleNotificationAction,
  };
}

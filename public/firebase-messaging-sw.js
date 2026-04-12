// firebase-messaging-sw.js
// Background push notification handler for OyeRide Driver web app.
// Must live at /public/ root so it registers at scope /.

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:            'AIzaSyB9YvFT-uzccwoir9Gofa4CDkR4gM3lF60',
  authDomain:        'oyeride-b6973.firebaseapp.com',
  projectId:         'oyeride-b6973',
  storageBucket:     'oyeride-b6973.firebasestorage.app',
  messagingSenderId: '339897437664',
  appId:             '1:339897437664:web:630ee65f16488c3385af85',
  databaseURL:       'https://oyeride-b6973-default-rtdb.europe-west1.firebasedatabase.app',
});

const messaging = firebase.messaging();

// ── Background message → show OS notification ─────────────────────────────────
messaging.onBackgroundMessage((payload) => {
  console.log('[Driver SW] Background message:', payload);

  const { title = 'OyeRide Driver', body = '' } = payload.notification || {};
  const data = payload.data || {};

  self.registration.showNotification(title, {
    body,
    icon:     '/icons/icon-192x192.png',
    badge:    '/icons/icon-96x96.png',
    tag:      data.rideId || data.type || 'oye-driver',
    renotify: true,
    vibrate:  [200, 100, 200],
    data,
    actions: data.type === 'ride_request' ? [
      { action: 'accept',  title: '✅ Accept'  },
      { action: 'dismiss', title: '✗ Dismiss' },
    ] : [],
  });
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data   = event.notification.data || {};
  const action = event.action;

  if (action === 'dismiss') return;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            client.postMessage({ type: 'NOTIFICATION_CLICK', data });
            return;
          }
        }
        if (clients.openWindow) {
          return clients.openWindow('/').then((client) => {
            if (client) client.postMessage({ type: 'NOTIFICATION_CLICK', data });
          });
        }
      }),
  );
});

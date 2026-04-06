importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC2s3FmZ_aQnXNNGMoBHEfFDV7SqFbSNpA",
  authDomain: "chile-arrival-839a1.firebaseapp.com",
  projectId: "chile-arrival-839a1",
  storageBucket: "chile-arrival-839a1.appspot.com",
  messagingSenderId: "1098395537488",
  appId: "1:1008043594423:web:a3f4e72ba07dedc6483332"
});

const messaging = firebase.messaging();

// Notificaciones cuando la app está en background
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon } = payload.notification;
  self.registration.showNotification(title, {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    vibrate: [200, 100, 200],
    data: payload.data || {}
  });
});

// Click en notificación — abre la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || 'https://chile-arrival-839a1.web.app/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
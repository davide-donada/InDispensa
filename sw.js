const CACHE_NAME = 'indispensa-pwa-v9';

// Asset locali da salvare in cache per il funzionamento offline
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './icon-192.png',
  './icon-512.png',
  './favicon.ico',
  './og-image.png'
];

// Installazione Service Worker e salvataggio asset
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Attivazione e pulizia automatica delle vecchie versioni della cache
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );
    })
  );
  self.clients.claim();
});

// Gestione delle richieste di rete
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Escludi completamente chiamate ad Auth, Google e Firebase Realtime Database
  if (
    url.includes('firebasedatabase.app') ||
    url.includes('firebaseapp.com') ||
    url.includes('googleapis.com') ||
    url.includes('google.com') ||
    url.includes('gstatic.com') ||
    url.includes('identitytoolkit')
  ) {
    return;
  }

  // STRATEGIA NETWORK-FIRST per la pagina principale (index.html)
  if (e.request.mode === 'navigate' || url.endsWith('index.html') || url === self.location.origin + '/') {
    e.respondWith(
      fetch(e.request)
        .then((networkResponse) => {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
          return networkResponse;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // STRATEGIA CACHE-FIRST per immagini e risorse statiche
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

// Firebase Cloud Messaging Background Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBWi3L4DFxAPowky7N9bwgLck_gEcmnywY",
  authDomain: "lista-spesa-10e72.firebaseapp.com",
  databaseURL: "https://lista-spesa-10e72-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "lista-spesa-10e72",
  storageBucket: "lista-spesa-10e72.firebasestorage.app",
  messagingSenderId: "628445802272",
  appId: "1:628445802272:web:74ae840b2a0b53c4ed7145"
});

const messaging = firebase.messaging();

// Gestione dei messaggi FCM ricevuti in Background
messaging.onBackgroundMessage((payload) => {
  console.log('[sw.js] Messaggio FCM ricevuto in background:', payload);
  const title = payload.notification?.title || payload.data?.title || 'InDispensa';
  const body = payload.notification?.body || payload.data?.body || 'Nuovo aggiornamento nella lista';
  return self.registration.showNotification(title, {
    body: body,
    icon: './icon-192.png',
    badge: './icon-192.png',
    data: payload.data
  });
});

// Listener Push per forzare la notifica a schermo sia in foreground che in background
self.addEventListener('push', (event) => {
  if (!event.data) return;
  let title = 'InDispensa';
  let body = 'Nuova notifica ricevuta';
  try {
    const data = event.data.json();
    if (data.notification) {
      title = data.notification.title || title;
      body = data.notification.body || body;
    } else if (data.data) {
      title = data.data.title || title;
      body = data.data.body || body;
    }
  } catch (e) {
    body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: './icon-192.png',
      badge: './icon-192.png'
    })
  );
});

// Gestione click sulla notifica: apre o porta in primo piano la PWA
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('index.html') || client.url === self.location.origin + '/') {
          return client.focus();
        }
      }
      return clients.openWindow('./index.html');
    })
  );
});

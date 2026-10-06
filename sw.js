const CACHE_NAME = 'spesa-pwa-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.22.1/firebase-database-compat.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', (e) => {
  // Lasciamo gestire a Firebase le richieste al database, intercettando solo le risorse statiche
  if (e.request.url.includes('firebasedatabase.app')) {
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Aggiorna la cache in background
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }
      return fetch(e.request);
    })
  );
});

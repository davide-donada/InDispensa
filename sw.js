const CACHE_NAME = 'indispensa-pwa-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
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
  const url = e.request.url;
  
  // Escludi completamente dall'intercettazione offline tutte le chiamate ad Auth e Firebase
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

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});

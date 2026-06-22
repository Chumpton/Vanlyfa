const CACHE_NAME = 'vanlyfa-cache-v1';
const STATIC_ASSETS = [
  './',
  'index.html',
  'index.css',
  'index.js',
  'logic.js',
  'config.js',
  'seeds.js',
  'VLLOGO.png',
  'components/accounts-profile.js',
  'components/admin.js',
  'components/app-shell.js',
  'components/feed.js',
  'components/forum.js',
  'components/jobs.js',
  'components/layout-modals.js',
  'components/map-pins.js',
  'components/marketplace.js',
  'components/meetups.js',
  'components/messaging.js',
  'components/shared-ui.js',
  'components/tribes.js',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
  'https://unpkg.com/lucide@latest'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching App Shell...');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event (Cache-First strategy for static assets, Cache-then-Network for tiles)
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Handle tile caching specially
  if (url.includes('/MapServer/tile/')) {
    e.respondWith(
      caches.open('vanlyfa-tiles-cache').then((cache) => {
        return cache.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Return cached tile, but fetch new one in background to keep updated
            fetch(e.request).then((networkResponse) => {
              if (networkResponse.status === 200) {
                cache.put(e.request, networkResponse);
              }
            }).catch(() => {/* ignore offline error */});
            return cachedResponse;
          }
          return fetch(e.request).then((networkResponse) => {
            if (networkResponse.status === 200) {
              cache.put(e.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Fallback for missing tile offline: transparent 1px PNG
            return new Response(
              'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
              { headers: { 'Content-Type': 'image/png', 'Cache-Control': 'no-store' } }
            );
          });
        });
      })
    );
    return;
  }

  // Default Shell cache handling
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(e.request).then((networkResponse) => {
        // Cache dynamic GET requests
        if (e.request.method === 'GET' && !url.startsWith('chrome-extension') && !url.includes('sockjs')) {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, networkResponse.clone());
            return networkResponse;
          });
        }
        return networkResponse;
      }).catch(() => {
        // Offline fallback if needed
        if (e.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});

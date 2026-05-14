const CACHE_NAME = 'etuconnect-v1';
const STATIC_ASSETS = [
  '/EtuConnect-/',
  '/EtuConnect-/index.html',
  '/EtuConnect-/manifest.json'
];

// Install - cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch - network first, cache fallback
self.addEventListener('fetch', event => {
  // Skip Supabase requests - always need network
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache when offline
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // Return app shell for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/EtuConnect-/index.html');
          }
        });
      })
  );
});

// Push notifications
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  event.waitUntil(
    self.registration.showNotification(data.title || 'ÉtuConnect', {
      body: data.body || 'Tu as une nouvelle notification',
      icon: '/EtuConnect-/icon-192.png',
      badge: '/EtuConnect-/icon-192.png',
      tag: 'etuconnect-notif',
      renotify: true
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/EtuConnect-/')
  );
});

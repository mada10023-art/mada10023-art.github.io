// Real offline caching service worker for البركة ستور.
const CACHE_NAME = 'albaraka-store-v2';
const CORE_ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

// On install: pre-cache the core app files (same-origin, always safe).
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS))
      .catch(() => {}) // don't block install if one asset fails
  );
});

// On activate: drop old cache versions.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// On every request: try the network, save a copy to cache, and if the
// network fails (offline), serve the last cached copy instead.
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          // ok = normal same-origin success, opaque = cross-origin CDN scripts/fonts
          if (response.ok || response.type === 'opaque') {
            cache.put(event.request, copy);
          }
        });
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached => cached || caches.match('./index.html'))
      )
  );
});

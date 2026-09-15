// ============================================================
// SERVICE WORKER — VeriBuild PWA
// ============================================================

const CACHE_VERSION = 'v2'; // bump this when you deploy breaking changes
const CACHE_NAME = `veribuild-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline';

// Precache only what's essential for the app shell
const PRECACHE_URLS = [
  '/',
  OFFLINE_URL,
  '/manifest.json',
];

// ============================================================
// INSTALL — precache the app shell
// ============================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual adds so one failure doesn't kill the install
      return Promise.all(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Failed to precache:', url, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

// ============================================================
// ACTIVATE — clean up old caches
// ============================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      )
    )
  );
  self.clients.claim();
});

// ============================================================
// FETCH — smart caching
// ============================================================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle GET
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // Skip API routes entirely
  if (url.pathname.startsWith('/api/')) return;

  // Skip Next.js internals and hot reload in dev
  if (url.pathname.startsWith('/_next/')) return;

  // Skip uploads / large files
  if (url.pathname.startsWith('/uploads/')) return;

  // Strategy:
  // - HTML documents: network-first (so updates show up immediately)
  // - Static assets (images, fonts, css, js): cache-first (fast + offline-friendly)
  const isHTML =
    request.headers.get('accept')?.includes('text/html') ?? false;

  if (isHTML) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Offline — try cache, then offline page
          return caches.match(request).then((cached) => {
            return cached || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Static assets: cache-first
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request)
        .then((response) => {
          // Don't cache non-successful or opaque responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => {
          // Offline and not cached — return offline page for navigations
          return caches.match(OFFLINE_URL);
        });
    })
  );
});

// ===== sw.js — Chile Arrival Service Worker =====
const APP_VERSION   = 'chile-arrival-v1.1.0';
const STATIC_CACHE  = `${APP_VERSION}-static`;
const DYNAMIC_CACHE = `${APP_VERSION}-dynamic`;
const API_CACHE     = `${APP_VERSION}-api`;

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/firebase-config.js',
  '/icons/icon-180x180.png',
  '/icons/icon-32x32.png'
];

const API_ORIGINS = [
  'sheets.googleapis.com',
  'api.exchangerate-api.com',
  'mindicador.cl',
  'script.google.com'
];

// CDNs externos — se manejan con staleWhileRevalidate, no se precachean
const EXTERNAL_CDN_ORIGINS = [
  'cdn.tailwindcss.com',
  'cdnjs.cloudflare.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com'
];

// ===== INSTALL =====
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('📦 SW: Precacheando assets estáticos...');
        return Promise.allSettled(                        // ← Fix S2 ✅
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err =>
              console.warn(`SW: No se pudo cachear ${url}:`, err)
            )
          )
        );
      })
      .then(() => {
        console.log('✅ SW: Instalación completa');
        return self.skipWaiting();
      })
  );
});

// ===== ACTIVATE =====
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name =>                              // ← Fix S3 ✅
              name.startsWith('chile-arrival-') &&
              name !== STATIC_CACHE &&
              name !== DYNAMIC_CACHE &&
              name !== API_CACHE
            )
            .map(name => {
              console.log('🗑️ SW: Eliminando cache viejo:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('✅ SW: Activado y listo');
        return self.clients.claim();
      })
  );
});

// ===== FETCH =====
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  if (API_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(networkFirstStrategy(request, API_CACHE, 8000));
    return;
  }                                                      // ← Fix S1 ✅
  // CDNs externos — stale while revalidate, sin bloquear instalación
  if (EXTERNAL_CDN_ORIGINS.some(origin => url.hostname.includes(origin))) {
    event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
    return;
  }
  if (url.origin === self.location.origin) {
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
    return;
  }                                                      // ← Fix S1 ✅

  event.respondWith(staleWhileRevalidate(request, DYNAMIC_CACHE));
});

// ===== ESTRATEGIA: Network First =====
async function networkFirstStrategy(request, cacheName, timeoutMs = 8000) {
  const cache = await caches.open(cacheName);
  try {
    const networkPromise = fetch(request.clone());
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout')), timeoutMs)
    );
    const response = await Promise.race([networkPromise, timeoutPromise]);
    if (response && response.ok) {
      cache.put(request, response.clone());
      return response;
    }                                                    // ← Fix S1 ✅
    throw new Error(`HTTP ${response?.status}`);
  } catch (error) {
    console.warn('SW: Red falló, usando caché para:', request.url);
    const cached = await cache.match(request);
    if (cached) return cached;
    return offlineFallback(request);
  }                                                      // ← Fix S1 ✅
}

// ===== ESTRATEGIA: Cache First =====
async function cacheFirstStrategy(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request.clone());
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    console.warn('SW: Cache miss y red falló:', request.url);
    return offlineFallback(request);
  }                                                      // ← Fix S1 ✅
}

// ===== ESTRATEGIA: Stale While Revalidate =====
async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkFetch = fetch(request.clone())
    .then(response => {
      if (response && response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || new Response('', { status: 503 }));
  return cached || networkFetch;
}                                                 // ← Fix S1 ✅

// ===== FALLBACK OFFLINE =====
function offlineFallback(request) {
  const url = new URL(request.url);
  if (
    request.headers.get('accept')?.includes('application/json') ||
    url.hostname.includes('googleapis') ||
    url.hostname.includes('exchangerate') ||
    url.hostname.includes('mindicador')
  ) {
    return new Response(
      JSON.stringify({ offline: true, values: [], rates: {} }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }                                                      // ← Fix S1 ✅
  if (request.headers.get('accept')?.includes('text/html')) {
    return caches.match('/index.html');
  }                                                      // ← Fix S1 ✅
  return new Response('Offline', { status: 503 });
}

// ===== BACKGROUND SYNC =====
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncPendingReports());
  }
});

async function syncPendingReports() {
  try {
    const clients = await self.clients.matchAll();
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_REPORTS',
        message: 'Sincronizando reportes pendientes...'
      });
    });
  } catch (error) {
    console.error('SW: Error en background sync:', error);
  }
}

// ===== MENSAJES DESDE LA APP =====
self.addEventListener('message', event => {
  if (event.data?.type === 'CLEAR_API_CACHE') {
    caches.delete(API_CACHE).then(() => {
      event.ports[0]?.postMessage({ success: true });
      console.log('🗑️ SW: Cache de API limpiado');
    });
  }
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

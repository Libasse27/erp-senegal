/* Service Worker — ERP GesCom Sénégal */
const CACHE_NAME = 'erp-senegal-v1';

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
];

// ── Install : précacher les assets critiques ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate : supprimer les anciens caches ───────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch : stratégie selon le type de requête ───────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Ignorer les requêtes non-GET et les extensions de navigateur
  if (request.method !== 'GET') return;
  if (!request.url.startsWith('http')) return;

  const url = new URL(request.url);

  // Appels API : network-first avec fallback cache
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Assets statiques React build : cache-first
  if (url.pathname.startsWith('/static/') || request.destination === 'script' || request.destination === 'style') {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Images et icônes : cache-first
  if (request.destination === 'image' || url.pathname.match(/\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Navigation HTML : network-first, offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
    return;
  }
});

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 408 });
  }
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(
      JSON.stringify({ success: false, message: 'Hors ligne — données non disponibles' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

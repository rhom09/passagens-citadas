/* eslint-disable no-restricted-globals */
// Service Worker manual para Passagens Citadas
// Versão dos caches
const SHELL_CACHE = 'passagens-shell-v1';
const DATA_CACHE = 'passagens-data-v1';

// Recursos essenciais do shell para precache
const PRECACHE_RESOURCES = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-192-maskable.png',
  '/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  // Força o SW novo a se tornar ativo imediatamente
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_RESOURCES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  // Limpa caches antigos se houver mudança de versão
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== SHELL_CACHE && cacheName !== DATA_CACHE) {
              return caches.delete(cacheName);
            }
            return null;
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Não interceptar requisições não-GET
  if (request.method !== 'GET') {
    return;
  }

  // 2. Rotas de API e conexões externas: SEMPRE rede
  if (url.pathname.startsWith('/api/') || url.origin !== self.location.origin) {
    return;
  }

  // 3. Dados Bíblicos da ARC (/data/arc.v1.json): Cache-First, versionado
  if (url.pathname.startsWith('/data/')) {
    event.respondWith(
      caches.open(DATA_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        try {
          const networkResponse = await fetch(request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        } catch (error) {
          throw error;
        }
      })
    );
    return;
  }

  // 4. Recursos estáticos do Next.js (/_next/static/*): Cache-first (são imutáveis e possuem hash)
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.open(SHELL_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          return cachedResponse;
        }

        const networkResponse = await fetch(request);
        if (networkResponse && networkResponse.status === 200) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
    );
    return;
  }

  // 5. Navegação e páginas HTML: Stale-While-Revalidate ou Network-first com fallback para cache
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(SHELL_CACHE).then((cache) => cache.put(request, responseClone));
          }
          return networkResponse;
        })
        .catch(async () => {
          // Se estiver offline, retorna do cache
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Fallback para a raiz se a rota não estiver em cache
          return caches.match('/');
        })
    );
    return;
  }

  // 6. Demais recursos: Network com fallback para cache
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseClone = networkResponse.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, responseClone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(request))
  );
});

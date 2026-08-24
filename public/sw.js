// Selano — Service Worker
// Strategy:
//   HTML  : network-first, cache fallback (so users always get the newest
//           HTML if online — the HTML references the freshest JS bundle).
//   Assets: STALE-WHILE-REVALIDATE — return cached immediately, refetch in
//           background. This avoids the "black screen" bug where an old
//           cached HTML pointed to a stale JS filename that no longer exists.
//   On install: purge every previous cache so a version bump cleans up
//   the moment the new SW activates.
//
// !!! IMPORTANT !!!
// Bump CACHE_NAME on every deploy that could break older cached assets.
// The activate handler wipes every cache whose name != current one.
const CACHE_NAME = 'selano-v6-2026-08-24'

const BASE = new URL(self.registration?.scope || './', self.location.href).pathname
const OFFLINE_FALLBACK = BASE
const CORE_ASSETS = [BASE, BASE + 'manifest.webmanifest']

self.addEventListener('install', (event) => {
  // Fetch fresh core assets, don't lean on any previous cache
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      // Purge every cache except the current one
      const names = await caches.keys()
      await Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
      await self.clients.claim()
      // Ask every open page to reload once so it picks up the new version.
      // (Skipped on first-ever install — only fires when a NEW SW replaces
      // an EXISTING one, which is the exact case where users get stuck.)
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      for (const client of clients) {
        try { client.postMessage({ type: 'HFOS_SW_UPDATED' }) } catch {}
      }
    })()
  )
})

// Explicit skip-waiting from the page (when the page asks the waiting SW to activate)
self.addEventListener('message', (event) => {
  if (event.data?.type === 'HFOS_SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // HTML — network-first (always try to get the latest index.html)
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request, { cache: 'no-store' })
        .then((res) => {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(request, clone)).catch(() => {})
          return res
        })
        .catch(() => caches.match(request).then(m => m || caches.match(OFFLINE_FALLBACK)))
    )
    return
  }

  // Immutable large assets (the pose model) — cache-first, never revalidate.
  // The model is ~5.8 MB and its contents never change for a given filename,
  // so stale-while-revalidate would re-download it in the background on every
  // single technique analysis. Cache-first means one download, ever.
  if (url.pathname.includes('/mediapipe/')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached
        return fetch(request).then((res) => {
          if (res && res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then(c => c.put(request, clone)).catch(() => {})
          }
          return res
        })
      })
    )
    return
  }

  // Assets — stale-while-revalidate. Return cache immediately if we have it,
  // and refetch in background so the next load is fresh.
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res && res.ok) {
            const clone = res.clone()
            caches.open(CACHE_NAME).then(c => c.put(request, clone)).catch(() => {})
          }
          return res
        })
        .catch(() => cached)
      return cached || network
    })
  )
})

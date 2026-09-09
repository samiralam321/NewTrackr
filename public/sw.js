// Trackr PWA Service Worker
// Version: 1.0.0
const CACHE_NAME = 'trackr-static-v1'
const OFFLINE_URL = '/offline'

// Safe, non-sensitive static assets to precache on install
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/manifest.json'
]

// 1. Install Event: Cache offline fallback and shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    }).then(() => {
      // Allow new service worker to wait until user confirms update or activates
      return self.skipWaiting()
    })
  )
})

// 2. Activate Event: Clean up stale caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// 3. Fetch Event: Strict, secure caching rules
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // RULE 1: Never intercept non-GET requests (mutations, posts, uploads, comments)
  if (request.method !== 'GET') {
    return
  }

  // RULE 2: STRICT BYPASS for Supabase auth, APIs, webhooks, and authenticated calls
  // Absolutely no caching of tokens, user sessions, or database API queries
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in')
  ) {
    return
  }

  // RULE 3: Navigation requests (HTML page visits) -> Network-first with /offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(OFFLINE_URL).then((cachedOffline) => {
          if (cachedOffline) return cachedOffline
          // Fallback response if cache is missing
          return new Response(
            '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - Trackr</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#0B0A10;color:#fff;text-align:center;padding:20px}button{background:#7C3AED;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;margin-top:16px}</style></head><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="window.location.reload()">Retry</button></body></html>',
            { headers: { 'Content-Type': 'text/html' } }
          )
        })
      })
    )
    return
  }

  // RULE 4: Static assets (Next.js immutable bundles, icons, images) -> Stale-While-Revalidate
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2')

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch updated version in background to refresh cache
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse))
            }
          }).catch(() => {})
          return cachedResponse
        }

        // Not in cache, fetch from network and cache
        return fetch(request).then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse
          }
          const responseToCache = networkResponse.clone()
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache)
          })
          return networkResponse
        })
      })
    )
    return
  }
})

// 4. Message Event: Safe update trigger
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

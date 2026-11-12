// Trackr PWA Service Worker
// Version: 2.5.0 - Zero-Blink Hero & Cache-First Static Engine
const CACHE_NAME = 'trackr-v2.5'
const OFFLINE_URL = '/offline'

// Precache essential offline fallback and critical hero assets
const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/hero-bg.webp',
  '/logo.png',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/icon-maskable-512x512.png',
  '/apple-touch-icon.png',
  '/manifest.json'
]

// 1. Install Event: Skip waiting immediately to activate latest build
self.addEventListener('install', (event) => {
  self.skipWaiting()
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS)
    })
  )
})

// 2. Activate Event: Purge all stale caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Wiping obsolete cache:', key)
            return caches.delete(key)
          }
        })
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// 3. Fetch Event: Network-First strategy to ensure mobile devices always get latest UI
self.addEventListener('fetch', (event) => {
  const request = event.request
  const url = new URL(request.url)

  // RULE 1: Never intercept non-GET requests (mutations, uploads, posts)
  if (request.method !== 'GET') {
    return
  }

  // RULE 2: STRICT BYPASS for API, Auth, and Supabase database requests
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/auth/') ||
    url.hostname.includes('supabase.co') ||
    url.hostname.includes('supabase.in')
  ) {
    return
  }

  // RULE 3: Navigation requests (HTML page visits) -> Network-first with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          return response
        })
        .catch(() => {
          return caches.match(OFFLINE_URL).then((cachedOffline) => {
            if (cachedOffline) return cachedOffline
            return new Response(
              '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Offline - Trackr</title><style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;background:#0B0A10;color:#fff;text-align:center;padding:20px}button{background:#7C3AED;color:#fff;border:none;padding:12px 24px;border-radius:12px;font-weight:bold;cursor:pointer;margin-top:16px}</style></head><body><h1>You are offline</h1><p>Please check your internet connection and try again.</p><button onclick="window.location.reload()">Retry</button></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            )
          })
        })
    )
    return
  }

  // RULE 4: Next.js Static Assets, Hero Media & Fonts -> Cache-First with Background Revalidation
  // Delivers instant (0ms) zero-blink local rendering from CacheStorage on every refresh
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/hero-bg.webp' ||
    url.pathname.startsWith('/icon-') ||
    url.pathname === '/logo.png' ||
    url.pathname === '/apple-touch-icon.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.webp') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.woff2')

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve instantly from cache without waiting for network
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse))
            }
          }).catch(() => {})
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const copy = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy))
          }
          return networkResponse
        })
      })
    )
    return
  }
})

// 4. Message Event: Instant trigger to force update
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

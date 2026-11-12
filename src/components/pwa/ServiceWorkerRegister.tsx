'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

const APP_BUILD_ID = 'trackr_v2.5_zero_blink_hero'

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    // 1. Invalidate legacy CacheStorage on mobile devices if old build is detected
    try {
      const storedBuild = localStorage.getItem('trackr_last_build_id')
      if (storedBuild !== APP_BUILD_ID) {
        localStorage.setItem('trackr_last_build_id', APP_BUILD_ID)
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((k) => {
              if (k !== 'trackr-v2.5') {
                caches.delete(k)
              }
            })
          })
        }
      }
    } catch (e) {
      // Ignore storage errors in restricted webviews
    }

    // 2. Auto-reload when new service worker takes control
    let isRefreshing = false
    const onControllerChange = () => {
      if (!isRefreshing) {
        isRefreshing = true
        window.location.reload()
      }
    }
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange)

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        setRegistration(reg)

        // Force an immediate check for a new service worker from the server
        reg.update().catch(() => {})

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // Prompt user or automatically activate
                  setUpdateAvailable(true)
                  // Tell new worker to skip waiting and activate
                  installingWorker.postMessage({ type: 'SKIP_WAITING' })
                }
              }
            })
          }
        })
      } catch (err) {
        console.debug('PWA Service Worker registration skipped:', err)
      }
    }

    registerSW()

    // 3. Re-check for updates whenever user switches back into the app on Android
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible' && registration) {
        registration.update().catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [registration])

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  if (!updateAvailable) {
    return null
  }

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[100] w-[92%] max-w-sm bg-white dark:bg-[#1A1A24] border border-violet-300 dark:border-violet-700/60 rounded-2xl p-3 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="flex flex-col min-w-0">
        <span className="text-xs font-bold text-gray-900 dark:text-white truncate">
          New Version Available ✨
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
          Tap to load the latest features.
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={handleUpdate}
          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1 shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Update
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

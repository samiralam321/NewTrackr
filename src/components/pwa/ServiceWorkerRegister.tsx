'use client'

import { useEffect, useState } from 'react'
import { RefreshCw, X } from 'lucide-react'

export function ServiceWorkerRegister() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return
    }

    const registerSW = async () => {
      try {
        const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        setRegistration(reg)

        // Listen for new service worker installation
        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (
                installingWorker.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                // New content is available and will be used when all tabs are closed or updated
                setUpdateAvailable(true)
              }
            })
          }
        })
      } catch (err) {
        // Silently catch registration errors in dev/unsupported contexts
        console.debug('PWA Service Worker registration skipped:', err)
      }
    }

    // Register immediately on mount in the client
    registerSW()
  }, [])

  const handleUpdate = () => {
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
    // Reload page to activate new service worker
    window.location.reload()
  }

  if (!updateAvailable) {
    return null
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-sm bg-white dark:bg-[#1A1A24] border border-violet-200 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-gray-900 dark:text-white">
          Update Available ✨
        </span>
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          A new version of Trackr is ready.
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleUpdate}
          className="px-3 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          Update
        </button>
        <button
          onClick={() => setUpdateAvailable(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
          aria-label="Dismiss update banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

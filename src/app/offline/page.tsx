'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false)
  const [isOnline, setIsOnline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      // Auto-reload to restore user's previous page when connection returns
      window.location.reload()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = () => {
    setIsRetrying(true)
    if (navigator.onLine) {
      window.location.reload()
    } else {
      setTimeout(() => {
        setIsRetrying(false)
      }, 1000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F7FF] dark:bg-[#0B0A10] text-gray-900 dark:text-white transition-colors">
      <div className="max-w-md w-full bg-white dark:bg-[#1A1A24] rounded-3xl p-8 shadow-xl border border-violet-100 dark:border-[#2D2B3B] text-center flex flex-col items-center">
        {/* Animated Offline Icon */}
        <div className="w-20 h-20 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-6 shadow-sm ring-8 ring-violet-50/50 dark:ring-violet-950/20">
          <WifiOff className="w-10 h-10 animate-pulse" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-tight mb-3">
          You're Offline
        </h1>
        
        <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
          It looks like you've lost your internet connection. Check your network or Wi-Fi to keep tracking your daily progress.
        </p>

        {isOnline && (
          <div className="mb-4 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400">
            Connection restored! Reloading...
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="flex-1 inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm shadow-md hover:shadow-violet-500/20 active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
            <span>{isRetrying ? 'Checking...' : 'Try Again'}</span>
          </button>
          
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gray-100 dark:bg-[#2D2B3B] hover:bg-gray-200 dark:hover:bg-[#38354A] text-gray-700 dark:text-gray-200 font-semibold text-sm transition-all active:scale-[0.98]"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </div>
    </div>
  )
}

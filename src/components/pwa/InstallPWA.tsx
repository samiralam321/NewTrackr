'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/lib/hooks/use-pwa'
import { Download, Share, PlusSquare, X, Smartphone, Sparkles } from 'lucide-react'

const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

export function InstallPWA() {
  const { isMounted, isStandalone, isIOS, canInstall, promptInstall } = usePWA()
  const [isDismissed, setIsDismissed] = useState(true)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    if (!isMounted) return

    // If running inside standalone app, do not show any install prompts
    if (isStandalone) {
      setIsDismissed(true)
      return
    }

    // Check if dismissed recently
    const dismissedAt = localStorage.getItem('trackr_pwa_dismissed')
    if (dismissedAt) {
      const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10)
      if (timeSinceDismiss < DISMISS_DURATION_MS) {
        setIsDismissed(true)
        return
      }
    }

    // Allow prompt to show after a 3 second delay for non-intrusive onboarding
    const timer = setTimeout(() => {
      setIsDismissed(false)
    }, 3000)

    return () => clearTimeout(timer)
  }, [isMounted, isStandalone])

  const handleDismiss = () => {
    setIsDismissed(true)
    setShowIOSGuide(false)
    try {
      localStorage.setItem('trackr_pwa_dismissed', Date.now().toString())
    } catch {
      // Ignore localStorage write errors
    }
  }

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true)
      return
    }

    if (canInstall) {
      setIsInstalling(true)
      try {
        const installed = await promptInstall()
        if (installed) {
          setIsDismissed(true)
        }
      } finally {
        setIsInstalling(false)
      }
    }
  }

  // Do not render anything if not mounted, already standalone, dismissed, or unsupported
  if (!isMounted || isStandalone || isDismissed) {
    return null
  }

  // Only show if can install via prompt or on iOS
  if (!canInstall && !isIOS) {
    return null
  }

  return (
    <>
      {/* 1. Main Install Promotion Card (Bottom floating toast) */}
      <aside
        aria-label="Install App"
        className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 bg-white/95 dark:bg-[#1A1A24]/95 backdrop-blur-md border border-violet-200 dark:border-[#2D2B3B] rounded-3xl p-4 shadow-2xl shadow-violet-900/10 dark:shadow-black/50 animate-in fade-in slide-in-from-bottom-6 duration-300 transition-all"
      >
        <div className="flex items-start gap-3.5">
          {/* App Logo */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 shrink-0 flex items-center justify-center shadow-md shadow-violet-500/20">
            <img src="/logo.png" alt="Trackr" className="w-full h-full object-contain drop-shadow" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                Install Trackr App
              </h3>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 leading-relaxed">
              Add to your home screen for fast daily streak tracking & offline access.
            </p>

            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                disabled={isInstalling}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold transition-all shadow-sm shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isIOS ? <Smartphone className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{isIOS ? 'How to Install' : isInstalling ? 'Installing...' : 'Install App'}</span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2D2B3B] transition-colors cursor-pointer"
              >
                Not Now
              </button>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. iOS Safari Step-by-Step Installation Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-3xl p-6 shadow-2xl border border-violet-100 dark:border-[#2D2B3B] flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    Install on iPhone / iPad
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">3 simple steps to add Trackr</p>
                </div>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                aria-label="Close iOS guide"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <ol className="space-y-3 my-2 text-xs text-gray-700 dark:text-gray-300">
              <li className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B]">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <span className="font-semibold block text-gray-900 dark:text-white">Tap the Share button</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                    Look for <Share className="w-3.5 h-3.5 text-violet-600 inline mx-0.5" /> in your Safari bottom toolbar.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B]">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <span className="font-semibold block text-gray-900 dark:text-white">Select "Add to Home Screen"</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                    Scroll down and tap <PlusSquare className="w-3.5 h-3.5 text-violet-600 inline mx-0.5" /> Add to Home Screen.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B]">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <span className="font-semibold block text-gray-900 dark:text-white">Tap "Add" in top-right</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 block">
                    Confirm by tapping Add. Trackr icon will now appear on your home screen!
                  </span>
                </div>
              </li>
            </ol>

            <button
              onClick={handleDismiss}
              className="w-full py-3 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs shadow-md shadow-violet-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              Got It
            </button>
          </div>
        </div>
      )}
    </>
  )
}

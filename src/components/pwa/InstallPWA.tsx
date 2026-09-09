'use client'

import { useState, useEffect } from 'react'
import { usePWA } from '@/lib/hooks/use-pwa'
import { Download, Share, PlusSquare, X, Smartphone, Sparkles, MoreVertical } from 'lucide-react'

const DISMISS_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export function InstallPWA() {
  const { isMounted, isStandalone, isIOS, isAndroid, canInstall, promptInstall } = usePWA()
  const [isVisible, setIsVisible] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [showAndroidGuide, setShowAndroidGuide] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    if (!isMounted) return

    // If running inside installed standalone app, do not show install prompt
    if (isStandalone) {
      setIsVisible(false)
      return
    }

    // Check if dismissed within the last 24h
    try {
      const dismissedAt = localStorage.getItem('trackr_pwa_dismissed')
      if (dismissedAt) {
        const timeSinceDismiss = Date.now() - parseInt(dismissedAt, 10)
        if (timeSinceDismiss < DISMISS_DURATION_MS) {
          setIsVisible(false)
          return
        }
      }
    } catch {
      // Ignore localStorage errors
    }

    // Show floating card smoothly after 1.5 seconds
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 1500)

    return () => clearTimeout(timer)
  }, [isMounted, isStandalone])

  const handleDismiss = () => {
    setIsVisible(false)
    setShowIOSGuide(false)
    setShowAndroidGuide(false)
    try {
      localStorage.setItem('trackr_pwa_dismissed', Date.now().toString())
    } catch {
      // Ignore
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
          setIsVisible(false)
        }
      } finally {
        setIsInstalling(false)
      }
    } else if (isAndroid) {
      // If browser hasn't fired beforeinstallprompt yet or requires menu action
      setShowAndroidGuide(true)
    } else {
      // Fallback for other browsers
      setShowAndroidGuide(true)
    }
  }

  // Never render if not mounted or already running in standalone mode
  if (!isMounted || isStandalone || !isVisible) {
    return null
  }

  return (
    <>
      {/* 1. Floating Install Banner (Visible on Android, iOS & Desktop browsers) */}
      <aside
        aria-label="Install App"
        className="fixed bottom-20 md:bottom-6 right-3 left-3 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white/98 dark:bg-[#1A1A24]/98 backdrop-blur-md border border-violet-200 dark:border-[#2D2B3B] rounded-3xl p-4 shadow-2xl shadow-violet-900/15 dark:shadow-black/60 animate-in fade-in slide-in-from-bottom-6 duration-300 transition-all"
      >
        <div className="flex items-start gap-3.5">
          {/* Trackr App Icon */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-2 shrink-0 flex items-center justify-center shadow-md shadow-violet-500/20">
            <img src="/logo.png" alt="Trackr Logo" className="w-full h-full object-contain drop-shadow" />
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
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs font-bold transition-all shadow-md shadow-violet-500/20 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isIOS ? (
                  <Smartphone className="w-3.5 h-3.5" />
                ) : (
                  <Download className="w-3.5 h-3.5" />
                )}
                <span>
                  {isIOS
                    ? 'How to Install'
                    : isInstalling
                    ? 'Installing...'
                    : 'Install App'}
                </span>
              </button>

              <button
                onClick={handleDismiss}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2D2B3B] transition-colors cursor-pointer"
              >
                Not Now
              </button>
            </div>
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="absolute top-3.5 right-3.5 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* 2. Android Chrome Installation Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-3xl p-6 shadow-2xl border border-violet-100 dark:border-[#2D2B3B] flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-gray-900 dark:text-white">
                    Install on Android
                  </h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Add Trackr directly from Chrome</p>
                </div>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg cursor-pointer"
                aria-label="Close guide"
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
                  <span className="font-semibold block text-gray-900 dark:text-white">Tap the Chrome Menu</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                    Tap the <MoreVertical className="w-3.5 h-3.5 text-violet-600 inline mx-0.5" /> three dots icon in the top-right of Chrome.
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B]">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <span className="font-semibold block text-gray-900 dark:text-white">Select "Install app"</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] flex items-center gap-1 mt-0.5">
                    Tap <Download className="w-3.5 h-3.5 text-violet-600 inline mx-0.5" /> <strong>Install app</strong> (or "Add to Home screen").
                  </span>
                </div>
              </li>

              <li className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B]">
                <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <span className="font-semibold block text-gray-900 dark:text-white">Confirm Installation</span>
                  <span className="text-gray-500 dark:text-gray-400 text-[11px] mt-0.5 block">
                    Tap <strong>Install</strong> to add the Trackr icon directly to your home screen!
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

      {/* 3. iOS Safari Step-by-Step Installation Modal */}
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

export function InstallButton({ className = "" }: { className?: string }) {
  const { isMounted, isStandalone, isIOS, canInstall, promptInstall } = usePWA()
  const [showIOS, setShowIOS] = useState(false)
  const [showAndroid, setShowAndroid] = useState(false)

  if (!isMounted || isStandalone) return null

  const handleClick = async () => {
    if (isIOS) {
      setShowIOS(true)
      return
    }
    if (canInstall) {
      await promptInstall()
    } else {
      setShowAndroid(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={className || "flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left cursor-pointer w-full"}
      >
        <Download className="w-5 h-5 shrink-0" />
        <span>Install App</span>
      </button>

      {showAndroid && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-3xl p-6 shadow-2xl border border-violet-100 dark:border-[#2D2B3B] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">Install on Android</h4>
              <button onClick={() => setShowAndroid(false)} className="p-1.5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Tap the three dots (⋮) in Chrome's top-right corner, then select <strong>Install app</strong> or <strong>Add to Home screen</strong>.
            </p>
            <button onClick={() => setShowAndroid(false)} className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs">Got It</button>
          </div>
        </div>
      )}

      {showIOS && (
        <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A24] rounded-3xl p-6 shadow-2xl border border-violet-100 dark:border-[#2D2B3B] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-gray-900 dark:text-white">Install on iPhone / iPad</h4>
              <button onClick={() => setShowIOS(false)} className="p-1.5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Tap the <strong>Share</strong> button in Safari's toolbar, then tap <strong>Add to Home Screen</strong>.
            </p>
            <button onClick={() => setShowIOS(false)} className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-bold text-xs">Got It</button>
          </div>
        </div>
      )}
    </>
  )
}

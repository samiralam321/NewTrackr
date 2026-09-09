'use client'

import { useState, useEffect, useCallback } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

declare global {
  interface Window {
    __deferredPrompt?: BeforeInstallPromptEvent | null
    __onBeforeInstallPrompt?: ((e: BeforeInstallPromptEvent) => void) | null
  }
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isStandalone, setIsStandalone] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isAndroid, setIsAndroid] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)

    // Check standalone mode (Android, Desktop, Chrome, Edge, Safari)
    const checkStandalone = () => {
      const isDisplayStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isNavigatorStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
      return isDisplayStandalone || isNavigatorStandalone
    }

    const standaloneMode = checkStandalone()
    setIsStandalone(standaloneMode)
    if (standaloneMode) {
      setIsInstalled(true)
    }

    // Check device OS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent)
    const isAndroidDevice = /android/.test(userAgent)
    setIsIOS(isAppleDevice)
    setIsAndroid(isAndroidDevice)

    // Check if early inline script already caught beforeinstallprompt
    if (window.__deferredPrompt) {
      setDeferredPrompt(window.__deferredPrompt)
    }

    // Hook callback for inline script
    window.__onBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      setDeferredPrompt(e)
    }

    // Listen for beforeinstallprompt in standard flow
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      const promptEvent = e as BeforeInstallPromptEvent
      window.__deferredPrompt = promptEvent
      setDeferredPrompt(promptEvent)
    }

    // Listen for appinstalled
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setDeferredPrompt(null)
      window.__deferredPrompt = null
      setIsStandalone(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.__onBeforeInstallPrompt = null
    }
  }, [])

  const promptInstall = useCallback(async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || (typeof window !== 'undefined' ? window.__deferredPrompt : null)
    if (!promptEvent) {
      return false
    }

    try {
      await promptEvent.prompt()
      const choiceResult = await promptEvent.userChoice
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true)
        setDeferredPrompt(null)
        if (typeof window !== 'undefined') {
          window.__deferredPrompt = null
        }
        return true
      }
      return false
    } catch (err) {
      console.error('Error during PWA installation prompt:', err)
      return false
    }
  }, [deferredPrompt])

  return {
    isMounted,
    isStandalone,
    isIOS,
    isAndroid,
    isMobile: isIOS || isAndroid,
    isInstalled,
    canInstall: !!deferredPrompt || (typeof window !== 'undefined' && !!window.__deferredPrompt),
    promptInstall,
  }
}

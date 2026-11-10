"use client"

import React, { useState, useRef, useEffect, useCallback } from "react"

export interface ActionTooltipProps {
  label: string
  children: React.ReactNode
  delay?: number // default: 700ms (Twitter/X style)
  disabled?: boolean
  className?: string
}

export function ActionTooltip({
  label,
  children,
  delay = 700,
  disabled = false,
  className = ""
}: ActionTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const handleMouseEnter = useCallback(() => {
    if (disabled) return
    clearTimer()
    timerRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }, [clearTimer, delay, disabled])

  const handleMouseLeave = useCallback(() => {
    clearTimer()
    setIsVisible(false)
  }, [clearTimer])

  const handleDismiss = useCallback(() => {
    clearTimer()
    setIsVisible(false)
  }, [clearTimer])

  useEffect(() => {
    if (disabled) {
      clearTimer()
      setIsVisible(false)
    }
  }, [disabled, clearTimer])

  useEffect(() => {
    return () => clearTimer()
  }, [clearTimer])

  return (
    <div
      className="relative flex items-center justify-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseDown={handleDismiss}
      onTouchStart={handleDismiss}
    >
      {children}

      {isVisible && !disabled && (
        <div
          role="tooltip"
          className={`pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-1.5 px-2 py-0.5 bg-gray-900/90 dark:bg-black/90 backdrop-blur-xs text-white text-[11px] leading-tight font-medium rounded-md whitespace-nowrap shadow-md z-50 animate-in fade-in duration-150 select-none ${className}`}
        >
          {label}
        </div>
      )}
    </div>
  )
}

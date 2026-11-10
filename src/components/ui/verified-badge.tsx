'use client'

import React from 'react'
import { isUserAdmin } from '@/lib/utils/streak'

export type VerifiedBadgeProps = {
  level?: number | null | undefined
  size?: 'xs' | 'sm' | 'md' | 'lg'
  nameOrHandle?: string | null
  className?: string
  showTooltip?: boolean
  tooltipAlign?: 'center' | 'left' | 'right'
}

export function VerifiedBadge({ 
  level, 
  size = 'sm', 
  nameOrHandle, 
  className = '', 
  showTooltip = false,
  tooltipAlign = 'center'
}: VerifiedBadgeProps) {
  const isAdmin = isUserAdmin(nameOrHandle)
  const effectiveLevel = isAdmin ? 1 : (level || 0)

  if (!effectiveLevel || effectiveLevel < 1 || effectiveLevel > 3) {
    return null
  }

  // Size mapping
  const sizeClasses = {
    xs: 'w-3.5 h-3.5',
    sm: 'w-[18px] h-[18px]',
    md: 'w-5 h-5',
    lg: 'w-12 h-12',
  }

  const badgeSize = sizeClasses[size] || sizeClasses.sm

  // Details per level - Clean flat authentic Twitter/X badge without any blur glow or outer halo
  const badgeDetails = {
    1: {
      title: isAdmin ? 'Verified Admin' : 'Verified Account',
      desc: isAdmin 
        ? 'Samir Alam (@samCPer) · Trackr Creator & Admin'
        : 'Earned by posting for 5 consecutive days.',
      rosetteColor: '#1D9BF0', // Official Twitter Verified Blue
      checkColor: '#FFFFFF',
    },
    2: {
      title: 'Trackr Elite Member',
      desc: 'Earned by posting for 30 consecutive days.',
      rosetteColor: '#EAB308', // Gold
      checkColor: '#FFFFFF',
    },
    3: {
      title: 'Trackr Legend Member',
      desc: 'Earned by posting for 100 consecutive days.',
      rosetteColor: '#8B5CF6', // Purple Diamond
      checkColor: '#FFFFFF',
    },
  }

  const details = badgeDetails[effectiveLevel as 1 | 2 | 3]

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none shrink-0 ${showTooltip ? 'cursor-pointer group/badge' : ''} ${className}`}
    >
      <div className="flex items-center justify-center shrink-0 bg-transparent">
        {/* Authentic Twitter Verified Seal & Checkmark (Clean SVG, 0 outer shadow, 0 border, 0 background) */}
        <svg
          viewBox="0 0 22 22"
          aria-label={details.title}
          role="img"
          className={`${badgeSize} shrink-0 block`}
        >
          <g>
            {/* 12-lobed Scalloped Rosette Seal */}
            <path
              d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816z"
              fill={details.rosetteColor}
            />
            {/* Crisp Solid White Checkmark */}
            <path
              d="M9.662 14.85l-3.429-3.428 1.293-1.302 2.136 2.136 5.467-5.467 1.293 1.302-6.76 6.759z"
              fill={details.checkColor}
            />
          </g>
        </svg>
      </div>

      {/* Modern Tooltip - strictly scoped to direct badge hover */}
      {showTooltip && (
        <div className={`absolute bottom-full mb-2 ${
          tooltipAlign === 'right' 
            ? 'right-0 translate-x-0' 
            : tooltipAlign === 'left' 
            ? 'left-0 translate-x-0' 
            : 'left-1/2 -translate-x-1/2'
        } opacity-0 scale-95 group-hover/badge:opacity-100 group-hover/badge:scale-100 pointer-events-none transition-all duration-150 z-50`}>
          <div className="bg-gray-900 dark:bg-[#1A1A24] text-white py-1.5 px-3 rounded-xl shadow-md border border-white/10 dark:border-gray-800 text-[11px] whitespace-nowrap text-center">
            <p className="font-bold text-[#1D9BF0] flex items-center justify-center gap-1">
              <span>{details.title}</span>
            </p>
            <p className="text-gray-300 text-[10px] font-normal mt-0.5">{details.desc}</p>
            <div className={`absolute top-full ${
              tooltipAlign === 'right'
                ? 'right-2 translate-x-0'
                : tooltipAlign === 'left'
                ? 'left-2 translate-x-0'
                : 'left-1/2 -translate-x-1/2'
            } border-4 border-transparent border-t-gray-900 dark:border-t-[#1A1A24]`} />
          </div>
        </div>
      )}
    </div>
  )
}

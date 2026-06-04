'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

export type VerifiedBadgeProps = {
  level: number | null | undefined
  size?: 'sm' | 'md' | 'lg'
}

export function VerifiedBadge({ level, size = 'sm' }: VerifiedBadgeProps) {
  const [hovered, setHovered] = useState(false)

  if (!level || level < 1 || level > 3) return null

  // Size mapping
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  }

  const badgeSize = sizeClasses[size]

  // Details per level
  const badgeDetails = {
    1: {
      title: 'Trackr Verified Member',
      desc: 'Earned by posting for 5 consecutive days.',
      gradientId: 'blueGrad',
      gradient: (
        <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      ),
      glow: 'shadow-[0_0_8px_rgba(59,130,246,0.5)]',
    },
    2: {
      title: 'Trackr Elite Member',
      desc: 'Earned by posting for 30 consecutive days.',
      gradientId: 'goldGrad',
      gradient: (
        <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE047" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
      ),
      glow: 'shadow-[0_0_8px_rgba(234,179,8,0.5)]',
    },
    3: {
      title: 'Trackr Legend Member',
      desc: 'Earned by posting for 100 consecutive days.',
      gradientId: 'diamondGrad',
      gradient: (
        <linearGradient id="diamondGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="50%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      ),
      glow: 'shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse',
    },
  }

  const details = badgeDetails[level as 1 | 2 | 3]

  // Animation variants
  const getAnimation = (): any => {
    if (level === 3) {
      // Continuous gentle pulse & breathing for Diamond
      return {
        scale: hovered ? 1.25 : [1, 1.06, 1],
        rotate: hovered ? 360 : 0,
        transition: {
          scale: hovered ? { duration: 0.2 } : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' },
          rotate: { duration: 0.5, ease: 'easeOut' },
        },
      }
    }
    // Standard spring scale for Gold & Blue
    return {
      scale: hovered ? 1.2 : 1,
      rotate: hovered ? 15 : 0,
      transition: { type: 'spring', stiffness: 300, damping: 12 },
    }
  }

  return (
    <div
      className="relative inline-flex items-center justify-center cursor-pointer select-none group vertical-middle shrink-0"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <motion.div
        animate={getAnimation()}
        className={`rounded-full flex items-center justify-center ${details.glow} transition-shadow duration-300`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`${badgeSize} fill-current`}
          style={{
            color: `url(#${details.gradientId})`,
            filter: level === 2 ? 'drop-shadow(0 0 2px rgba(250, 204, 21, 0.4))' : undefined,
          }}
        >
          <defs>{details.gradient}</defs>
          {/* Twitter-like verification badge wavy seal path */}
          <path d="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.17-2.9-.81-3.88-.98-.98-2.49-1.27-3.88-.81C14.67 2.66 13.43 1.75 12 1.75s-2.67.91-3.37 2.22c-1.39-.46-2.9-.17-3.88.81-.98.98-1.27 2.49-.81 3.88C2.66 9.33 1.75 10.57 1.75 12s.91 2.67 2.22 3.37c-.46 1.39-.17 2.9.81 3.88.98.98 2.49 1.27 3.88.81.7 1.31 1.94 2.22 3.37 2.22s2.67-.91 3.37-2.22c1.39.46 2.9.17 3.88-.81.98-.98 1.27-2.49.81-3.88 1.31-.7 2.22-1.94 2.22-3.37zM10.85 16.5l-3.5-3.5 1.41-1.41 2.09 2.09 5.68-5.68 1.41 1.41-7.09 7.09z" />
        </svg>

        {/* Shine sweeping effect for Gold level */}
        {level === 2 && (
          <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
            <div className="w-[300%] h-[300%] bg-gradient-to-tr from-transparent via-white/50 to-transparent rotate-45 absolute -top-[100%] -left-[100%] transition-transform duration-1000 group-hover:translate-x-[50%] group-hover:translate-y-[50%]" />
          </div>
        )}
      </motion.div>

      {/* Modern custom Tooltip */}
      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 pointer-events-none transition-all duration-200 z-50">
        <div className="bg-gray-900/95 dark:bg-[#1A1A24]/95 text-white p-2.5 rounded-xl shadow-xl border border-white/10 dark:border-gray-800 text-[11px] w-48 text-center backdrop-blur-md">
          <p className="font-extrabold text-violet-400 mb-0.5 tracking-wide uppercase text-[9px]">{details.title}</p>
          <p className="text-gray-300 font-medium leading-normal">{details.desc}</p>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-top-gray-900 dark:border-top-[#1A1A24]" />
        </div>
      </div>
    </div>
  )
}

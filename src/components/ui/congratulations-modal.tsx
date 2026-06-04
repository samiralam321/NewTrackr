'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { VerifiedBadge } from '@/components/ui/verified-badge'

export function CongratulationsModal() {
  const [isOpen, setIsOpen] = useState(false)
  const [level, setLevel] = useState<number>(0)
  const [streak, setStreak] = useState<number>(0)

  useEffect(() => {
    const handleBadgeEarned = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        setLevel(customEvent.detail.level)
        setStreak(customEvent.detail.streak)
        setIsOpen(true)
      }
    }

    window.addEventListener('badge-earned', handleBadgeEarned)
    return () => {
      window.removeEventListener('badge-earned', handleBadgeEarned)
    }
  }, [])

  if (!isOpen || level < 1 || level > 3) return null

  const details = {
    1: {
      title: '🎉 Congratulations!',
      msg: 'You stayed consistent for 5 days.',
      sub: 'You have earned the Trackr Blue Tick Verification Badge.',
      next: 'Keep posting daily to unlock the Golden Tick at 30 days.',
      gradient: 'from-blue-500/20 to-indigo-500/20',
      badgeColor: 'text-blue-500',
    },
    2: {
      title: '🏆 Amazing Consistency!',
      msg: 'You completed a 30-day streak.',
      sub: 'You have unlocked the Golden Verified Tick.',
      next: 'Next milestone: Diamond Tick at 100 days.',
      gradient: 'from-yellow-500/20 to-amber-500/20',
      badgeColor: 'text-yellow-500',
    },
    3: {
      title: '💎 Legend Status Unlocked!',
      msg: 'You maintained a 100-day posting streak.',
      sub: 'You are now among Trackr\'s most consistent members.',
      next: 'You are a certified productivity legend! 👑',
      gradient: 'from-cyan-500/20 via-indigo-500/20 to-pink-500/20',
      badgeColor: 'text-violet-500',
    },
  }[level as 1 | 2 | 3]

  // Create simple floating particle objects for a confetti-like effect
  const particles = Array.from({ length: 24 }).map((_, i) => ({
    id: i,
    x: Math.random() * 360 - 180,
    y: Math.random() * -200 - 50,
    size: Math.random() * 8 + 4,
    color: ['#8B5CF6', '#EC4899', '#3B82F6', '#10B981', '#F59E0B'][i % 5],
    delay: Math.random() * 0.4,
  }))

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/75 backdrop-blur-md"
          onClick={() => setIsOpen(false)}
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 20, stiffness: 260 }}
          className="relative bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] w-full max-w-[420px] rounded-[2.5rem] p-8 md:p-10 shadow-2xl flex flex-col items-center text-center overflow-hidden"
        >
          {/* Background Radial Glow */}
          <div className={`absolute top-[-50px] w-72 h-72 bg-gradient-to-b ${details.gradient} blur-[80px] rounded-full pointer-events-none -z-10`} />

          {/* Confetti Particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {particles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ x: 0, y: 150, scale: 0, opacity: 1 }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0, 1.2, 1],
                  opacity: [1, 1, 0],
                  rotate: Math.random() * 360,
                }}
                transition={{
                  duration: 2.2,
                  delay: p.delay,
                  ease: 'easeOut',
                }}
                className="absolute left-1/2 bottom-20 rounded-full"
                style={{
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                }}
              />
            ))}
          </div>

          {/* Badge Display */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 10 }}
            className="w-24 h-24 rounded-full bg-violet-50 dark:bg-violet-950/20 border border-violet-100/50 dark:border-violet-900/30 flex items-center justify-center mb-6 shadow-inner relative"
          >
            <VerifiedBadge level={level} size="lg" />
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
              className="absolute inset-0 rounded-full border-4 border-violet-400/20"
            />
          </motion.div>

          {/* Typography */}
          <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            {details.title}
          </h3>
          <p className="text-violet-600 dark:text-violet-400 font-extrabold text-base mb-4 tracking-wide uppercase text-sm">
            {details.msg}
          </p>
          <p className="text-gray-700 dark:text-gray-300 text-[15px] font-medium leading-relaxed max-w-sm mb-2">
            {details.sub}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-xs font-semibold leading-relaxed max-w-xs mb-8">
            {details.next}
          </p>

          {/* Action Button */}
          <button
            onClick={() => setIsOpen(false)}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-base transition-all shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 active:scale-[0.98] cursor-pointer"
          >
            Awesome 🚀
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

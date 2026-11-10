'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface LikeButtonProps {
  isLiked: boolean
  likesCount: number
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void
  disabled?: boolean
  className?: string
}

export function LikeButton({
  isLiked,
  likesCount,
  onToggle,
  disabled = false,
  className = ''
}: LikeButtonProps) {
  const prevCountRef = useRef(likesCount)
  const [direction, setDirection] = useState<number>(1)
  const isInitialRender = useRef(true)

  // Track increment vs decrement direction for vertical number roll
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      prevCountRef.current = likesCount
      return
    }

    if (likesCount !== prevCountRef.current) {
      setDirection(likesCount > prevCountRef.current ? 1 : -1)
      prevCountRef.current = likesCount
    }
  }, [likesCount])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (disabled) return
    onToggle(e)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 text-[14px] font-medium transition-colors cursor-pointer group/btn select-none ${
        isLiked 
          ? 'text-[#F91880]' 
          : 'hover:text-[#F91880] text-[#536471] dark:text-[#71767b]'
      } ${className}`}
      title={isLiked ? "Unlike" : "Like"}
    >
      {/* Heart Icon Wrapper with Pop Animation */}
      <div className="p-2 rounded-full group-hover/btn:bg-rose-50 dark:group-hover/btn:bg-rose-950/40 transition-colors">
        <motion.div
          animate={isLiked ? {
            scale: [1, 0.78, 1.28, 1],
            transition: { duration: 0.26, times: [0, 0.22, 0.62, 1], ease: [0.16, 1, 0.3, 1] }
          } : {
            scale: [1, 0.88, 1],
            transition: { duration: 0.18, ease: "easeOut" }
          }}
          className="relative flex items-center justify-center shrink-0"
        >
          <Heart 
            className={`w-[19px] h-[19px] transition-colors duration-150 ${
              isLiked 
                ? 'fill-[#F91880] text-[#F91880]' 
                : 'fill-transparent text-current'
            }`} 
          />
        </motion.div>
      </div>

      {/* Vertical Rolling Counter */}
      <div className="relative overflow-hidden h-[18px] min-w-[12px] inline-flex items-center justify-center leading-none">
        <AnimatePresence mode="popLayout" custom={direction} initial={false}>
          <motion.span
            key={likesCount}
            custom={direction}
            variants={{
              initial: (dir: number) => ({
                y: dir > 0 ? 12 : -12,
                opacity: 0,
              }),
              animate: {
                y: 0,
                opacity: 1,
              },
              exit: (dir: number) => ({
                y: dir > 0 ? -12 : 12,
                opacity: 0,
              }),
            }}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className={`tabular-nums text-[14px] font-medium leading-none block ${
              isLiked ? 'text-[#F91880]' : 'text-inherit'
            }`}
          >
            {likesCount}
          </motion.span>
        </AnimatePresence>
      </div>
    </button>
  )
}

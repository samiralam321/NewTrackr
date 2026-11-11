'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActionTooltip } from '@/components/ui/action-tooltip'

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
  const hasInteractedRef = useRef(false)

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
      hasInteractedRef.current = true
    }
  }, [likesCount])

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (disabled) return
    hasInteractedRef.current = true
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
    >
      {/* Heart Icon Wrapper with Pop Animation & Twitter/X Style Tooltip */}
      <ActionTooltip label={isLiked ? 'Unlike' : 'Like'} disabled={disabled}>
        <div className="p-2 rounded-full group-hover/btn:bg-rose-50 dark:group-hover/btn:bg-rose-950/40 transition-colors">
          <motion.div
            animate={
              hasInteractedRef.current
                ? isLiked
                  ? {
                      scale: [1, 0.75, 1.3, 1],
                      transition: {
                        duration: 0.3,
                        times: [0, 0.2, 0.6, 1],
                        ease: [0.175, 0.885, 0.32, 1.275]
                      }
                    }
                  : {
                      scale: [1, 0.85, 1],
                      transition: { duration: 0.18, ease: "easeOut" }
                    }
                : { scale: 1 }
            }
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
      </ActionTooltip>

      {/* Vertical Rolling Counter (Twitter/X Spring Animation) */}
      <div className="relative overflow-hidden h-[18px] min-w-[12px] inline-flex items-center justify-center leading-none">
        {!hasInteractedRef.current ? (
          <span
            className={`tabular-nums text-[14px] font-medium leading-none block select-none ${
              isLiked ? 'text-[#F91880]' : 'text-inherit'
            }`}
          >
            {likesCount}
          </span>
        ) : (
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.span
              key={likesCount}
              custom={direction}
              variants={{
                initial: (dir: number) => ({
                  y: dir > 0 ? "100%" : "-100%",
                  opacity: 0,
                }),
                animate: {
                  y: "0%",
                  opacity: 1,
                },
                exit: (dir: number) => ({
                  y: dir > 0 ? "-100%" : "100%",
                  opacity: 0,
                }),
              }}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                type: "spring",
                stiffness: 450,
                damping: 30,
                mass: 0.8,
              }}
              style={{ willChange: "transform, opacity" }}
              className={`tabular-nums text-[14px] font-medium leading-none block select-none ${
                isLiked ? 'text-[#F91880]' : 'text-inherit'
              }`}
            >
              {likesCount}
            </motion.span>
          </AnimatePresence>
        )}
      </div>
    </button>
  )
}

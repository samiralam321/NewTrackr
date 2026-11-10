'use client'

import React, { useRef, useState, useEffect } from 'react'
import { Repeat2, PenLine, Ban } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { ActionTooltip } from '@/components/ui/action-tooltip'

interface RepostButtonProps {
  isReposted: boolean
  repostsCount: number
  isOwnPost: boolean
  onRepost: () => void
  onUndoRepost: () => void
  onQuote: () => void
  disabled?: boolean
  className?: string
}

export function RepostButton({
  isReposted,
  repostsCount,
  isOwnPost,
  onRepost,
  onUndoRepost,
  onQuote,
  disabled = false,
  className = ''
}: RepostButtonProps) {
  const prevCountRef = useRef(repostsCount)
  const [direction, setDirection] = useState<number>(1)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const isInitialRender = useRef(true)
  const menuRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  // Track increment vs decrement direction for vertical number roll
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false
      prevCountRef.current = repostsCount
      return
    }

    if (repostsCount !== prevCountRef.current) {
      setDirection(repostsCount > prevCountRef.current ? 1 : -1)
      prevCountRef.current = repostsCount
    }
  }, [repostsCount])

  // Close menu on outside click
  useEffect(() => {
    if (!isMenuOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current && 
        !menuRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsMenuOpen(false)
      }
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMenuOpen])

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (disabled) return
    setIsMenuOpen(prev => !prev)
  }

  const handleRepostAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    if (isReposted) {
      onUndoRepost()
    } else {
      if (isOwnPost) return
      onRepost()
    }
  }

  const handleQuoteAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsMenuOpen(false)
    onQuote()
  }

  return (
    <div className="relative inline-block select-none">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleButtonClick}
        disabled={disabled}
        className={`flex items-center gap-1.5 text-[14px] font-medium transition-colors cursor-pointer group/btn select-none ${
          isReposted 
            ? 'text-emerald-500 dark:text-emerald-400' 
            : 'hover:text-emerald-500 dark:hover:text-emerald-400 text-[#536471] dark:text-[#71767b]'
        } ${className}`}
        aria-label={isReposted ? "Undo Repost" : "Repost"}
      >
        {/* Repost Icon Wrapper with Pop Animation & Twitter/X Style Tooltip */}
        <ActionTooltip 
          label={isReposted ? 'Undo Repost' : 'Repost'} 
          disabled={disabled || isMenuOpen}
        >
          <div className="p-2 rounded-full group-hover/btn:bg-emerald-50 dark:group-hover/btn:bg-emerald-950/40 transition-colors">
            <motion.div
              animate={isReposted ? {
                scale: [1, 0.78, 1.28, 1],
                rotate: [0, -18, 18, 0],
                transition: { duration: 0.28, times: [0, 0.2, 0.65, 1], ease: [0.16, 1, 0.3, 1] }
              } : {
                scale: [1, 0.88, 1],
                transition: { duration: 0.18, ease: "easeOut" }
              }}
              className="relative flex items-center justify-center shrink-0"
            >
              <Repeat2 
                className={`w-[19px] h-[19px] stroke-[2.2] transition-colors duration-150 ${
                  isReposted 
                    ? 'text-emerald-500 dark:text-emerald-400' 
                    : 'text-current'
                }`} 
              />
            </motion.div>
          </div>
        </ActionTooltip>

        {/* Vertical Rolling Counter */}
        <div className="relative overflow-hidden h-[18px] min-w-[12px] inline-flex items-center justify-center leading-none">
          <AnimatePresence mode="popLayout" custom={direction} initial={false}>
            <motion.span
              key={repostsCount}
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
                y: { type: "spring", stiffness: 450, damping: 28 },
                opacity: { duration: 0.15 },
              }}
              className="font-medium text-[14px] leading-none text-current"
            >
              {repostsCount}
            </motion.span>
          </AnimatePresence>
        </div>
      </button>

      {/* Twitter/X Style Repost / Quote Dropdown Popover */}
      {isMenuOpen && (
        <div
          ref={menuRef}
          onClick={(e) => e.stopPropagation()}
          className="absolute left-0 bottom-full mb-1.5 sm:bottom-auto sm:top-full sm:mt-1 w-48 bg-white dark:bg-[#12101A] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl shadow-2xl py-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150 origin-top-left"
        >
          {/* Repost / Undo Repost option */}
          <button
            type="button"
            onClick={handleRepostAction}
            disabled={isOwnPost && !isReposted}
            className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-[13px] font-bold flex items-center gap-2.5 transition-colors cursor-pointer group ${
              isReposted
                ? 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                : isOwnPost
                  ? 'opacity-50 cursor-not-allowed text-gray-400'
                  : 'text-gray-800 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            {isOwnPost && !isReposted ? (
              <>
                <Ban className="w-4 h-4 text-gray-400 shrink-0" />
                <div className="flex flex-col min-w-0">
                  <span className="truncate">Repost</span>
                  <span className="text-[10px] font-normal text-gray-400">Can't repost own post</span>
                </div>
              </>
            ) : (
              <>
                <Repeat2 className="w-4 h-4 stroke-[2.3] shrink-0" />
                <span>{isReposted ? 'Undo Repost' : 'Repost'}</span>
              </>
            )}
          </button>

          {/* Quote Post option */}
          <button
            type="button"
            onClick={handleQuoteAction}
            className="w-full px-3.5 py-2.5 text-left text-xs sm:text-[13px] font-bold text-gray-800 dark:text-gray-200 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:text-violet-600 dark:hover:text-violet-400 flex items-center gap-2.5 transition-colors cursor-pointer"
          >
            <PenLine className="w-4 h-4 stroke-[2.2] shrink-0 text-violet-500" />
            <span>Quote</span>
          </button>
        </div>
      )}
    </div>
  )
}

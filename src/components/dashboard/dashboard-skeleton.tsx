'use client'

import React from 'react'
import { RightSidebar } from '@/components/layout/right-sidebar'

export interface FeedPostSkeletonProps {
  withImage?: boolean
}

/**
 * Minimal Twitter/X-style post skeleton.
 * Only simple circular avatar + short metadata line + 2-3 text lines.
 * No action icons, no buttons, no decorative blocks.
 */
export function FeedPostSkeleton({ withImage = false }: FeedPostSkeletonProps) {
  return (
    <div className="px-4 py-3.5 border-b border-[#eff3f4] dark:border-[#2f3336] flex gap-3 text-left w-full bg-white dark:bg-[#000000]">
      {/* 1. Simple circular gray avatar placeholder */}
      <div className="w-10 h-10 rounded-full bg-[#E8EAED] dark:bg-[#1f2328] skeleton-shimmer shrink-0 mt-0.5" />

      {/* 2. Text lines */}
      <div className="flex-1 min-w-0 space-y-2 py-0.5">
        {/* Username & metadata line */}
        <div className="h-3 w-32 rounded-full bg-[#E8EAED] dark:bg-[#1f2328] skeleton-shimmer" />

        {/* Post content lines */}
        <div className="h-3 w-full rounded-full bg-[#E8EAED] dark:bg-[#1f2328] skeleton-shimmer" />
        <div className="h-3 w-4/5 rounded-full bg-[#E8EAED] dark:bg-[#1f2328] skeleton-shimmer" />
        {withImage && (
          <div className="h-3 w-3/5 rounded-full bg-[#E8EAED] dark:bg-[#1f2328] skeleton-shimmer" />
        )}

        {/* Simple rectangular image placeholder (only on select post) */}
        {withImage && (
          <div className="w-full h-44 sm:h-52 rounded-2xl bg-[#E8EAED] dark:bg-[#1f2328] skeleton-shimmer mt-2.5" />
        )}
      </div>
    </div>
  )
}

/**
 * Minimal feed placeholder list used in Feed loading and tab switching.
 */
export function FeedListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#eff3f4] dark:divide-[#2f3336] bg-white dark:bg-[#000000]">
      {Array.from({ length: count }).map((_, index) => (
        <FeedPostSkeleton key={index} withImage={index === 1} />
      ))}
    </div>
  )
}

/**
 * Route loading skeleton preserving the 3-column architecture:
 * - Left sidebar (in layout.tsx)
 * - Center feed column (starts at exact same pixel position, exact same width)
 * - Right sidebar (in its exact position and width)
 */
export function DashboardSkeleton() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#000000]">
      {/* Central Timeline Column — starts exactly where actual feed starts */}
      <main 
        id="main-feed-container" 
        className="flex-1 min-w-0 max-w-[640px] xl:max-w-[690px] 2xl:max-w-[730px] h-full overflow-y-auto no-scrollbar border-r border-[#eff3f4] dark:border-[#2f3336] flex flex-col bg-white dark:bg-[#000000] shrink-0"
      >
        <FeedListSkeleton count={5} />
      </main>

      {/* Right Sidebar — kept in original position and width */}
      <div className="w-[360px] xl:w-[390px] 2xl:w-[410px] h-full overflow-y-auto no-scrollbar hidden lg:flex flex-col bg-white dark:bg-[#000000] shrink-0">
        <RightSidebar />
      </div>
    </div>
  )
}

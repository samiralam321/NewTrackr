'use client'

import React from 'react'
import { RightSidebar } from '@/components/layout/right-sidebar'

export interface FeedPostSkeletonProps {
  withImage?: boolean
}

/**
 * Single post skeleton card matching the exact dimensions, padding,
 * avatar placement, and typography of real Trackr feed post cards.
 */
export function FeedPostSkeleton({ withImage = false }: FeedPostSkeletonProps) {
  return (
    <article className="px-4 py-3.5 border-b border-[#eff3f4] dark:border-[#2f3336] flex flex-col text-left w-full">
      <div className="flex gap-3 text-left w-full">
        {/* Author Avatar Skeleton */}
        <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0 mt-0.5" />

        {/* Post Content & Meta Skeleton */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header Row: Name · @Handle · Time */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-28 rounded skeleton-shimmer" />
            <div className="w-3.5 h-3.5 rounded-full skeleton-shimmer" />
            <div className="h-3.5 w-16 rounded skeleton-shimmer" />
            <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-700" />
            <div className="h-3 w-8 rounded skeleton-shimmer" />
          </div>

          {/* Post Text Lines */}
          <div className="space-y-1.5 pt-0.5">
            <div className="h-3.5 w-full rounded skeleton-shimmer" />
            <div className="h-3.5 w-[85%] rounded skeleton-shimmer" />
            {withImage && <div className="h-3.5 w-[60%] rounded skeleton-shimmer" />}
          </div>

          {/* Optional Post Image Attachment */}
          {withImage && (
            <div className="w-full h-48 sm:h-56 rounded-2xl skeleton-shimmer mt-2 mb-1 border border-gray-100 dark:border-white/5" />
          )}

          {/* Action Bar (Comments, Repost, Heart, Bookmark, Share) */}
          <div className="flex items-center justify-between max-w-md pt-2">
            <div className="w-4 h-4 rounded skeleton-shimmer" />
            <div className="w-4 h-4 rounded skeleton-shimmer" />
            <div className="w-4 h-4 rounded skeleton-shimmer" />
            <div className="w-4 h-4 rounded skeleton-shimmer" />
            <div className="w-4 h-4 rounded skeleton-shimmer" />
          </div>
        </div>
      </div>
    </article>
  )
}

/**
 * List of post skeletons used in Feed loading and tab switching.
 */
export function FeedListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="divide-y divide-[#eff3f4] dark:divide-[#2f3336]">
      {Array.from({ length: count }).map((_, index) => (
        <FeedPostSkeleton key={index} withImage={index === 1} />
      ))}
    </div>
  )
}

/**
 * Complete Dashboard Skeleton that preserves the exact three-column layout:
 * 1. Left sidebar (maintained in (app)/layout.tsx)
 * 2. Center feed column (flush against left sidebar with exact max-width and borders)
 * 3. Right sidebar (search bar, trending topics, hackathons)
 */
export function DashboardSkeleton() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#000000]">
      {/* Central Timeline Column — identical grid, width, borders, and padding */}
      <main 
        id="main-feed-container" 
        className="flex-1 min-w-0 max-w-[640px] xl:max-w-[690px] 2xl:max-w-[730px] h-full overflow-y-auto no-scrollbar border-r border-[#eff3f4] dark:border-[#2f3336] flex flex-col bg-white dark:bg-[#000000] shrink-0"
      >
        {/* Mobile Top App Bar Skeleton (Mobile only) */}
        <div className="flex md:hidden items-center justify-between w-full px-4 py-2.5 border-b border-[#eff3f4] dark:border-[#2f3336] sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md">
          <div className="w-8 h-8 rounded-full skeleton-shimmer" />
          <div className="flex items-center gap-2">
            <div className="w-14 h-6 rounded-full skeleton-shimmer" />
            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
          </div>
        </div>

        {/* Top Header: Greeting & Subtitle Skeleton */}
        <header className="px-4.5 pt-3.5 pb-2.5 border-b border-[#eff3f4] dark:border-[#2f3336] bg-white dark:bg-[#000000] shrink-0">
          <div className="h-7 sm:h-8 w-56 rounded-lg skeleton-shimmer mb-1.5" />
          <div className="h-4 w-72 rounded-md skeleton-shimmer" />
        </header>

        {/* Sliding Pill Navigation Bar Skeleton */}
        <div className="sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-black/90 px-3.5 py-2.5 border-b border-[#eff3f4] dark:border-[#2f3336] flex items-center overflow-x-auto no-scrollbar">
          <div className="inline-flex items-center gap-1 p-1 bg-[#F4F3F7] dark:bg-[#15141D] rounded-full border border-gray-200/70 dark:border-[#2D2B3B]/80">
            <div className="h-8 w-24 rounded-full bg-violet-600/30 dark:bg-violet-900/40 skeleton-shimmer" />
            <div className="h-8 w-24 rounded-full skeleton-shimmer hidden sm:block" />
            <div className="h-8 w-20 rounded-full skeleton-shimmer hidden sm:block" />
            <div className="h-8 w-28 rounded-full skeleton-shimmer hidden sm:block" />
            <div className="h-8 w-20 rounded-full skeleton-shimmer hidden sm:block" />
          </div>
        </div>

        {/* Post Composer Skeleton */}
        <div className="px-4 py-3.5 border-b border-[#eff3f4] dark:border-[#2f3336] bg-white dark:bg-[#000000]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full skeleton-shimmer shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0 space-y-3">
              <div className="h-5 skeleton-shimmer rounded-md w-3/5" />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded skeleton-shimmer" />
                  <div className="w-5 h-5 rounded skeleton-shimmer" />
                  <div className="w-5 h-5 rounded skeleton-shimmer" />
                  <div className="w-5 h-5 rounded skeleton-shimmer" />
                </div>
                <div className="w-16 h-8 rounded-full bg-violet-600/30 dark:bg-violet-900/40 skeleton-shimmer" />
              </div>
            </div>
          </div>
        </div>

        {/* Feed Post Skeletons */}
        <FeedListSkeleton count={4} />
      </main>

      {/* Right Sidebar: PRESERVED in its exact position and width */}
      <div className="w-[360px] xl:w-[390px] 2xl:w-[410px] h-full overflow-y-auto no-scrollbar hidden lg:flex flex-col bg-white dark:bg-[#000000] shrink-0">
        <RightSidebar />
      </div>
    </div>
  )
}

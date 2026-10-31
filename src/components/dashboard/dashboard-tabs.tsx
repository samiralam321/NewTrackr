"use client"

import { useState } from "react"
import { Feed } from "@/components/dashboard/feed"
import { motion } from "framer-motion"
import { Flame, Sparkles, Compass, SlidersHorizontal, Users, GraduationCap, Globe } from "lucide-react"

export function DashboardTabs({ currentUserId }: { currentUserId?: string }) {
  const [activeTab, setActiveTab] = useState<"for-you" | "following" | "college">("for-you")
  const [sortBy, setSortBy] = useState<"popular" | "new" | "relevant">("popular")

  const tabs = [
    { id: "for-you", label: "For You", icon: Globe },
    { id: "following", label: "Following", icon: Users },
    { id: "college", label: "College", icon: GraduationCap },
  ] as const

  const sortOptions = [
    { id: "popular", label: "Popular", icon: Flame },
    { id: "new", label: "New", icon: Sparkles },
    { id: "relevant", label: "Relevant", icon: Compass },
  ] as const

  return (
    <div className="w-full">
      {/* Desktop Header with Fluid Sliding Pill Tabs & Sorting */}
      <div className="hidden md:flex items-center justify-between border-b border-gray-100 dark:border-[#2D2B3B] pb-4 mb-6">
        
        {/* Animated Sliding Pill Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-[#15141D] rounded-full border border-gray-200/50 dark:border-[#2D2B3B]/60 shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-2 text-sm font-semibold rounded-full transition-colors flex items-center gap-2 select-none ${
                  isActive
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="desktop-feed-tab-pill"
                    className="absolute inset-0 bg-violet-600 rounded-full shadow-md shadow-violet-500/25"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
                <Icon className={`w-4 h-4 relative z-10 ${isActive ? "text-white" : "text-gray-400"}`} />
                <span className="relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* Reddit-style Feed Sort Filter */}
        <div className="flex items-center gap-1 bg-gray-50 dark:bg-[#12111A] p-1 rounded-full border border-gray-100 dark:border-[#2D2B3B]">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-2.5 flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" /> Sort:
          </span>
          {sortOptions.map((opt) => {
            const isSelected = sortBy === opt.id
            const Icon = opt.icon
            return (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className={`px-3 py-1 text-xs font-semibold rounded-full transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-white dark:bg-[#1E1D2A] text-violet-600 dark:text-violet-400 shadow-xs"
                    : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? "text-violet-600 dark:text-violet-400" : ""}`} />
                <span>{opt.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Mobile Feed Tabs with Smooth Sliding Indicator */}
      <div className="flex md:hidden items-center justify-between border-b border-gray-100 dark:border-[#2D2B3B] mb-3">
        <div className="flex-1 flex items-center justify-around">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative py-3 px-2 text-[14.5px] transition-colors flex-1 text-center font-medium ${
                  isActive
                    ? "text-gray-900 dark:text-white font-bold"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-feed-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 w-12 mx-auto h-[3px] bg-violet-600 dark:bg-violet-400 rounded-full"
                    transition={{ type: "spring", stiffness: 450, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Feed Content with Preserved State and Instant Switching */}
      <div className={activeTab === "for-you" ? "block" : "hidden"}>
        <Feed currentUserIdProp={currentUserId} sortBy={sortBy} />
      </div>
      <div className={activeTab === "following" ? "block" : "hidden"}>
        <Feed followingOnlyFilter={true} currentUserIdProp={currentUserId} sortBy={sortBy} />
      </div>
      <div className={activeTab === "college" ? "block" : "hidden"}>
        <Feed collegeOnlyFilter={true} currentUserIdProp={currentUserId} sortBy={sortBy} />
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Feed } from "@/components/dashboard/feed"
import { InlinePostComposer } from "@/components/dashboard/inline-post-composer"
import { motion } from "framer-motion"
import { Globe, Users, GraduationCap, Briefcase, Calendar } from "lucide-react"

interface DashboardTabsProps {
  currentUserId?: string
  user?: any
  profile?: any
}

export function DashboardTabs({ currentUserId, user, profile }: DashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"for-you" | "following" | "college" | "opportunities" | "events">("for-you")

  const tabs = [
    { id: "for-you", label: "For You", icon: Globe },
    { id: "following", label: "Following", icon: Users },
    { id: "college", label: "College", icon: GraduationCap },
    { id: "opportunities", label: "Opportunities", icon: Briefcase },
    { id: "events", label: "Events", icon: Calendar },
  ] as const

  return (
    <div className="w-full">
      {/* Sliding Pill Navigation Bar (Matching User Screenshot Exactly) */}
      <div className="flex items-center pb-4 mb-3 overflow-x-auto no-scrollbar">
        <div className="inline-flex items-center gap-1 p-1 bg-[#F4F3F7] dark:bg-[#15141D] rounded-full border border-gray-200/70 dark:border-[#2D2B3B]/80 shadow-inner">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 sm:px-5 py-2 text-xs md:text-sm font-semibold rounded-full transition-colors duration-200 flex items-center gap-2 select-none shrink-0 cursor-pointer ${
                  isActive
                    ? "text-white"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sliding-feed-pill"
                    className="absolute inset-0 bg-[#7C3AED] rounded-full shadow-md shadow-violet-500/25"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-4 h-4 relative z-10 transition-colors duration-200 ${
                    isActive ? "text-white" : "text-gray-400 dark:text-gray-500"
                  }`}
                />
                <span className="relative z-10">{tab.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Inline Post Composer above the feed */}
      <InlinePostComposer user={user} profile={profile} />

      {/* Feed Content with Tab Filter */}
      <Feed 
        key={activeTab}
        currentUserIdProp={currentUserId}
        followingOnlyFilter={activeTab === "following"}
        collegeOnlyFilter={activeTab === "college"}
        opportunitiesOnlyFilter={activeTab === "opportunities"}
        eventsOnlyFilter={activeTab === "events"}
        sortBy="new" 
      />
    </div>
  )
}

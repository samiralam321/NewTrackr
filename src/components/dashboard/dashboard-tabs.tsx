"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Feed } from "@/components/dashboard/feed"
import { InlinePostComposer } from "@/components/dashboard/inline-post-composer"
import { OpportunitiesFeed } from "@/components/opportunities/opportunities-feed"
import { motion } from "framer-motion"
import { Globe, Users, GraduationCap, Briefcase, Calendar } from "lucide-react"
import { scrollToFeedTop } from "@/lib/utils/scroll"

interface DashboardTabsProps {
  currentUserId?: string
  user?: any
  profile?: any
}

type TabType = "for-you" | "following" | "college" | "opportunities" | "events"

export function DashboardTabs({ currentUserId, user, profile }: DashboardTabsProps) {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('feed') || searchParams.get('tab') || 'for-you') as TabType
  const [activeTab, setActiveTab] = useState<TabType>(
    ['for-you', 'following', 'college', 'opportunities', 'events'].includes(initialTab)
      ? initialTab
      : 'for-you'
  )

  const tabs = [
    { id: "for-you", label: "For You", icon: Globe },
    { id: "following", label: "Following", icon: Users },
    { id: "college", label: "College", icon: GraduationCap },
    { id: "opportunities", label: "Opportunities", icon: Briefcase },
    { id: "events", label: "Events", icon: Calendar },
  ] as const

  // Sync tab change to URL without full page reload
  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      if (tabId === 'for-you') {
        url.searchParams.delete('feed')
        url.searchParams.delete('tab')
      } else {
        url.searchParams.set('feed', tabId)
      }
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Listen for custom tab switch events (e.g. from Upcoming Hackathons widget)
  useEffect(() => {
    const handleSwitch = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && ['for-you', 'following', 'college', 'opportunities', 'events'].includes(customEvent.detail)) {
        handleTabChange(customEvent.detail as TabType)
      }
    }

    window.addEventListener('switch-feed-tab', handleSwitch)
    return () => {
      window.removeEventListener('switch-feed-tab', handleSwitch)
    }
  }, [])

  return (
    <div className="w-full">
      {/* Sliding Pill Navigation Bar (Previous Trackr Style) */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-white/90 dark:bg-black/90 px-3.5 py-2.5 border-b border-[#eff3f4] dark:border-[#2f3336] flex items-center overflow-x-auto no-scrollbar">
        <div className="inline-flex items-center gap-1 p-1 bg-[#F4F3F7] dark:bg-[#15141D] rounded-full border border-gray-200/70 dark:border-[#2D2B3B]/80">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (isActive) {
                    scrollToFeedTop()
                  } else {
                    handleTabChange(tab.id)
                  }
                }}
                className={`relative px-3.5 sm:px-4.5 py-1.5 sm:py-2 text-[13.5px] sm:text-[14.5px] font-semibold rounded-full transition-colors duration-200 flex items-center gap-2 select-none shrink-0 cursor-pointer ${
                  isActive
                    ? "text-white font-bold"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="sliding-feed-pill"
                    className="absolute inset-0 bg-[#7C3AED] rounded-full"
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

      {/* When in Opportunities mode: Render the dedicated Opportunities Discovery Feed */}
      {activeTab === "opportunities" ? (
        <OpportunitiesFeed currentUserId={currentUserId} />
      ) : (
        <>
          {/* Post Composer for Social Tabs */}
          <InlinePostComposer user={user} profile={profile} />

          {/* Feed Content with Tab Filter */}
          <Feed 
            key={activeTab}
            currentUserIdProp={currentUserId}
            currentUserProfileProp={profile}
            followingOnlyFilter={activeTab === "following"}
            collegeOnlyFilter={activeTab === "college"}
            eventsOnlyFilter={activeTab === "events"}
            sortBy="new" 
          />
        </>
      )}
    </div>
  )
}

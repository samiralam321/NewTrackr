"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Feed } from "@/components/dashboard/feed"
import { InlinePostComposer } from "@/components/dashboard/inline-post-composer"
import { OpportunitiesFeed } from "@/components/opportunities/opportunities-feed"
import { motion } from "framer-motion"
import { Globe, Users, GraduationCap, Briefcase, Calendar } from "lucide-react"

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
      {/* Twitter-Style Sticky Top Navigation Bar */}
      <div className="sticky top-0 z-20 backdrop-blur-md bg-white/85 dark:bg-black/85 border-b border-[#eff3f4] dark:border-[#2f3336] flex items-center overflow-x-auto no-scrollbar w-full">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex-1 min-w-[70px] sm:min-w-[85px] h-[52px] flex items-center justify-center relative cursor-pointer hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-colors select-none"
            >
              <div className="flex items-center justify-center h-full relative px-3">
                <span className={`text-[14.5px] sm:text-[15px] transition-colors tracking-tight ${
                  isActive 
                    ? "font-bold text-[#0f1419] dark:text-[#e7e9ea]" 
                    : "font-medium text-[#536471] dark:text-[#71767b]"
                }`}>
                  {tab.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="twitter-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-[#7C3AED] rounded-full"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
              </div>
            </button>
          )
        })}
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

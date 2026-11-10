"use client"

import { useState } from "react"
import { Feed } from "@/components/dashboard/feed"
import { InlinePostComposer } from "@/components/dashboard/inline-post-composer"
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
      {/* Feed Tabs Bar (Matching Reference 1 Rounded Pill Style) */}
      <div className="flex items-center gap-2 pb-4 mb-3 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-full transition-all flex items-center gap-2 select-none shrink-0 cursor-pointer ${
                isActive
                  ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                  : "bg-gray-100/90 dark:bg-[#15141D] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/50 dark:border-[#2D2B3B]/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Inline Post Composer above the feed */}
      <InlinePostComposer user={user} profile={profile} />

      {/* Feed Content with Preserved State & Instant Switching */}
      <div className={activeTab === "for-you" ? "block" : "hidden"}>
        <Feed currentUserIdProp={currentUserId} sortBy="new" />
      </div>
      <div className={activeTab === "following" ? "block" : "hidden"}>
        <Feed followingOnlyFilter={true} currentUserIdProp={currentUserId} sortBy="new" />
      </div>
      <div className={activeTab === "college" ? "block" : "hidden"}>
        <Feed collegeOnlyFilter={true} currentUserIdProp={currentUserId} sortBy="new" />
      </div>
      <div className={activeTab === "opportunities" ? "block" : "hidden"}>
        <Feed opportunitiesOnlyFilter={true} currentUserIdProp={currentUserId} sortBy="new" />
      </div>
      <div className={activeTab === "events" ? "block" : "hidden"}>
        <Feed eventsOnlyFilter={true} currentUserIdProp={currentUserId} sortBy="new" />
      </div>
    </div>
  )
}

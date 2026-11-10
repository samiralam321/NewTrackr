'use client'

import { SearchBar } from "@/components/widgets/search-bar"
import { TrendingWidget } from "@/components/widgets/trending-widget"
import { UpcomingHackathons } from "@/components/widgets/upcoming-hackathons"
import { WhoToFollow } from "@/components/widgets/who-to-follow"
import { CollegeCommunitiesWidget } from "@/components/widgets/college-communities-widget"

interface RightSidebarProps {
  profile?: any
  currentUserId?: string
}

export function RightSidebar({ profile, currentUserId }: RightSidebarProps) {
  return (
    <aside className="hidden lg:flex flex-col w-[340px] xl:w-[370px] h-screen sticky top-0 py-5 px-4 overflow-y-auto no-scrollbar gap-4 shrink-0 border-l border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] transition-colors duration-300">
      {/* Top Search & Actions Bar */}
      <SearchBar userProfile={profile} />

      {/* Trending Topics Widget */}
      <TrendingWidget />

      {/* Upcoming Verified Hackathons */}
      <UpcomingHackathons />

      {/* Real Supabase Students Discovery */}
      <WhoToFollow currentUserId={currentUserId || profile?.id} />

      {/* College Communities Gateway */}
      <CollegeCommunitiesWidget />

      {/* Footer Branding */}
      <div className="pt-2 pb-4 text-center">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
          © 2026 Trackr • Student Community & Progress
        </p>
      </div>
    </aside>
  )
}

'use client'

import { SearchBar } from "@/components/widgets/search-bar"
import { TrendingWidget } from "@/components/widgets/trending-widget"
import { UpcomingHackathons } from "@/components/widgets/upcoming-hackathons"
import { WhoToFollow } from "@/components/widgets/who-to-follow"

interface RightSidebarProps {
  profile?: any
  currentUserId?: string
}

export function RightSidebar({ profile, currentUserId }: RightSidebarProps) {
  return (
    <aside className="w-full min-h-full py-3 px-3 xl:px-4 flex flex-col gap-4 shrink-0 bg-transparent self-start">
      {/* Top Search & Actions Bar (Sticky) */}
      <div className="sticky top-0 z-20 bg-white/85 dark:bg-black/85 backdrop-blur-md pt-0.5 pb-2">
        <SearchBar userProfile={profile} />
      </div>

      {/* Trending Topics Widget */}
      <TrendingWidget />

      {/* Upcoming Verified Hackathons */}
      <UpcomingHackathons />

      {/* Real Supabase Students Discovery */}
      <WhoToFollow currentUserId={currentUserId || profile?.id} />

      {/* Footer Branding & Legal (Twitter style) */}
      <div className="px-3 pt-1 pb-8 text-left">
        <div className="flex flex-wrap gap-x-2.5 gap-y-1 text-[12px] text-[#536471] dark:text-[#71767b]">
          <a href="#" className="hover:underline">Terms of Service</a>
          <a href="#" className="hover:underline">Privacy Policy</a>
          <a href="#" className="hover:underline">Cookie Policy</a>
          <a href="#" className="hover:underline">Accessibility</a>
          <span>© 2026 Trackr, Inc.</span>
        </div>
      </div>
    </aside>
  )
}

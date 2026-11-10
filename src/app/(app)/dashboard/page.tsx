import { RightSidebar } from "@/components/layout/right-sidebar"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { MobileMenuDropdown } from "@/components/dashboard/mobile-menu-dropdown"
import { Greeting } from "@/components/dashboard/greeting"
import { getAuthenticatedUserAndProfile } from "@/lib/auth/get-user-profile"
import { redirect } from "next/navigation"
import Link from "next/link"

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const { user, profile } = await getAuthenticatedUserAndProfile()

  if (!user) {
    redirect('/auth')
  }

  const displayName = profile?.full_name 
    ? profile.full_name.split(' ')[0] 
    : (user.user_metadata?.full_name ? user.user_metadata.full_name.split(' ')[0] : 'Samir')

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Central Social Feed Column — only this scrolls */}
      <main className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-5 md:py-6">
        <div className="max-w-[680px] mx-auto w-full">
          {/* Header */}
          <header className="flex flex-col mb-4 gap-1">
            {/* Mobile Top Row: App Bar with Menu, Streak Pill, & Profile Avatar */}
            <div className="flex md:hidden items-center justify-between w-full pb-2">
              <MobileMenuDropdown profile={profile} />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold text-xs bg-orange-50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 px-2.5 py-1 rounded-full">
                  🔥 <span>{profile?.consistency_score || 0}</span>
                </div>
                <Link 
                  href="/profile" 
                  className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-[#2D2B3B] hover:ring-2 hover:ring-violet-500 transition-all shrink-0"
                >
                  <img 
                    src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=7C3AED&color=fff&size=80`} 
                    alt="Profile" 
                    width={36}
                    height={36}
                    loading="lazy"
                    decoding="async"
                    className="w-full h-full object-cover" 
                  />
                </Link>
              </div>
            </div>

            {/* Typography Block: Greeting & Inspirational Subtitle */}
            <div className="min-w-0">
              <Greeting name={displayName} />
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 transition-colors mt-0.5">
                Better ideas. Bigger dreams. Keep going! 🚀
              </p>
            </div>
          </header>

          {/* Optimized Tabs System & Central Feed */}
          <DashboardTabs currentUserId={user?.id} user={user} profile={profile} />
        </div>
      </main>

      {/* Right Sidebar: Search, Trending, Upcoming Hackathons, Who to follow */}
      <RightSidebar profile={profile} currentUserId={user?.id} />
    </div>
  )
}

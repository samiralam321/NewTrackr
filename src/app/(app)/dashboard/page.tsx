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
    <div className="flex h-full w-full overflow-hidden bg-white dark:bg-[#000000]">
      {/* Central Timeline Column — flush 3-column architecture matching Twitter */}
      <main id="main-feed-container" className="flex-1 min-w-0 max-w-[640px] xl:max-w-[690px] 2xl:max-w-[730px] h-full overflow-y-auto no-scrollbar border-r border-[#eff3f4] dark:border-[#2f3336] flex flex-col bg-white dark:bg-[#000000] shrink-0">
        {/* Mobile Top App Bar (Only visible on mobile screens) */}
        <div className="flex md:hidden items-center w-full px-3.5 py-2.5 border-b border-[#eff3f4] dark:border-[#2f3336] sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md gap-3">
          {/* Hamburger Menu on Left */}
          <div className="shrink-0 flex items-center">
            <MobileMenuDropdown profile={profile} />
          </div>

          {/* Clean Personalized Greeting Aligned with Hamburger Menu (No streak/avatar/subtitle) */}
          <div className="flex-1 min-w-0 flex items-center">
            <Greeting 
              name={displayName} 
              className="text-[20px] min-[360px]:text-[22px] sm:text-[24px] font-bold text-[#0f1419] dark:text-[#e7e9ea] truncate leading-tight select-none tracking-tight"
            />
          </div>
        </div>

        {/* Desktop Header: Greeting & Subtitle (Strictly Hidden on Mobile) */}
        <header className="hidden md:block px-4.5 pt-3.5 pb-2.5 border-b border-[#eff3f4] dark:border-[#2f3336] bg-white dark:bg-[#000000] shrink-0">
          <Greeting name={displayName} />
          <p className="text-[13px] sm:text-[14px] text-[#536471] dark:text-[#71767b] font-normal mt-0.5">
            Better ideas. Bigger dreams. Keep going! 🚀
          </p>
        </header>

        {/* Optimized Tabs System, Twitter-style Composer & Timeline Feed */}
        <DashboardTabs currentUserId={user?.id} user={user} profile={profile} />
      </main>

      {/* Right Sidebar: Search, Trending, Upcoming Hackathons, Who to follow */}
      <div className="w-[360px] xl:w-[390px] 2xl:w-[410px] h-full overflow-y-auto no-scrollbar hidden lg:flex flex-col bg-white dark:bg-[#000000] shrink-0">
        <RightSidebar profile={profile} currentUserId={user?.id} />
      </div>
    </div>
  )
}

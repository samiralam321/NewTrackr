import { RightSidebar } from "@/components/layout/right-sidebar"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { MobileMenuDropdown } from "@/components/dashboard/mobile-menu-dropdown"
import { Greeting } from "@/components/dashboard/greeting"
import { Button } from "@/components/ui/button"
import { Settings2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import Link from "next/link"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user profile for the header greeting
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  return (
    <div className="flex h-screen w-full">
      {/* Main Feed Content */}
      <main className="flex-1 overflow-y-auto px-3.5 sm:px-6 md:px-8 lg:px-12 py-3.5 md:py-8">
        <div className="max-w-4xl mx-auto w-full">
          {/* Header */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-6 gap-1.5 md:gap-4">
            
            {/* Mobile Top Row: App Bar with Menu, Streak Pill, & Profile Avatar */}
            <div className="flex md:hidden items-center justify-between w-full pb-1">
              <MobileMenuDropdown profile={profile} />
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400 font-bold text-xs bg-orange-50 dark:bg-orange-500/10 border border-orange-200/50 dark:border-orange-500/20 px-2.5 py-1 rounded-full">
                  🔥 <span>{profile?.consistency_score || 0}</span>
                </div>
                <Link href="/profile" className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-[#2D2B3B] hover:ring-2 hover:ring-violet-500 hover:ring-offset-2 dark:hover:ring-violet-400 dark:hover:ring-offset-black transition-all shrink-0">
                  <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`} alt="Profile" className="w-full h-full object-cover" />
                </Link>
              </div>
            </div>

            {/* Typography Block: Greeting & Subtitle */}
            <div className="flex-1 min-w-0">
              <Greeting name={profile?.full_name ? profile.full_name.split(' ')[0] : 'there'} />
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 transition-colors mt-0.5">Let's make today count.</p>
            </div>

            {/* Desktop Right Avatar */}
            <div className="hidden md:flex items-center gap-4">
              <Link href="/profile" className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-[#2D2B3B] hover:ring-2 hover:ring-violet-500 hover:ring-offset-2 dark:hover:ring-violet-400 dark:hover:ring-offset-black transition-all shrink-0">
                <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`} alt="Profile" className="w-full h-full object-cover" />
              </Link>
            </div>
          </header>

          {/* Optimized Tabs System */}
          <DashboardTabs currentUserId={user?.id} />
        </div>
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}

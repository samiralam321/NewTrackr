import { RightSidebar } from "@/components/layout/right-sidebar"
import { DashboardTabs } from "@/components/dashboard/dashboard-tabs"
import { MobileMenuDropdown } from "@/components/dashboard/mobile-menu-dropdown"
import { Greeting } from "@/components/dashboard/greeting"
import { Button } from "@/components/ui/button"
import { Settings2, Plus } from "lucide-react"
import { createClient } from "@/lib/supabase/server"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Fetch user profile for the header greeting
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user?.id).single()

  return (
    <div className="flex h-screen w-full">
      {/* Main Feed Content */}
      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8">
        
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MobileMenuDropdown />
              <Greeting name={profile?.full_name ? profile.full_name.split(' ')[0] : 'there'} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 transition-colors md:ml-0 ml-10">Let's make today count.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-5 py-5 gap-2 shadow-sm font-medium hidden">
              <Plus className="w-4 h-4" /> Share Progress
            </Button>
            <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-200 dark:border-[#2D2B3B] transition-colors">
              <img src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        </header>

        {/* Optimized Tabs System */}
        <DashboardTabs currentUserId={user?.id} />
      </main>

      {/* Right Sidebar */}
      <RightSidebar />
    </div>
  )
}

import { Sidebar } from "@/components/layout/sidebar"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { MobilePostDrawer } from "@/components/layout/mobile-post-drawer"
import { createClient } from "@/lib/supabase/server"
import { PresenceProvider } from "@/components/providers/presence-provider"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = user ? await supabase.from('profiles').select('*').eq('id', user.id).single() : { data: null }

  return (
    <div className="flex min-h-screen bg-[#FDFCFE] dark:bg-[#050505] transition-colors duration-300 pb-16 md:pb-0">
      <PresenceProvider userId={user?.id}>
        <div className="hidden md:block">
          <Sidebar profile={profile} />
        </div>
        <div className="flex-1 overflow-x-hidden">
          {children}
        </div>
        <MobileBottomNav profile={profile} />
        <MobilePostDrawer />
      </PresenceProvider>
    </div>
  )
}

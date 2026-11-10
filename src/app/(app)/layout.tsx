import { Sidebar } from "@/components/layout/sidebar"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { MobilePostDrawer } from "@/components/layout/mobile-post-drawer"
import { createClient } from "@/lib/supabase/server"
import { PresenceProvider } from "@/components/providers/presence-provider"
import { CongratulationsModal } from "@/components/ui/congratulations-modal"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  let profile = null
  try {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
    profile = data
  } catch (err) {
    console.warn("Could not load user profile in AppLayout:", err)
  }

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
        <MobilePostDrawer profile={profile} />
        <CongratulationsModal />
      </PresenceProvider>
    </div>
  )
}

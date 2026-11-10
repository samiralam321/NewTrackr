import { Sidebar } from "@/components/layout/sidebar"
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav"
import { MobilePostDrawer } from "@/components/layout/mobile-post-drawer"
import { getAuthenticatedUserAndProfile } from "@/lib/auth/get-user-profile"
import { PresenceProvider } from "@/components/providers/presence-provider"
import { CongratulationsModal } from "@/components/ui/congratulations-modal"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await getAuthenticatedUserAndProfile()

  if (!user) {
    redirect('/auth')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-white dark:bg-[#000000] text-[#0f1419] dark:text-[#e7e9ea] transition-colors duration-300 pb-16 md:pb-0">
      <PresenceProvider userId={user?.id}>
        <div className="hidden md:block shrink-0">
          <Sidebar profile={profile} />
        </div>
        <div className="flex-1 min-w-0 h-full overflow-hidden flex flex-col">
          {children}
        </div>
        <MobileBottomNav profile={profile} />
        <MobilePostDrawer profile={profile} />
        <CongratulationsModal />
      </PresenceProvider>
    </div>
  )
}

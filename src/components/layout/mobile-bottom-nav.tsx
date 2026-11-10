'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Compass, Bell, Mail } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export function MobileBottomNav({ profile }: { profile?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [hideNav, setHideNav] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  // Eagerly prefetch routes for instant mobile navigation
  useEffect(() => {
    const routes = ['/dashboard', '/explore', '/notifications', '/messages', '/profile']
    routes.forEach(r => {
      try { router.prefetch(r) } catch {}
    })
  }, [router])

  useEffect(() => {
    const checkChat = () => {
      const params = new URLSearchParams(window.location.search)
      setHideNav(window.location.pathname === '/messages' && !!params.get('userId'))
    }
    
    checkChat()
    
    window.addEventListener('popstate', checkChat)
    
    const originalPushState = window.history.pushState
    const originalReplaceState = window.history.replaceState
    
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args)
      setTimeout(checkChat, 0)
    }
    
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args)
      setTimeout(checkChat, 0)
    }
    
    return () => {
      window.removeEventListener('popstate', checkChat)
      window.history.pushState = originalPushState
      window.history.replaceState = originalReplaceState
    }
  }, [])

  // Live unread notifications tracker
  useEffect(() => {
    if (!profile?.id) return

    const fetchUnread = async () => {
      if (pathname === '/notifications') {
        setUnreadCount(0)
        return
      }
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const channel = supabase
      .channel(`mobile-nav-notifications:${profile.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile?.id, pathname])

  if (hideNav) return null

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Notifications', href: '/notifications', icon: Bell, badge: unreadCount },
    { name: 'Messages', href: '/messages', icon: Mail },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(3.75rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-[#0B0A10]/95 backdrop-blur-md border-t border-gray-100 dark:border-[#2D2B3B] flex items-center justify-around px-2 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            prefetch={true}
            onTouchStart={() => { try { router.prefetch(item.href) } catch {} }}
            className="flex flex-col items-center justify-center min-w-[56px] h-12 relative active:scale-90 transition-transform"
            aria-label={item.name}
          >
            <div className={`flex items-center justify-center px-4 py-1 rounded-full transition-all duration-200 ${
              isActive 
                ? 'bg-violet-100/80 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300' 
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}>
              <div className="relative">
                <item.icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-violet-700 dark:stroke-violet-300 stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-1 -right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-[#0B0A10]" />
                ) : null}
              </div>
            </div>
          </Link>
        )
      })}
      <Link 
        href="/profile"
        prefetch={true}
        onTouchStart={() => { try { router.prefetch('/profile') } catch {} }}
        className="flex flex-col items-center justify-center min-w-[56px] h-12 active:scale-90 transition-transform"
        aria-label="Profile"
      >
        <div className={`p-0.5 rounded-full transition-all ${
          pathname === '/profile' 
            ? 'ring-2 ring-violet-600 ring-offset-2 dark:ring-offset-[#0B0A10]' 
            : 'opacity-90 hover:opacity-100'
        }`}>
          <img 
            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`} 
            alt="Profile" 
            className="w-6 h-6 rounded-full object-cover"
          />
        </div>
      </Link>
    </nav>
  )
}

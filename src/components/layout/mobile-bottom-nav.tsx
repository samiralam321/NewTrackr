'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Compass, Bell, Mail } from "lucide-react"

export function MobileBottomNav({ profile }: { profile?: any }) {
  const pathname = usePathname()
  const [hideNav, setHideNav] = useState(false)

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

  if (hideNav) return null

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Notifications', href: '/notifications', icon: Bell },
    { name: 'Messages', href: '/messages', icon: Mail },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[calc(4rem+env(safe-area-inset-bottom,0px))] pb-[env(safe-area-inset-bottom,0px)] bg-white/95 dark:bg-[#0B0A10]/95 backdrop-blur-md border-t border-gray-100 dark:border-[#2D2B3B] flex items-center justify-around px-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-colors ${
              isActive 
                ? 'text-violet-600' 
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <item.icon className={`w-6 h-6 ${isActive ? 'fill-violet-50 stroke-violet-600' : ''}`} />
          </Link>
        )
      })}
      <Link 
        href="/profile"
        className={`flex flex-col items-center justify-center w-12 h-12 rounded-full transition-all ${
          pathname === '/profile' ? 'ring-2 ring-violet-600 ring-offset-2' : 'hover:opacity-80'
        }`}
      >
        <img 
          src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`} 
          alt="Profile" 
          className="w-7 h-7 rounded-full object-cover"
        />
      </Link>
    </nav>
  )
}

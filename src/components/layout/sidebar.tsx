'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Compass, Trophy, Medal, Bookmark, Mail, Bell, CheckCircle2, LogOut, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getBadgeLevel } from "@/lib/utils/streak"
import { getUserHandle } from "@/lib/utils/user"
import { InstallButton } from "@/components/pwa/InstallPWA"
import { clearTrackrClientCaches } from "@/lib/cache/client-cache"
import { scrollToFeedTop } from "@/lib/utils/scroll"
import { prefetchNotifications } from "@/lib/notifications/notifications-service"

export function Sidebar({ profile }: { profile?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profileState, setProfileState] = useState(profile)
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0)
  const [activeDays, setActiveDays] = useState([false, false, false, false, false, false, false])
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const supabase = createClient()

  // Contact Creator states
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [isSendingContact, setIsSendingContact] = useState(false)
  const [contactSent, setContactSent] = useState(false)

  // Sync state if initial props change (prevent stale server refreshes from overwriting local state)
  useEffect(() => {
    setProfileState((prev: any) => {
      if (prev && prev.id === profile?.id) {
        const serverScore = profile?.consistency_score || 0
        const localScore = prev.consistency_score || 0
        if (serverScore >= localScore) {
          return profile
        }
        return {
          ...profile,
          consistency_score: prev.consistency_score,
          last_post_date: prev.last_post_date,
          badge_level: prev.badge_level
        }
      }
      return profile
    })
  }, [profile])

  // Listen for custom profile-updated event (handles local updates from posts & profile edits)
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        setProfileState((prev: any) => ({
          ...prev,
          ...customEvent.detail
        }))
      }
    }

    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

  // Prefill user profile name if loaded
  useEffect(() => {
    if (profileState?.full_name) {
      setContactName(profileState.full_name)
    }
  }, [profileState])

  // Eagerly prefetch primary application routes in background for instant 0ms navigation
  useEffect(() => {
    const primaryRoutes = [
      '/dashboard',
      '/profile',
      '/explore',
      '/challenges',
      '/leaderboard',
      '/saved',
      '/messages',
      '/notifications'
    ]
    primaryRoutes.forEach(route => {
      try {
        router.prefetch(route)
      } catch {}
    })
  }, [router])

  const confirmLogout = async () => {
    clearTrackrClientCaches()
    try {
      localStorage.removeItem('trackr_opp_bookmarks')
      localStorage.removeItem('trackr_user_reposts')
    } catch {}
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingContact(true)
    
    try {
      const res = await fetch('/api/contact', {
        method: "POST",
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: contactName,
          email: contactEmail,
          message: contactMessage
        })
      })

      if (!res.ok) {
        throw new Error("Failed to send message")
      }
      
      setContactSent(true)
      setTimeout(() => {
        setIsContactOpen(false)
        setContactSent(false)
        setContactName("")
        setContactEmail("")
        setContactMessage("")
      }, 2000)
    } catch (error) {
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSendingContact(false)
    }
  }

  // Instantly clear badges when user navigates to notifications or messages
  useEffect(() => {
    if (pathname === '/notifications') {
      setUnreadCount(0)
    }
    if (pathname === '/messages') {
      setUnreadMessagesCount(0)
    }
  }, [pathname])

  useEffect(() => {
    if (!profileState?.id) return

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileState.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    const fetchUnreadMessages = async () => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', profileState.id)
        .eq('is_read', false)
      setUnreadMessagesCount(count || 0)
    }

    const fetchActiveDays = async () => {
      const now = new Date()
      let dayOfWeek = now.getDay()
      if (dayOfWeek === 0) dayOfWeek = 7 // Make Sunday = 7
      
      const startOfWeek = new Date(now)
      startOfWeek.setDate(now.getDate() - dayOfWeek + 1)
      startOfWeek.setHours(0, 0, 0, 0)
      
      const { data: posts } = await supabase
        .from('posts')
        .select('created_at')
        .eq('user_id', profileState.id)
        .gte('created_at', startOfWeek.toISOString())
      
      const newActiveDays = [false, false, false, false, false, false, false]
      if (posts) {
        posts.forEach(post => {
          const postDate = new Date(post.created_at)
          let dayIdx = postDate.getDay() - 1
          if (dayIdx === -1) dayIdx = 6 // Map Sunday from -1 to 6
          newActiveDays[dayIdx] = true
        })
      }
      setActiveDays(newActiveDays)
    }

    fetchUnread()
    fetchUnreadMessages()
    fetchActiveDays()

    // Warm up notifications in idle time so clicking 'Notifications' opens instantly
    const prefetchTimer = setTimeout(() => {
      prefetchNotifications(profileState.id)
    }, 400)

    const channel = supabase
      .channel(`sidebar-updates:${profileState.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchUnreadMessages()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        fetchUnreadMessages()
      })
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'posts',
        filter: `user_id=eq.${profileState.id}`
      }, () => {
        fetchActiveDays()
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profileState.id}`
      }, (payload) => {
        if (payload.new) {
          setProfileState(payload.new)
        }
      })
      .subscribe()

    return () => {
      clearTimeout(prefetchTimer)
      supabase.removeChannel(channel)
    }
  }, [profileState?.id])

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Challenges', href: '/challenges', icon: Trophy },
    { name: 'Leaderboard', href: '/leaderboard', icon: Medal },
    { name: 'Saved', href: '/saved', icon: Bookmark },
    { name: 'Messages', href: '/messages', icon: Mail },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ]

  const handlePostClick = () => {
    window.dispatchEvent(new CustomEvent('open-post-modal'))
  }

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (pathname === href || (href === '/dashboard' && pathname === '/')) {
      e.preventDefault()
      scrollToFeedTop()
    }
  }

  return (
    <aside className="w-[260px] xl:w-[285px] 2xl:w-[305px] h-screen sticky top-0 z-30 border-r border-[#eff3f4] dark:border-[#2f3336] bg-white dark:bg-[#000000] flex flex-col pt-2 pb-2 px-2.5 xl:px-3 shrink-0 overflow-y-auto no-scrollbar transition-colors select-none">
      {/* Logo */}
      <Link 
        href="/dashboard" 
        prefetch={true} 
        onClick={(e) => handleNavClick(e, '/dashboard')}
        onMouseEnter={() => { try { router.prefetch('/dashboard') } catch {} }}
        className="flex items-center gap-3 px-3 py-2 mb-2 pt-1 shrink-0 rounded-full hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors w-fit group"
      >
        <img src="/logo.png" alt="Trackr Logo" className="w-10 h-10 object-contain drop-shadow-xs group-hover:scale-105 transition-transform" />
        <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Trackr</span>
      </Link>

      {/* Nav Items - Twitter Navigation Rhythm (20-21px bold typography, 24px icons, rounded-full hover) */}
      <nav className="flex flex-col gap-2 xl:gap-2.5 my-1 shrink-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              prefetch={true}
              onClick={(e) => handleNavClick(e, item.href)}
              onMouseEnter={() => { 
                try { 
                  router.prefetch(item.href) 
                  if (item.href === '/notifications' && profileState?.id) {
                    prefetchNotifications(profileState.id)
                  }
                } catch {} 
              }}
              onTouchStart={() => { 
                try { 
                  router.prefetch(item.href) 
                  if (item.href === '/notifications' && profileState?.id) {
                    prefetchNotifications(profileState.id)
                  }
                } catch {} 
              }}
              className={`flex items-center gap-4 px-4.5 py-3 xl:px-5 xl:py-3 rounded-full transition-all duration-150 relative select-none w-fit min-w-[200px] group ${
                isActive 
                  ? 'text-[#7C3AED] dark:text-[#A78BFA] font-semibold bg-violet-50/70 dark:bg-violet-950/30' 
                  : 'text-[#0f1419] dark:text-[#e7e9ea] font-normal hover:bg-black/[0.04] dark:hover:bg-white/[0.07]'
              }`}
            >
              <div className="relative flex items-center justify-center shrink-0">
                <item.icon className={`w-[23px] h-[23px] transition-transform group-hover:scale-105 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[9.5px] font-bold px-1 rounded-full min-w-[17px] h-[17px] flex items-center justify-center shadow-xs leading-none border-2 border-white dark:border-black z-10">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                {item.name === 'Messages' && unreadMessagesCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-violet-600 text-white text-[9.5px] font-bold px-1 rounded-full min-w-[17px] h-[17px] flex items-center justify-center shadow-xs leading-none border-2 border-white dark:border-black z-10">
                    {unreadMessagesCount}
                  </span>
                )}
              </div>
              <span className="text-[18px] xl:text-[19px] leading-tight">{item.name}</span>
            </Link>
          )
        })}

        {/* Contact Button */}
        <button 
          onClick={() => setIsContactOpen(true)}
          className="flex items-center gap-4 px-4.5 py-3 xl:px-5 xl:py-3 rounded-full transition-all duration-150 text-[#0f1419] dark:text-[#e7e9ea] font-normal hover:bg-black/[0.04] dark:hover:bg-white/[0.07] text-left cursor-pointer w-fit min-w-[200px] group"
        >
          <div className="relative flex items-center justify-center shrink-0">
            <MessageSquare className="w-[23px] h-[23px] stroke-[1.8] group-hover:scale-105 transition-transform" />
          </div>
          <span className="text-[18px] xl:text-[19px] leading-tight">Contact</span>
        </button>

        {/* PWA Install Button */}
        <div className="w-fit">
          <InstallButton 
            className="flex items-center gap-4 px-4.5 py-3 xl:px-5 xl:py-3 rounded-full font-normal text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/30 transition-colors text-left cursor-pointer w-fit min-w-[200px]" 
            iconClassName="w-[23px] h-[23px] stroke-[1.8]"
            textClassName="text-[18px] xl:text-[19px] leading-tight"
          />
        </div>
      </nav>

      {/* Twitter-style Large "Post" Button */}
      <div className="mt-4 mb-3 w-full pr-1">
        <button
          type="button"
          onClick={handlePostClick}
          className="w-full h-[52px] rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-[17px] active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer select-none"
        >
          Post
        </button>
      </div>

      {/* Fixed Bottom Profile & Logout Controls */}
      <div className="mt-auto pt-2 pb-2 border-t border-[#eff3f4] dark:border-[#2f3336] shrink-0">
        <div className="flex items-center justify-between gap-1 w-full select-none">
          {/* Profile Click -> Navigates to /profile */}
          <Link
            href="/profile"
            prefetch={true}
            onMouseEnter={() => { try { router.prefetch('/profile') } catch {} }}
            onTouchStart={() => { try { router.prefetch('/profile') } catch {} }}
            className="flex items-center gap-2.5 min-w-0 flex-1 p-2 rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-colors group cursor-pointer"
          >
            <img 
              src={profileState?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profileState?.full_name || 'User')}&background=7C3AED&color=fff&size=80`} 
              alt="Profile" 
              width={40}
              height={40}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex flex-col overflow-hidden min-w-0">
              <div className="text-[15px] font-bold text-[#0f1419] dark:text-[#e7e9ea] flex items-center gap-1 min-w-0 truncate">
                <span className="truncate">{profileState?.full_name || 'Samir Alam'}</span>
                <VerifiedBadge 
                  showTooltip={false} 
                  level={getBadgeLevel(profileState?.consistency_score, profileState?.full_name || 'Samir Alam')} 
                  nameOrHandle={profileState?.full_name || 'Samir Alam'} 
                />
              </div>
              <span className="text-[14px] text-[#536471] dark:text-[#71767b] font-normal truncate">
                {getUserHandle(profileState)}
              </span>
            </div>
          </Link>

          {/* Logout Button -> Triggers Logout Confirmation Modal */}
          <button 
            type="button"
            onClick={() => setIsLogoutModalOpen(true)}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[#536471] dark:text-[#71767b] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors shrink-0 cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-[18px] h-[18px]" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1A1A24] rounded-[2rem] p-8 md:p-10 max-w-[400px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-bold text-[#0f1419] dark:text-[#e7e9ea] mb-3 tracking-tight">Leaving so soon?</h3>
            <p className="text-[15px] text-[#536471] dark:text-[#71767b] mb-8 px-2 leading-relaxed">
              We're sad to see you go. Are you sure you want to log out of your session?
            </p>
            
            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={() => setIsLogoutModalOpen(false)} 
                className="w-full py-4 rounded-2xl bg-violet-600 hover:bg-violet-700 text-white font-bold transition-all shadow-md hover:shadow-xl hover:shadow-violet-500/20 active:scale-[0.98]"
              >
                Stay Logged In
              </button>
              <button 
                onClick={confirmLogout} 
                className="w-full py-4 rounded-2xl bg-transparent hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 font-bold transition-all active:scale-[0.98]"
              >
                Yes, Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Creator Modal */}
      {isContactOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => !isSendingContact && setIsContactOpen(false)}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-[#1A1A24] w-full max-w-md rounded-3xl p-6 shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-200 border border-gray-100 dark:border-[#2D2B3B]">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Contact Admin / Creator 💬</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Have any feedback, issues, or suggestions? Drop the creator a line directly!</p>
              
              {contactSent ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Message Sent!</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Your message is on its way to the creator's inbox.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                    <input 
                      type="text" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Enter your name" 
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Email</label>
                    <input 
                      type="email" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com" 
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea 
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Type your thoughts here..." 
                      rows={4}
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setIsContactOpen(false)} disabled={isSendingContact} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2D2B3B] rounded-xl transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSendingContact} className="px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                      {isSendingContact ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </aside>
  )
}

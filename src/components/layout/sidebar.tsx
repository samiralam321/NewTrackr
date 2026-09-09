'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Compass, Trophy, Medal, Bookmark, Mail, Bell, CheckCircle2, LogOut, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getBadgeLevel } from "@/lib/utils/streak"
import { InstallButton } from "@/components/pwa/InstallPWA"

export function Sidebar({ profile }: { profile?: any }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profileState, setProfileState] = useState(profile)
  const [unreadCount, setUnreadCount] = useState(0)
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

  const confirmLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingContact(true)
    
    try {
      await fetch('https://formsubmit.co/ajax/sa8103339@gmail.com', {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: contactName,
            email: contactEmail,
            message: contactMessage,
            _subject: "Trackr Creator Contact Form"
        })
      })
      
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

  useEffect(() => {
    if (!profileState?.id) return

    const fetchUnread = async () => {
      if (pathname === '/notifications') {
        setUnreadCount(0)
        return
      }
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profileState.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
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
    fetchActiveDays()

    const channel = supabase
      .channel(`sidebar-updates:${profileState.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
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
      supabase.removeChannel(channel)
    }
  }, [profileState?.id, pathname])

  const navItems = [
    { name: 'Home', href: '/dashboard', icon: Home },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'Challenges', href: '/challenges', icon: Trophy },
    { name: 'Leaderboard', href: '/leaderboard', icon: Medal },
    { name: 'Saved', href: '/saved', icon: Bookmark },
    { name: 'Messages', href: '/messages', icon: Mail },
    { name: 'Notifications', href: '/notifications', icon: Bell },
  ]

  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  
  let displayStreak = profileState?.consistency_score || 0
  if (profileState?.last_post_date) {
    const todayStr = new Date().toISOString().split('T')[0]
    const [currY, currM, currD] = todayStr.split('-').map(Number)
    const [lastY, lastM, lastD] = String(profileState.last_post_date).split('-').map(Number)
    const current = Date.UTC(currY, currM - 1, currD)
    const last = Date.UTC(lastY, lastM - 1, lastD)
    const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24))
    
    // If the last post is older than yesterday in UTC, the streak is broken today
    if (diffDays > 1) {
      displayStreak = 0
    }
  }

  return (
    <aside className="w-[280px] h-screen sticky top-0 z-50 border-r border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] flex flex-col pt-4 pb-4 px-4 shrink-0 overflow-y-auto no-scrollbar transition-colors duration-300">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-3 px-2 mb-4 shrink-0">
        <img src="/logo.png" alt="Trackr Logo" className="w-12 h-12 object-contain drop-shadow-sm scale-[1.2] origin-left" />
        <span className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">Trackr</span>
      </Link>

      {/* Nav Items */}
      <nav className="flex flex-col gap-0.5 mb-4 shrink-0">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors relative ${
                isActive 
                  ? 'bg-[#EEECFF] dark:bg-[#1A1A24] text-violet-600 dark:text-violet-400' 
                  : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A24] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <div className="relative flex items-center justify-center">
                <item.icon className="w-5 h-5" />
                {item.name === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-bold px-1 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center shadow-sm leading-none border-2 border-white dark:border-[#0B0A10] z-10">
                    {unreadCount > 5 ? '5+' : unreadCount}
                  </span>
                )}
              </div>
              {item.name}
            </Link>
          )
        })}

        {/* Contact Button */}
        <button 
          onClick={() => setIsContactOpen(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl font-medium transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A24] hover:text-gray-900 dark:hover:text-white text-left cursor-pointer w-full"
        >
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          Contact
        </button>

        {/* PWA Install Button */}
        <InstallButton />
      </nav>

      {/* Streak Widget */}
      <div className="mb-4 px-2 shrink-0">
        <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-2">Keep your streak alive!</p>
        <div className="flex items-end gap-2.5 mb-3">
          <div className="text-3xl">{displayStreak > 0 ? '🔥' : '⏳'}</div>
          <div className="flex flex-col">
            <span className="text-xl font-bold leading-none text-gray-900 dark:text-white">{displayStreak}</span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">day streak</span>
          </div>
        </div>
        <div className="flex gap-1">
          {days.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-[9px] font-bold text-gray-400">{day}</span>
              {activeDays[i] ? (
                <div className="w-5.5 h-5.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div className="w-5.5 h-5.5 rounded-full bg-gray-100 dark:bg-[#1A1A24] flex items-center justify-center">
                  <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#2D2B3B]"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-[#2D2B3B]/60 shrink-0">
        <div className="mb-3 flex justify-center">
          <ThemeToggle />
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-2">
          <Link href="/profile" className="flex-1 flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors border border-gray-100 dark:border-[#2D2B3B] shadow-sm min-w-0">
            <img 
              src={profileState?.avatar_url || `https://ui-avatars.com/api/?name=${profileState?.full_name || 'User'}&background=7C3AED&color=fff`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover shrink-0"
            />
            <div className="flex flex-col overflow-hidden min-w-0">
              <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 min-w-0">
                <span className="truncate">{profileState?.full_name ? profileState.full_name.split(' ')[0] : 'User'}</span>
                <VerifiedBadge level={getBadgeLevel(profileState?.consistency_score)} />
              </span>
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 truncate">View profile</span>
            </div>
          </Link>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
            title="Log out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-2xl z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1A1A24] rounded-[2rem] p-8 md:p-10 max-w-[400px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">Leaving so soon?</h3>
            <p className="text-base text-gray-500 dark:text-gray-400 mb-8 px-2 leading-relaxed">
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

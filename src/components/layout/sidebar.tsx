'use client'

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Home, Compass, Trophy, Medal, Bookmark, Mail, Bell, CheckCircle2, LogOut, MessageSquare } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { ThemeToggle } from "@/components/theme-toggle"

export function Sidebar({ profile }: { profile?: any }) {
  const pathname = usePathname()
  const router = useRouter()
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

  // Prefill user profile name if loaded
  useEffect(() => {
    if (profile?.full_name) {
      setContactName(profile.full_name)
    }
  }, [profile])

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
    if (!profile?.id) return

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', profile.id)
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
        .eq('user_id', profile.id)
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
      .channel('sidebar-notifications')
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
  }, [profile?.id])

  useEffect(() => {
    if (pathname === '/notifications') {
      setUnreadCount(0)
    }
  }, [pathname])

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
  
  let displayStreak = profile?.consistency_score || 0
  if (profile?.last_post_date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastPost = new Date(profile.last_post_date)
    lastPost.setHours(0, 0, 0, 0)
    
    // If the last post is older than yesterday, the streak is broken today
    if (lastPost < yesterday) {
      displayStreak = 0
    }
  }

  return (
    <aside className="w-[280px] h-screen sticky top-0 z-50 border-r border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] flex flex-col pt-3 pb-3 px-3 shrink-0 transition-colors duration-300">
      {/* Logo */}
      <Link href="/dashboard" className="flex items-center gap-2 px-2 mb-2">
        <img src="/logo.png" alt="Trackr Logo" className="w-10 h-10 object-contain drop-shadow-sm scale-[1.2] origin-left" />
        <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">Trackr</span>
      </Link>

      {/* Scrollable Middle Container */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 flex flex-col no-scrollbar select-none">
        {/* Nav Items */}
        <nav className="flex flex-col gap-0.5 mb-2 shrink-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-1.5 rounded-xl font-semibold text-[14px] transition-colors relative ${
                  isActive 
                    ? 'bg-[#EEECFF] dark:bg-[#1A1A24] text-violet-600 dark:text-violet-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A24] hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <div className="relative flex items-center justify-center">
                  <item.icon className="w-[18px] h-[18px]" />
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
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl font-semibold text-[14px] transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1A1A24] hover:text-gray-900 dark:hover:text-white text-left cursor-pointer w-full"
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-[18px] h-[18px]" />
            </div>
            Contact
          </button>
        </nav>

        {/* Streak Widget */}
        <div className="mt-3 mb-2 px-2 shrink-0">
          <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Keep your streak alive!</p>
          <div className="flex items-end gap-2 mb-2">
            <div className="text-2xl">{displayStreak > 0 ? '🔥' : '⏳'}</div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold leading-none text-gray-900 dark:text-white">{displayStreak}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium">day streak</span>
            </div>
          </div>
          <div className="flex gap-0.5">
            {days.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-0.5">
                <span className="text-[8px] font-bold text-gray-400">{day}</span>
                {activeDays[i] ? (
                  <div className="w-[18px] h-[18px] rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-500 dark:text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-[11px] h-[11px]" />
                  </div>
                ) : (
                  <div className="w-[18px] h-[18px] rounded-full bg-gray-100 dark:bg-[#1A1A24] flex items-center justify-center">
                    <div className="w-1 h-1 rounded-full bg-gray-300 dark:bg-[#2D2B3B]"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fixed Bottom Controls */}
      <div className="mt-1.5 pt-2 border-t border-gray-100 dark:border-[#2D2B3B]/60 shrink-0">
        <div className="mb-1.5 flex justify-center">
          <ThemeToggle />
        </div>

        {/* Profile Info */}
        <div className="flex items-center gap-1.5">
          <Link href="/profile" className="flex-1 flex items-center gap-2.5 px-2.5 py-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors border border-gray-100 dark:border-[#2D2B3B] shadow-sm min-w-0">
            <img 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`} 
              alt="Profile" 
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-gray-900 dark:text-white truncate leading-snug">{profile?.full_name ? profile.full_name.split(' ')[0] : 'User'}</span>
              <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400 truncate">View profile</span>
            </div>
          </Link>
          <button 
            onClick={() => setIsLogoutModalOpen(true)}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors border border-transparent hover:border-red-100 dark:hover:border-red-900/30"
            title="Log out"
          >
            <LogOut className="w-4.5 h-4.5" />
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

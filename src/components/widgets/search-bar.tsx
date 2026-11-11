'use client'

import { useState, useEffect, useRef } from "react"
import { Search, Bell, Sun, Moon, X, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { createClient } from "@/lib/supabase/client"

interface SearchBarProps {
  userProfile?: {
    id?: string
    full_name?: string | null
    avatar_url?: string | null
    username?: string | null
  } | null
}

export function SearchBar({ userProfile }: SearchBarProps) {
  const router = useRouter()
  const { theme, setTheme } = useTheme()
  const [query, setQuery] = useState("")
  const [unreadCount, setUnreadCount] = useState(0)
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  const isDark = theme === 'dark'

  // Local state for the logged-in user profile, initialized with userProfile or cached localStorage
  const [profileState, setProfileState] = useState<{
    id?: string
    full_name?: string | null
    avatar_url?: string | null
    username?: string | null
  } | null>(() => {
    if (userProfile?.avatar_url) return userProfile
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('trackr_current_user_profile')
        if (stored) {
          const parsed = JSON.parse(stored)
          return {
            ...parsed,
            ...(userProfile || {})
          }
        }
      } catch {}
    }
    return userProfile || null
  })

  const [imageError, setImageError] = useState(false)

  // Sync state when userProfile prop changes
  useEffect(() => {
    if (userProfile?.avatar_url || userProfile?.id) {
      setProfileState(prev => {
        const updated = { ...prev, ...userProfile }
        try {
          localStorage.setItem('trackr_current_user_profile', JSON.stringify(updated))
        } catch {}
        return updated
      })
      setImageError(false)
    }
  }, [userProfile])

  // Resolve user profile from Supabase auth session if missing avatar_url
  useEffect(() => {
    let isMounted = true

    const fetchAuthProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .eq('id', user.id)
          .maybeSingle()

        if (profile && isMounted) {
          setProfileState(prev => {
            const merged = { ...prev, ...profile }
            try {
              localStorage.setItem('trackr_current_user_profile', JSON.stringify(merged))
            } catch {}
            return merged
          })
          setImageError(false)
        }
      } catch (e) {
        // Silent fail
      }
    }

    if (!profileState?.avatar_url || !profileState?.id) {
      fetchAuthProfile()
    }

    // Listen for custom profile-updated event (from settings, post creation, avatar upload)
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail && isMounted) {
        setProfileState(prev => {
          const updated = { ...prev, ...customEvent.detail }
          try {
            localStorage.setItem('trackr_current_user_profile', JSON.stringify(updated))
          } catch {}
          return updated
        })
        setImageError(false)
      }
    }

    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => {
      isMounted = false
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [profileState?.avatar_url, profileState?.id, supabase])

  const effectiveUserId = userProfile?.id || profileState?.id

  useEffect(() => {
    if (!effectiveUserId) return

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', effectiveUserId)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const channel = supabase
      .channel(`navbar-notifs:${effectiveUserId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [effectiveUserId, supabase])

  // Live debounced search across profiles and tags
  useEffect(() => {
    if (!query.trim()) {
      setSearchResults([])
      setShowDropdown(false)
      return
    }

    const timer = setTimeout(async () => {
      setIsSearching(true)
      const q = query.trim()
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, college')
        .ilike('full_name', `%${q}%`)
        .limit(4)

      setSearchResults(profiles || [])
      setIsSearching(false)
      setShowDropdown(true)
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      setShowDropdown(false)
      router.push(`/explore?q=${encodeURIComponent(query.trim())}`)
    }
  }

  return (
    <div className="flex items-center gap-2 w-full relative" ref={dropdownRef}>
      {/* Search Input Box */}
      <div className="relative flex-1">
        <Search className="w-[18px] h-[18px] text-[#536471] dark:text-[#71767b] absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowDropdown(true)}
          placeholder="Search"
          className="w-full h-[44px] pl-11 pr-8 text-[15px] font-normal rounded-full bg-[#eff3f4] dark:bg-[#202327] border border-transparent text-[#0f1419] dark:text-[#e7e9ea] placeholder:font-normal placeholder-[#536471] dark:placeholder-[#71767b] focus:bg-white dark:focus:bg-black focus:border-[#7C3AED] focus:outline-none transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setShowDropdown(false); }}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#536471] dark:text-[#71767b] hover:text-[#0f1419] dark:hover:text-white p-0.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#16181c] rounded-2xl border border-[#eff3f4] dark:border-[#2f3336] shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in duration-150">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                >
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=7C3AED&color=fff`}
                    alt={user.full_name || "User"}
                    className="w-9 h-9 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-bold text-[#0f1419] dark:text-[#e7e9ea] truncate">
                      {user.full_name || "Student"}
                    </p>
                    <p className="text-[13px] font-normal text-[#536471] dark:text-[#71767b] truncate">
                      {user.college || "Trackr Student"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-[14px] font-normal text-[#536471] dark:text-[#71767b]">
                {isSearching ? "Searching..." : `No students found for "${query}"`}
              </div>
            )}
            <Link
              href={`/explore?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setShowDropdown(false)}
              className="block text-center text-[14px] font-semibold text-[#7C3AED] hover:text-[#6D28D9] py-2.5 border-t border-[#eff3f4] dark:border-[#2f3336] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
            >
              Search all posts for &ldquo;{query}&rdquo; →
            </Link>
          </div>
        )}
      </div>

      {/* Theme Quick Toggle */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        className="w-9 h-9 rounded-full flex items-center justify-center text-[#536471] dark:text-[#71767b] hover:text-[#0f1419] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] border border-[#eff3f4] dark:border-[#2f3336] transition-transform duration-150 active:scale-90 cursor-pointer shrink-0 relative overflow-hidden"
      >
        <div className="relative w-4 h-4 flex items-center justify-center">
          <Sun className={`w-4 h-4 text-amber-400 absolute transition-all duration-300 transform ${isDark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}`} />
          <Moon className={`w-4 h-4 text-[#7C3AED] absolute transition-all duration-300 transform ${isDark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'}`} />
        </div>
      </button>

      {/* Notifications Icon with Badge */}
      <Link
        href="/notifications"
        title="Notifications"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-[#536471] dark:text-[#71767b] hover:text-[#0f1419] dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.05] border border-[#eff3f4] dark:border-[#2f3336] transition-colors shrink-0"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#7C3AED] ring-2 ring-white dark:ring-black" />
        )}
      </Link>

      {/* User Avatar */}
      <Link
        href="/profile"
        title="Your Profile"
        className="w-9 h-9 rounded-full overflow-hidden border border-[#eff3f4] dark:border-[#2f3336] hover:ring-2 hover:ring-[#7C3AED] hover:ring-offset-2 dark:hover:ring-offset-black transition-all shrink-0 bg-[#eff3f4] dark:bg-[#202327]"
      >
        <img
          src={
            (!imageError && (profileState?.avatar_url || userProfile?.avatar_url))
              ? (profileState?.avatar_url || userProfile?.avatar_url)!
              : `https://ui-avatars.com/api/?name=${encodeURIComponent(profileState?.full_name || userProfile?.full_name || 'Samir')}&background=7C3AED&color=fff&size=80`
          }
          alt={profileState?.full_name || userProfile?.full_name || "Profile"}
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      </Link>
    </div>
  )
}

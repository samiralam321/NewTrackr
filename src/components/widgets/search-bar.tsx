'use client'

import { useState, useEffect, useRef } from "react"
import { Search, Bell, Sun, Moon, X, User } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { createClient } from "@/lib/supabase/client"

interface SearchBarProps {
  userProfile?: {
    id: string
    full_name?: string | null
    avatar_url?: string | null
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

  useEffect(() => {
    if (!userProfile?.id) return

    const fetchUnread = async () => {
      const { count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userProfile.id)
        .eq('is_read', false)
      setUnreadCount(count || 0)
    }

    fetchUnread()

    const channel = supabase
      .channel(`navbar-notifs:${userProfile.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        fetchUnread()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userProfile?.id])

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
    <div className="flex items-center gap-2.5 w-full relative" ref={dropdownRef}>
      {/* Search Input Box */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim() && setShowDropdown(true)}
          placeholder="Search on Trackr..."
          className="w-full pl-9 pr-8 py-2 text-[13.5px] rounded-full bg-gray-50/90 dark:bg-[#1A1A24] border border-gray-200/70 dark:border-[#2D2B3B] text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setShowDropdown(false); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Live Search Results Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A24] rounded-2xl border border-gray-100 dark:border-[#2D2B3B] shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in duration-150">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  onClick={() => setShowDropdown(false)}
                  className="flex items-center gap-3 px-3.5 py-2 hover:bg-gray-50 dark:hover:bg-[#252330] transition-colors"
                >
                  <img
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=7C3AED&color=fff`}
                    alt={user.full_name || "User"}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-semibold text-gray-900 dark:text-white truncate">
                      {user.full_name || "Student"}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                      {user.college || "Trackr Student"}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-3 text-center text-xs text-gray-400">
                {isSearching ? "Searching..." : `No students found for "${query}"`}
              </div>
            )}
            <Link
              href={`/explore?q=${encodeURIComponent(query.trim())}`}
              onClick={() => setShowDropdown(false)}
              className="block text-center text-xs font-semibold text-violet-600 dark:text-violet-400 py-2 border-t border-gray-100 dark:border-[#2D2B3B] hover:bg-gray-50 dark:hover:bg-[#252330] transition-colors"
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
        className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A1A24] border border-gray-200/60 dark:border-[#2D2B3B] transition-colors shrink-0"
      >
        {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-violet-600" />}
      </button>

      {/* Notifications Icon with Badge */}
      <Link
        href="/notifications"
        title="Notifications"
        className="relative w-9 h-9 rounded-full flex items-center justify-center text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1A1A24] border border-gray-200/60 dark:border-[#2D2B3B] transition-colors shrink-0"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-[#0B0A10]" />
        )}
      </Link>

      {/* User Avatar */}
      <Link
        href="/profile"
        title="Your Profile"
        className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 dark:border-[#2D2B3B] hover:ring-2 hover:ring-violet-500 hover:ring-offset-2 dark:hover:ring-offset-black transition-all shrink-0"
      >
        <img
          src={userProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userProfile?.full_name || 'Samir')}&background=7C3AED&color=fff&size=80`}
          alt={userProfile?.full_name || "Profile"}
          width={36}
          height={36}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover"
        />
      </Link>
    </div>
  )
}

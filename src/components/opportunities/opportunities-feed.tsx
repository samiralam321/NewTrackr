'use client'

import { useState, useEffect, useMemo, useRef } from "react"
import { 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  Award, 
  ExternalLink, 
  Bookmark, 
  Sparkles, 
  SlidersHorizontal, 
  X, 
  Briefcase, 
  GraduationCap, 
  Trophy, 
  Code2, 
  Globe2, 
  Flame,
  CheckCircle2
} from "lucide-react"
import { Opportunity, OpportunityCategory, OpportunityMode, OpportunityStats } from "@/lib/opportunities/types"
import { computeDaysRemaining } from "@/lib/opportunities/validators"
import { getCacheEntry, setCacheEntry } from "@/lib/cache/client-cache"
import { OpportunityDetailModal } from "./opportunity-detail-modal"
import { motion, AnimatePresence } from "framer-motion"

interface OpportunitiesFeedProps {
  currentUserId?: string
}

const CATEGORIES: { id: OpportunityCategory | 'All', label: string, icon: any }[] = [
  { id: 'All', label: 'All Opportunities', icon: Sparkles },
  { id: 'Hackathons', label: 'Hackathons', icon: Trophy },
  { id: 'Internships', label: 'Internships', icon: Briefcase },
  { id: 'Scholarships', label: 'Scholarships', icon: GraduationCap },
  { id: 'Coding Competitions', label: 'Competitions', icon: Code2 },
  { id: 'Open Source', label: 'Open Source', icon: Globe2 },
  { id: 'Fellowships', label: 'Fellowships', icon: Award },
  { id: 'Student Programs', label: 'Programs', icon: Flame },
]

export function OpportunitiesFeed({ currentUserId }: OpportunitiesFeedProps) {
  // Query States
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<OpportunityCategory | 'All'>('All')
  const [selectedMode, setSelectedMode] = useState<OpportunityMode | 'All'>('All')
  const [selectedLocation, setSelectedLocation] = useState<'All' | 'India' | 'International' | 'Remote'>('All')
  const [isPaidOnly, setIsPaidOnly] = useState(false)
  const [closingSoonOnly, setClosingSoonOnly] = useState(false)
  const [sortBy, setSortBy] = useState<'latest' | 'closing-soon' | 'most-relevant'>('latest')

  // UI States
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false)
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set())

  // Data States
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [stats, setStats] = useState<OpportunityStats>({
    totalActive: 0,
    hackathonsCount: 0,
    internshipsCount: 0,
    scholarshipsCount: 0,
    codingCompetitionsCount: 0,
    openSourceCount: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isBookmarking, setIsBookmarking] = useState<Record<string, boolean>>({})

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
    }, 250)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Fetch Opportunities from internal API with Client-Side SWR Caching
  useEffect(() => {
    let isMounted = true
    const oppCacheKey = `opps_${debouncedSearch}_${selectedCategory}_${selectedMode}_${selectedLocation}_${isPaidOnly}_${closingSoonOnly}_${sortBy}`
    const cached = getCacheEntry<{ opportunities: Opportunity[], stats: OpportunityStats }>(oppCacheKey, 10 * 60 * 1000)

    // Render immediately from cache if available (0ms perceived latency)
    if (cached) {
      setOpportunities(cached.data.opportunities || [])
      if (cached.data.stats) setStats(cached.data.stats)
      setIsLoading(false)
      if (!cached.isStale) {
        return // Fresh cache, skip background fetch
      }
    }

    const fetchOpportunities = async () => {
      if (!cached) {
        setIsLoading(true)
      }
      try {
        const params = new URLSearchParams()
        if (debouncedSearch) params.set('q', debouncedSearch)
        if (selectedCategory !== 'All') params.set('category', selectedCategory)
        if (selectedMode !== 'All') params.set('mode', selectedMode)
        if (selectedLocation !== 'All') params.set('location', selectedLocation)
        if (isPaidOnly) params.set('paid', 'true')
        if (closingSoonOnly) params.set('closingSoon', 'true')
        if (sortBy) params.set('sort', sortBy)

        const res = await fetch(`/api/opportunities?${params.toString()}`)
        if (!res.ok) throw new Error('Failed to load opportunities')
        const data = await res.json()

        if (isMounted) {
          const freshOpportunities = data.opportunities || []
          const freshStats = data.stats || stats
          setOpportunities(freshOpportunities)
          if (data.stats) setStats(data.stats)

          // Save to client cache
          setCacheEntry(oppCacheKey, {
            opportunities: freshOpportunities,
            stats: freshStats
          })
        }
      } catch (err) {
        console.error("Failed to load opportunities:", err)
      } finally {
        if (isMounted) setIsLoading(false)
      }
    }

    fetchOpportunities()
    return () => {
      isMounted = false
    }
  }, [debouncedSearch, selectedCategory, selectedMode, selectedLocation, isPaidOnly, closingSoonOnly, sortBy])

  // Load user bookmarks
  useEffect(() => {
    const loadBookmarks = async () => {
      try {
        // First check local storage for instantaneous display
        const local = localStorage.getItem('trackr_opp_bookmarks')
        if (local) {
          try {
            const parsed = JSON.parse(local)
            if (Array.isArray(parsed)) {
              setBookmarkedIds(new Set<string>(parsed))
            }
          } catch {}
        }

        // Fetch user's persistent bookmarks from API
        const res = await fetch('/api/opportunities/bookmark')
        if (res.ok) {
          const data = await res.json()
          if (Array.isArray(data.bookmarkedIds)) {
            const set = new Set<string>(data.bookmarkedIds)
            setBookmarkedIds(set)
            localStorage.setItem('trackr_opp_bookmarks', JSON.stringify(data.bookmarkedIds))
          }
        }
      } catch (e) {
        console.warn("Could not load bookmarks:", e)
      }
    }

    loadBookmarks()
  }, [currentUserId])

  // Bookmark Toggle Handler
  const handleToggleBookmark = async (oppId: string) => {
    const isCurrentlyBookmarked = bookmarkedIds.has(oppId)
    const nextSet = new Set(bookmarkedIds)

    if (isCurrentlyBookmarked) {
      nextSet.delete(oppId)
    } else {
      nextSet.add(oppId)
    }

    // Optimistic UI update
    setBookmarkedIds(nextSet)
    localStorage.setItem('trackr_opp_bookmarks', JSON.stringify(Array.from(nextSet)))

    try {
      await fetch('/api/opportunities/bookmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opportunityId: oppId,
          action: isCurrentlyBookmarked ? 'remove' : 'add'
        })
      })
    } catch (e) {
      console.warn("Could not sync bookmark with server:", e)
    }
  }

  // Open Details Modal
  const handleOpenDetails = (opp: Opportunity) => {
    setSelectedOpportunity(opp)
    setIsDetailModalOpen(true)
  }

  return (
    <div className="w-full space-y-4 pb-12 animate-in fade-in duration-200">
      {/* 1. Header & Dynamic Statistics Bar */}
      <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 sm:p-5 shadow-sm transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              Discover Opportunities <span className="inline-block select-none">🚀</span>
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Find hackathons, internships, scholarships and programs worth applying for.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live & Verified
            </span>
          </div>
        </div>

        {/* Dynamic Statistics Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-3 border-t border-gray-100 dark:border-[#1F1D2B]">
          <div className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#151320] border border-gray-100 dark:border-[#221F30]">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Active Opportunities</p>
            <p className="text-base sm:text-lg font-black text-violet-600 dark:text-violet-400 mt-0.5">
              {stats.totalActive}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#151320] border border-gray-100 dark:border-[#221F30]">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Hackathons</p>
            <p className="text-base sm:text-lg font-black text-amber-600 dark:text-amber-400 mt-0.5">
              {stats.hackathonsCount}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#151320] border border-gray-100 dark:border-[#221F30]">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Internships</p>
            <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5">
              {stats.internshipsCount}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-gray-50/70 dark:bg-[#151320] border border-gray-100 dark:border-[#221F30]">
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">Scholarships</p>
            <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
              {stats.scholarshipsCount}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Search & Controls Bar */}
      <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-3 sm:p-4 shadow-sm space-y-3 transition-colors">
        {/* Search Input Row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search hackathons, internships, scholarships, skills..."
              className="w-full pl-10 pr-9 py-2.5 text-xs sm:text-sm bg-gray-50/80 dark:bg-[#151320] text-gray-900 dark:text-white placeholder:text-gray-400 rounded-xl border border-gray-200/80 dark:border-[#2D2B3B] focus:outline-none focus:ring-2 focus:ring-violet-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="hidden sm:block py-2.5 px-3 text-xs font-semibold bg-gray-50/80 dark:bg-[#151320] text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200/80 dark:border-[#2D2B3B] focus:outline-none focus:ring-2 focus:ring-violet-500/50 cursor-pointer"
          >
            <option value="latest">Latest</option>
            <option value="closing-soon">Closing Soon</option>
            <option value="most-relevant">Most Relevant</option>
          </select>

          {/* Filter Panel Toggle */}
          <button
            onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
            className={`flex items-center gap-1.5 py-2.5 px-3.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              isFilterDropdownOpen || isPaidOnly || closingSoonOnly || selectedMode !== 'All' || selectedLocation !== 'All'
                ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
                : 'bg-gray-50/80 dark:bg-[#151320] text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-[#2D2B3B] hover:bg-gray-100 dark:hover:bg-[#1F1C2D]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Filters</span>
            {(isPaidOnly || closingSoonOnly || selectedMode !== 'All' || selectedLocation !== 'All') && (
              <span className="w-2 h-2 rounded-full bg-violet-600"></span>
            )}
          </button>
        </div>

        {/* 3. Category Filter Chips (Horizontally Scrollable) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1 pb-0.5 -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id
            const Icon = cat.icon
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer select-none ${
                  isSelected
                    ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25 ring-2 ring-violet-500/30'
                    : 'bg-gray-100/80 dark:bg-[#1A1825] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/70 dark:hover:bg-[#252233]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-gray-400 dark:text-gray-500'}`} />
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Advanced Filters Expandable Drawer */}
        <AnimatePresence>
          {isFilterDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="pt-3 border-t border-gray-100 dark:border-[#1F1D2B] overflow-hidden space-y-3"
            >
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Mode Select */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                    Event Mode
                  </label>
                  <select
                    value={selectedMode}
                    onChange={(e) => setSelectedMode(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 text-xs bg-gray-50 dark:bg-[#151320] text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-[#2D2B3B]"
                  >
                    <option value="All">All Modes (Online & Offline)</option>
                    <option value="Online">Online / Virtual</option>
                    <option value="Offline">Offline / In-person</option>
                    <option value="Hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Location Select */}
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-1">
                    Location Scope
                  </label>
                  <select
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(e.target.value as any)}
                    className="w-full py-1.5 px-2.5 text-xs bg-gray-50 dark:bg-[#151320] text-gray-900 dark:text-white rounded-lg border border-gray-200 dark:border-[#2D2B3B]"
                  >
                    <option value="All">All Locations</option>
                    <option value="India">India</option>
                    <option value="Remote">Remote</option>
                    <option value="International">International</option>
                  </select>
                </div>

                {/* Quick Toggle Checkboxes */}
                <div className="flex flex-col justify-end gap-2 pt-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isPaidOnly}
                      onChange={(e) => setIsPaidOnly(e.target.checked)}
                      className="rounded text-violet-600 focus:ring-violet-500 w-3.5 h-3.5"
                    />
                    <span>With Stipend / Cash Prize</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={closingSoonOnly}
                      onChange={(e) => setClosingSoonOnly(e.target.checked)}
                      className="rounded text-violet-600 focus:ring-violet-500 w-3.5 h-3.5"
                    />
                    <span>Closing Soon (≤ 7 Days)</span>
                  </label>
                </div>
              </div>

              {/* Reset Filters button */}
              {(selectedMode !== 'All' || selectedLocation !== 'All' || isPaidOnly || closingSoonOnly || searchQuery) && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => {
                      setSelectedMode('All')
                      setSelectedLocation('All')
                      setIsPaidOnly(false)
                      setClosingSoonOnly(false)
                      setSearchQuery("")
                    }}
                    className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
                  >
                    Reset all filters
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 4. Opportunity Feed Cards List */}
      {isLoading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-5 shadow-sm animate-pulse space-y-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-[#1A1825]"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-[#1A1825] rounded w-1/3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-[#1A1825] rounded w-1/4"></div>
                </div>
              </div>
              <div className="h-10 bg-gray-100 dark:bg-[#151320] rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center mx-auto text-xl">
            🔍
          </div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white">
            No opportunities found
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            Try adjusting your search query, selecting "All Opportunities", or clearing some filters.
          </p>
          <button
            onClick={() => {
              setSelectedCategory('All')
              setSelectedMode('All')
              setSelectedLocation('All')
              setIsPaidOnly(false)
              setClosingSoonOnly(false)
              setSearchQuery("")
            }}
            className="px-4 py-2 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 text-xs font-bold hover:bg-violet-100 transition-colors"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {opportunities.map((opp) => {
            const daysRemaining = computeDaysRemaining(opp.registration_deadline)
            const isClosingSoon = daysRemaining <= 7 && daysRemaining >= 0
            const isBookmarked = bookmarkedIds.has(opp.id)

            return (
              <article
                key={opp.id}
                className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all duration-200 group dark:hover:border-violet-900/40 relative overflow-hidden"
              >
                {/* Top Row: Logo, Title, Organizer & Badges */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-start gap-3 min-w-0">
                    {opp.organizer_logo ? (
                      <div className="w-10 h-10 rounded-xl bg-white dark:bg-[#1A1825] border border-gray-100 dark:border-[#2D2B3B] p-1.5 flex items-center justify-center shrink-0 shadow-xs">
                        <img
                          src={opp.organizer_logo}
                          alt={opp.organizer}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 font-bold text-sm flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-800/40">
                        {opp.organizer.charAt(0)}
                      </div>
                    )}

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/40">
                          {opp.category}
                        </span>

                        <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                          • {opp.mode}
                        </span>

                        {opp.is_featured && (
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40 flex items-center gap-0.5">
                            ★ Featured
                          </span>
                        )}
                      </div>

                      <h3
                        onClick={() => handleOpenDetails(opp)}
                        className="text-base sm:text-[17px] font-bold text-gray-900 dark:text-white hover:text-violet-600 dark:hover:text-violet-400 transition-colors cursor-pointer truncate"
                      >
                        {opp.title}
                      </h3>

                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {opp.organizer}
                      </p>
                    </div>
                  </div>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => handleToggleBookmark(opp.id)}
                    aria-label="Bookmark opportunity"
                    className={`p-2 rounded-xl transition-all cursor-pointer ${
                      isBookmarked
                        ? 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#1A1825]'
                    }`}
                  >
                    <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                  </button>
                </div>

                {/* Description */}
                <p className="text-xs sm:text-[13.5px] text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed mb-3">
                  {opp.description}
                </p>

                {/* Skills tags */}
                {opp.skills && opp.skills.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                    {opp.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-gray-50 dark:bg-[#1A1825] text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-[#2D2B3B]"
                      >
                        {skill}
                      </span>
                    ))}
                    {opp.skills.length > 4 && (
                      <span className="text-[11px] text-gray-400 font-medium">
                        +{opp.skills.length - 4} more
                      </span>
                    )}
                  </div>
                )}

                {/* Bottom Strip: Metadata + Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-[#1F1D2B]">
                  {/* Left: Deadline & Reward */}
                  <div className="flex items-center gap-3 sm:gap-4 text-xs font-semibold flex-wrap">
                    <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>{opp.registration_deadline}</span>
                    </span>

                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      isClosingSoon
                        ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/30 dark:text-red-300 dark:border-red-800/40'
                        : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800/40'
                    }`}>
                      {daysRemaining <= 0 ? 'Closes Today' : isClosingSoon ? `${daysRemaining} days left` : 'Active'}
                    </span>

                    {(opp.prize_pool || opp.stipend) && (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" />
                        <span className="truncate max-w-[150px]">{opp.prize_pool || opp.stipend}</span>
                      </span>
                    )}
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenDetails(opp)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1825] border border-gray-200/80 dark:border-[#2D2B3B] transition-colors cursor-pointer"
                    >
                      View Details
                    </button>

                    <a
                      href={opp.application_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white shadow-xs transition-all"
                    >
                      <span>Apply Now</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      )}

      {/* 5. Inline Opportunity Detail Modal */}
      <OpportunityDetailModal
        opportunity={selectedOpportunity}
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        isBookmarked={selectedOpportunity ? bookmarkedIds.has(selectedOpportunity.id) : false}
        onToggleBookmark={handleToggleBookmark}
      />
    </div>
  )
}

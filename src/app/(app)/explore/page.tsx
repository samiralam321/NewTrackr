'use client'

import { useState, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Compass, Search, Sparkles, X, Hash, TrendingUp } from "lucide-react"
import { Feed } from "@/components/dashboard/feed"

export default function ExplorePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const activeTag = searchParams.get('tag') || ''
  const [searchInput, setSearchInput] = useState(activeTag)

  // Sync state with URL params
  useEffect(() => {
    setSearchInput(activeTag)
  }, [activeTag])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    applySearch(searchInput.trim())
  }

  const applySearch = (tagVal: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (tagVal) {
      // Ensure it starts with #
      const formatted = tagVal.startsWith('#') ? tagVal : `#${tagVal}`
      params.set('tag', formatted)
      setSearchInput(formatted)
    } else {
      params.delete('tag')
      setSearchInput("")
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const clearSearch = () => {
    applySearch("")
  }

  const popularTags = [
    { name: "#DSA", desc: "Data Structures & Algorithms" },
    { name: "#Coding", desc: "General Programming" },
    { name: "#React", desc: "Frontend UI building" },
    { name: "#NextJS", desc: "Fullstack App framework" },
    { name: "#WebDev", desc: "Web applications" },
    { name: "#Consistency", desc: "Daily coding habits" }
  ]

  return (
    <div className="flex-1 min-h-screen bg-[#FCFBFF] dark:bg-[#050505] transition-colors duration-300 pb-20">
      <main className="max-w-3xl mx-auto px-4 md:px-8 py-6 md:py-10 flex flex-col gap-6">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl text-violet-600 dark:text-violet-400">
              <Compass className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white">Explore</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Discover hashtags and community progress</p>
            </div>
          </div>

          {/* SEARCH BOX */}
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input 
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search hashtag (e.g. #DSA)..."
              className="w-full pl-12 pr-10 py-3.5 bg-white dark:bg-[#0B0A10] border border-gray-200/80 dark:border-[#2D2B3B] text-gray-900 dark:text-white placeholder-gray-400 text-[15px] font-medium rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-500 shadow-sm transition-all"
            />
            {searchInput && (
              <button 
                type="button"
                onClick={clearSearch}
                className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>

        {/* POPULAR TAGS CAROUSEL/GRID */}
        {!activeTag && (
          <div className="bg-white dark:bg-[#0B0A10] rounded-3xl border border-gray-100 dark:border-[#2D2B3B] p-5 shadow-sm">
            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 mb-4">
              <TrendingUp className="w-4 h-4 text-violet-500" /> Trending Topics
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {popularTags.map((t) => (
                <button
                  key={t.name}
                  onClick={() => applySearch(t.name)}
                  className="flex flex-col items-start p-3 bg-gray-50/55 dark:bg-[#1A1A24]/55 hover:bg-violet-50/50 dark:hover:bg-violet-950/20 border border-gray-100 dark:border-[#2D2B3B] hover:border-violet-200 dark:hover:border-violet-900/30 rounded-2xl text-left transition-all group duration-200"
                >
                  <span className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-0.5 mb-0.5">
                    <Hash className="w-3.5 h-3.5 shrink-0" />
                    {t.name.slice(1)}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors line-clamp-1">
                    {t.desc}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* FEED ZONE */}
        <div className="flex flex-col gap-4">
          {activeTag ? (
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-500">Showing posts with:</span>
                <span className="px-3 py-1 bg-violet-50 dark:bg-violet-900/20 border border-violet-100 dark:border-violet-800 text-violet-600 dark:text-violet-400 rounded-full text-xs font-bold flex items-center gap-0.5">
                  <Hash className="w-3.5 h-3.5 shrink-0" />
                  {activeTag.startsWith('#') ? activeTag.slice(1) : activeTag}
                </span>
              </div>
              <button 
                onClick={clearSearch} 
                className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Show All
              </button>
            </div>
          ) : (
            <div className="px-1 flex items-center gap-1.5 text-sm font-extrabold text-gray-900 dark:text-white">
              <Sparkles className="w-4 h-4 text-violet-500 animate-pulse" /> Latest Activity
            </div>
          )}

          {/* Render Feed with active hashtag filter */}
          <Feed hashtagFilter={activeTag || undefined} />
        </div>

      </main>
    </div>
  )
}

'use client'

import Link from "next/link"
import { Flame, ArrowUpRight } from "lucide-react"

interface TrendingTopic {
  rank: number
  title: string
  postsCount: string
  tag: string
}

const TRENDING_TOPICS: TrendingTopic[] = [
  { rank: 1, title: "SIH 2026", postsCount: "12.4k posts", tag: "#Hackathon" },
  { rank: 2, title: "Placements 2027", postsCount: "8.9k posts", tag: "#Placement" },
  { rank: 3, title: "DSA Patterns", postsCount: "7.1k posts", tag: "#DSA" },
  { rank: 4, title: "College Life", postsCount: "5.3k posts", tag: "#College" },
  { rank: 5, title: "Web Dev vs App Dev", postsCount: "4.8k posts", tag: "#Tech" },
]

export function TrendingWidget() {
  return (
    <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-violet-600 dark:text-violet-400 fill-violet-600/20" />
          <h3 className="text-[14.5px] font-bold text-gray-900 dark:text-white">Trending Now</h3>
        </div>
        <Link
          href="/explore"
          className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors flex items-center gap-0.5"
        >
          See all →
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {TRENDING_TOPICS.map((topic) => (
          <Link
            key={topic.rank}
            href={`/explore?tag=${encodeURIComponent(topic.tag.replace('#', ''))}`}
            className="flex items-center justify-between group p-1.5 -mx-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors"
          >
            <div className="flex items-start gap-3 min-w-0">
              <span className="text-[12px] font-bold text-gray-400 dark:text-gray-500 w-3 text-center mt-0.5">
                {topic.rank}
              </span>
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                  {topic.title}
                </p>
                <p className="text-[11.5px] text-gray-400 dark:text-gray-500 font-medium">
                  {topic.postsCount}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-100 dark:border-violet-800/40 shrink-0 group-hover:border-violet-300 dark:group-hover:border-violet-700 transition-colors">
              {topic.tag}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

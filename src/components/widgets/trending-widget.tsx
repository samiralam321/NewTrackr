'use client'

import Link from "next/link"

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
    <div className="bg-[#f7f9f9] dark:bg-[#16181c] border border-[#eff3f4] dark:border-[#2f3336] rounded-2xl overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
        <h3 className="text-[17px] font-extrabold text-[#0f1419] dark:text-[#e7e9ea]">
          What&apos;s happening
        </h3>
      </div>

      {/* List */}
      <div>
        {TRENDING_TOPICS.map((topic) => (
          <Link
            key={topic.rank}
            href={`/explore?tag=${encodeURIComponent(topic.tag.replace('#', ''))}`}
            className="px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors flex items-center justify-between group cursor-pointer"
          >
            <div className="min-w-0 pr-2">
              <p className="text-[12px] text-[#536471] dark:text-[#71767b] font-normal leading-4">
                Trending in Tech • {topic.tag}
              </p>
              <p className="text-[14.5px] font-bold text-[#0f1419] dark:text-[#e7e9ea] leading-5 mt-0.5 truncate group-hover:underline">
                {topic.title}
              </p>
              <p className="text-[12px] text-[#536471] dark:text-[#71767b] font-normal leading-4 mt-0.5">
                {topic.postsCount}
              </p>
            </div>

            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40 shrink-0">
              #{topic.rank}
            </span>
          </Link>
        ))}
      </div>

      {/* Footer / Show more */}
      <Link
        href="/explore"
        className="px-4 py-3.5 text-[14px] font-medium text-[#7C3AED] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] block transition-colors"
      >
        Show more
      </Link>
    </div>
  )
}

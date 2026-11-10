'use client'

import Link from "next/link"
import { Calendar, ExternalLink } from "lucide-react"

interface HackathonItem {
  id: string
  name: string
  dates: string
  prize: string
  url: string
  logoType: 'sih' | 'amazon' | 'flipkart'
}

const HACKATHONS: HackathonItem[] = [
  {
    id: "sih-2026",
    name: "SIH 2026",
    dates: "Mar 1 - Apr 30, 2026",
    prize: "₹1.5 Cr+",
    url: "https://www.sih.gov.in/",
    logoType: "sih"
  },
  {
    id: "amazon-ml-2026",
    name: "Amazon ML Challenge",
    dates: "Jan 12 - Feb 20, 2026",
    prize: "₹50 Lakh",
    url: "https://www.hackerearth.com/challenges/hackathon/amazon-ml-challenge-2026/",
    logoType: "amazon"
  },
  {
    id: "flipkart-grid-6",
    name: "Flipkart Grid 6.0",
    dates: "Feb 5 - Mar 5, 2026",
    prize: "₹30 Lakh",
    url: "https://unstop.com/hackathons/flipkart-grid-60-flipkart-1002341",
    logoType: "flipkart"
  }
]

function HackathonLogo({ type }: { type: HackathonItem['logoType'] }) {
  if (type === 'sih') {
    return (
      <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
        <span className="text-base select-none">💡</span>
      </div>
    )
  }
  if (type === 'amazon') {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
        <span className="tracking-tighter">amzn</span>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-amber-400 text-blue-950 font-bold text-xs flex items-center justify-center shrink-0">
      <span>🛍️</span>
    </div>
  )
}

export function UpcomingHackathons() {
  return (
    <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-[14.5px] font-bold text-gray-900 dark:text-white">Upcoming Hackathons</h3>
        </div>
        <Link
          href="/challenges"
          className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors flex items-center gap-0.5"
        >
          See all →
        </Link>
      </div>

      {/* List */}
      <div className="space-y-3">
        {HACKATHONS.map((hackathon) => (
          <a
            key={hackathon.id}
            href={hackathon.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between group p-1.5 -mx-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <HackathonLogo type={hackathon.logoType} />
              <div className="min-w-0">
                <p className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                  {hackathon.name}
                </p>
                <p className="text-[11.5px] text-gray-400 dark:text-gray-500 font-medium">
                  {hackathon.dates}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40 shrink-0">
              {hackathon.prize}
            </span>
          </a>
        ))}
      </div>
    </div>
  )
}

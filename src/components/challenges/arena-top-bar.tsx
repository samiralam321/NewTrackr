"use client"

import React, { useState } from "react"
import { Search, Flame, Shield, Calendar, ChevronDown } from "lucide-react"
import Link from "next/link"

interface ArenaTopBarProps {
  streak?: number
  rank?: string | number
  solvedCount?: number
  userAvatar?: string | null
  userName?: string | null
}

export function ArenaTopBar({
  streak = 3,
  rank = "Silver",
  solvedCount = 12,
  userAvatar,
  userName = "User"
}: ArenaTopBarProps) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="w-full flex flex-col md:flex-row items-center justify-between gap-4 mb-6 md:mb-7">
      {/* Left: Search Box */}
      <div className="w-full md:w-auto md:min-w-[360px] lg:min-w-[390px]">
        <div className="w-full bg-white border border-[#EBE6F7] rounded-2xl px-4 py-2.5 flex items-center gap-3 shadow-xs shadow-purple-900/5 transition-all focus-within:border-[#7628F5] focus-within:ring-2 focus-within:ring-purple-100">
          <Search className="w-4 h-4 text-gray-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search challenges, topics, or users..."
            className="w-full bg-transparent text-[13.5px] text-[#17152F] placeholder:text-gray-400 font-normal outline-none"
          />
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#F5F3F8] border border-gray-200/60 text-[11px] font-medium text-gray-400 select-none shrink-0">
            <span>Ctrl</span>
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Right: Quick Stats Pills & Profile Avatar */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap justify-end w-full md:w-auto shrink-0">
        {/* Streak Pill */}
        <div className="bg-white border border-[#EBE6F7] rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-xs shadow-purple-900/5 select-none hover:border-purple-200 transition-colors">
          <Flame className="w-4 h-4 text-orange-500 fill-orange-500 shrink-0" />
          <span className="text-[13px] font-bold text-[#17152F]">
            {streak} Days
          </span>
        </div>

        {/* Rank Pill */}
        <div className="bg-white border border-[#EBE6F7] rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-xs shadow-purple-900/5 select-none hover:border-purple-200 transition-colors">
          <Shield className="w-4 h-4 text-[#7628F5] stroke-[2.2] shrink-0" />
          <span className="text-[13px] font-bold text-[#17152F]">
            {rank}
          </span>
        </div>

        {/* Solved Count Pill */}
        <div className="bg-white border border-[#EBE6F7] rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-xs shadow-purple-900/5 select-none hover:border-purple-200 transition-colors">
          <Calendar className="w-4 h-4 text-[#7628F5] stroke-[2.2] shrink-0" />
          <span className="text-[13px] font-bold text-[#17152F]">
            {solvedCount} Solved
          </span>
        </div>

        {/* Avatar with dropdown caret */}
        <Link
          href="/profile"
          className="flex items-center gap-1.5 pl-1 pr-1 py-1 rounded-full hover:bg-black/5 transition-colors cursor-pointer"
        >
          <img
            src={userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || "User")}&background=7628F5&color=fff&size=80`}
            alt={userName || "User"}
            className="w-9 h-9 rounded-full object-cover ring-2 ring-purple-100 shadow-xs"
          />
          <ChevronDown className="w-3.5 h-3.5 text-gray-600" />
        </Link>
      </div>
    </div>
  )
}

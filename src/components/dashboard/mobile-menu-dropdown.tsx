'use client'

import { useState, useRef, useEffect } from "react"
import { Menu, Trophy, Medal, Bookmark, Bell } from "lucide-react"
import Link from "next/link"

export function MobileMenuDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className="md:hidden relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 -ml-1 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors focus:outline-none"
      >
        <Menu className="w-7 h-7" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-56 bg-white dark:bg-[#1A1A24] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-[#2D2B3B] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="py-2">
            <Link href="/challenges" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Trophy className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Challenge</span>
            </Link>
            <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Medal className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Leaderboard</span>
            </Link>
            <Link href="/saved" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Bookmark className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Saved Message</span>
            </Link>
            <Link href="/notifications" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Bell className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Notification</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

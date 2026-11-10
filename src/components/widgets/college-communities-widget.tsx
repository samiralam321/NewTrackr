'use client'

import Link from "next/link"
import { Users, ArrowRight } from "lucide-react"

export function CollegeCommunitiesWidget() {
  return (
    <Link
      href="/explore"
      className="block group relative overflow-hidden rounded-2xl p-4 bg-gradient-to-br from-violet-50/80 via-white to-purple-50/50 dark:from-[#151224] dark:via-[#0B0A10] dark:to-[#181329] border border-violet-100 dark:border-violet-900/30 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-700/60 transition-all duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left Icon + Text */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-600/10 dark:bg-violet-500/20 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-[13.5px] font-bold text-gray-900 dark:text-white leading-tight">
              Join College Communities
            </h4>
            <p className="text-[11.5px] text-gray-500 dark:text-gray-400 font-medium truncate mt-0.5">
              Connect with students from your college
            </p>
          </div>
        </div>

        {/* Right Stacked Avatars + Arrow */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex -space-x-2">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=64&h=64&fit=crop&crop=faces"
              alt="Student"
              className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0B0A10] object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=64&h=64&fit=crop&crop=faces"
              alt="Student"
              className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0B0A10] object-cover"
            />
            <img
              src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=64&h=64&fit=crop&crop=faces"
              alt="Student"
              className="w-6 h-6 rounded-full border-2 border-white dark:border-[#0B0A10] object-cover"
            />
          </div>
          <div className="w-6 h-6 rounded-full bg-violet-600 text-white flex items-center justify-center group-hover:translate-x-0.5 transition-transform">
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  )
}

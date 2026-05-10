import { Feed } from "@/components/dashboard/feed"
import { Bookmark, ChevronLeft } from "lucide-react"
import Link from "next/link"

export default function SavedPage() {
  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 bg-[#FCFBFF] dark:bg-[#050505] transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="md:hidden p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl md:flex hidden items-center justify-center text-violet-600 dark:text-violet-400 transition-colors">
            <Bookmark className="w-5 h-5 fill-current" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Saved Posts</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm transition-colors md:ml-0 ml-[2px]">Your personal collection of useful progress.</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0A10] rounded-3xl border border-gray-100 dark:border-[#2D2B3B] p-6 shadow-sm min-h-[500px] transition-colors duration-300">
          <Feed savedOnlyFilter={true} />
        </div>
      </div>
    </div>
  )
}

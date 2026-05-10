import { createClient } from "@/lib/supabase/server"
import { Medal, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { LeaderboardClient } from "@/components/leaderboard/leaderboard-client"

export default async function LeaderboardPage() {
  const supabase = await createClient()

  const todayObj = new Date()
  const dates = []
  
  // 1. Yesterday
  const yesterday = new Date(todayObj)
  yesterday.setDate(todayObj.getDate() - 1)
  dates.push(yesterday.toISOString().split('T')[0])
  
  // 2. Today
  const todayStr = todayObj.toISOString().split('T')[0]
  dates.push(todayStr)
  
  // 3. Next 3 dates (chronological order)
  for (let i = 1; i <= 3; i++) {
    const d = new Date(todayObj)
    d.setDate(todayObj.getDate() + i)
    dates.push(d.toISOString().split('T')[0])
  }

  // Fetch the most recent challenge date to use as default, fallback to today
  const { data: latestChallenge } = await supabase
    .from('daily_challenges')
    .select('date')
    .order('date', { ascending: false })
    .limit(1)
    .single()
  
  const defaultDate = latestChallenge?.date || todayStr
  
  // Ensure defaultDate is in the tabs if it's older than yesterday
  if (!dates.includes(defaultDate)) {
    dates.unshift(defaultDate)
  }

  return (
    <div className="flex h-screen w-full bg-[#FCFBFF] dark:bg-[#050505] transition-colors duration-300">
      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8">
        
        <header className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="md:hidden p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div className="w-12 h-12 bg-violet-100 dark:bg-violet-900/20 rounded-2xl flex items-center justify-center hidden md:flex shadow-inner">
              <Medal className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Arena Leaderboard
              </h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium mt-0.5">See how you stack up against the best minds.</p>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3 px-5 py-3 bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl shadow-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Live Rankings</span>
          </div>
        </header>

        <LeaderboardClient dates={dates} defaultDate={defaultDate} />

      </main>
    </div>
  )
}

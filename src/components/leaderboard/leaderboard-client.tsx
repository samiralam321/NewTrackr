"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Trophy, Star, Loader2 } from "lucide-react"
import Link from "next/link"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getBadgeLevel } from "@/lib/utils/streak"

export function LeaderboardClient({ dates, defaultDate }: { dates: string[], defaultDate: string }) {
  const [activeDate, setActiveDate] = useState(defaultDate)
  const [attempts, setAttempts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const supabase = createClient()

  const fetchAttempts = async (date: string) => {
    setIsLoading(true)
    const { data } = await supabase
      .from('attempts')
      .select(`
        score,
        accuracy,
        time_taken,
        profiles ( id, full_name, avatar_url, challenge_rank, consistency_score )
      `)
      .eq('challenge_date', date)
      .order('score', { ascending: false })
      .order('time_taken', { ascending: true })
      .limit(50)
      
    setAttempts(data || [])
    setIsLoading(false)
  }

  useEffect(() => {
    setIsMounted(true)
    fetchAttempts(activeDate)

    const channel = supabase.channel('realtime_leaderboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'attempts' }, (payload) => {
        if (payload.new && (payload.new as any).challenge_date === activeDate) {
           // Refetch to maintain perfectly correct ordering of top 50
           fetchAttempts(activeDate)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [activeDate])

  const formatDateLabel = (dateStr: string) => {
    const today = new Date().toISOString().split('T')[0]
    if (dateStr === today) return "Today"
    
    const date = new Date(dateStr)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toISOString().split('T')[0] === yesterday.toISOString().split('T')[0]) return "Yesterday"
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (!isMounted) return null;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* Date Tabs */}
      <div className="flex items-center justify-center lg:justify-start w-full max-w-full">
        <div className="h-14 bg-gray-50/80 dark:bg-[#1A1A24]/80 p-1.5 rounded-2xl flex items-center shadow-inner gap-2 sm:gap-3 overflow-x-auto border border-gray-100 dark:border-[#2D2B3B] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {dates.map(date => (
            <button 
              key={date}
              onClick={() => setActiveDate(date)}
              className={`flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 h-full text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeDate === date ? 'bg-white dark:bg-[#2D2B3B] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              {formatDateLabel(date)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-[#0B0A10] rounded-3xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-[#2D2B3B] flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" /> Global Top 50
          </h3>
          <span className="text-sm font-semibold text-gray-400 bg-gray-50 dark:bg-[#1A1A24] px-3 py-1 rounded-full">{formatDateLabel(activeDate)}</span>
        </div>
        
        <div className="divide-y divide-gray-100 dark:divide-[#2D2B3B]">
          {isLoading ? (
             <div className="p-12 flex justify-center items-center">
               <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
             </div>
          ) : attempts.length > 0 ? (
            attempts.map((attempt: any, index: number) => (
            <div key={index} className="p-4 md:p-6 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors">
              <div className="w-8 text-center font-bold text-gray-400 dark:text-gray-500">
                #{index + 1}
              </div>
              <img 
                src={attempt.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${attempt.profiles?.full_name || 'User'}&background=7C3AED&color=fff`} 
                alt="" 
                className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 dark:border-[#2D2B3B]"
              />
              <div className="flex-1">
                <Link href={`/profile/${attempt.profiles?.id}`} className="inline-flex items-center gap-2 hover:underline decoration-violet-500 decoration-2 underline-offset-2">
                  <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5 transition-colors hover:text-violet-600 dark:hover:text-violet-400">
                    <span>{attempt.profiles?.full_name}</span>
                    <VerifiedBadge level={getBadgeLevel(attempt.profiles?.consistency_score)} />
                    {index === 0 && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                  </h4>
                </Link>
                <p className={`text-xs font-semibold ${
                  attempt.accuracy === 100 ? 'text-cyan-600 dark:text-cyan-400' :
                  attempt.accuracy >= 80 ? 'text-yellow-600 dark:text-yellow-400' :
                  attempt.accuracy >= 60 ? 'text-slate-600 dark:text-slate-400' :
                  attempt.accuracy >= 40 ? 'text-orange-600 dark:text-orange-400' :
                  'text-gray-500 dark:text-gray-400'
                }`}>
                  {attempt.accuracy === 100 ? 'Diamond' :
                   attempt.accuracy >= 80 ? 'Gold' :
                   attempt.accuracy >= 60 ? 'Silver' :
                   attempt.accuracy >= 40 ? 'Bronze' : 'Unranked'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-gray-900 dark:text-white">{attempt.score}</p>
                <p className="text-xs font-medium text-gray-500">{attempt.accuracy}% Acc • {Math.floor(attempt.time_taken/60)}m {attempt.time_taken%60}s</p>
              </div>
            </div>
          ))) : (
            <div className="p-12 text-center text-gray-500">
              No attempts recorded for this date yet. Be the first to conquer the arena!
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

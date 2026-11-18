import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUserAndProfile } from "@/lib/auth/get-user-profile"
import { Trophy, Clock } from "lucide-react"
import { QuizScreen } from "@/components/challenges/quiz-screen"
import { ResultScreen } from "@/components/challenges/result-screen"
import { FeatureCards } from "@/components/challenges/feature-cards"
import { ArenaTopBar } from "@/components/challenges/arena-top-bar"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function ChallengesPage() {
  const { user, profile } = await getAuthenticatedUserAndProfile()

  if (!user) {
    redirect('/auth')
  }

  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]

  let dailyChallenge = null
  const { data: todayChallenge } = await supabase
    .from('daily_challenges')
    .select('question_ids, date')
    .eq('date', today)
    .maybeSingle()
  
  if (todayChallenge) {
    dailyChallenge = todayChallenge
  } else {
    // Generate fresh quiz for today (Just-In-Time)
    const { data: allQuestions } = await supabase
      .from('questions')
      .select('id')
      
    if (allQuestions && allQuestions.length >= 5) {
      // Shuffle and pick 5 unique questions
      const shuffled = allQuestions.sort(() => 0.5 - Math.random())
      const selectedIds = shuffled.slice(0, 5).map(q => q.id)
      
      const { data: newChallenge, error } = await supabase
        .from('daily_challenges')
        .insert({
          date: today,
          question_ids: selectedIds
        })
        .select('question_ids, date')
        .maybeSingle()
        
      if (error) {
        // If it failed (e.g. concurrent insert from another user), just fetch the newly created one
        const { data: concurrentChallenge } = await supabase
          .from('daily_challenges')
          .select('question_ids, date')
          .eq('date', today)
          .maybeSingle()
        dailyChallenge = concurrentChallenge
      } else {
        dailyChallenge = newChallenge
      }
    } else {
      // Complete fallback if database doesn't have 5 questions (e.g., completely fresh seed)
      const { data: latest } = await supabase
        .from('daily_challenges')
        .select('question_ids, date')
        .order('date', { ascending: false })
        .limit(1)
        .maybeSingle()
      dailyChallenge = latest
    }
  }
  
  const challengeDate = dailyChallenge?.date || today

  let attempt = null
  let isFirstAttempt = false
  if (dailyChallenge) {
    const { data: existingAttempt } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_date', challengeDate)
      .maybeSingle()
    attempt = existingAttempt

    if (attempt) {
       const { count } = await supabase
         .from('attempts')
         .select('*', { count: 'exact', head: true })
         .eq('challenge_date', today)
         .lt('created_at', attempt.created_at)
       if (count === 0) {
         isFirstAttempt = true
       }
    }
  }

  // Fetch user total solved attempts count
  const { count: solvedAttemptsCount } = await supabase
    .from('attempts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  const solvedCount = (solvedAttemptsCount && solvedAttemptsCount > 0) ? solvedAttemptsCount : 12

  // Fetch questions if there's a challenge
  let questions: any[] = []
  if (dailyChallenge) {
    const { data: qData } = await supabase
      .from('questions')
      .select('id, topic, difficulty, question, options, correct_answer')
      .in('id', dailyChallenge.question_ids)
    
    questions = qData || []
  }

  const topBarNode = (
    <ArenaTopBar
      streak={profile?.streak || 3}
      rank={profile?.challenge_rank || "Silver"}
      solvedCount={solvedCount}
      userAvatar={profile?.avatar_url}
      userName={profile?.full_name || "Samir Alam"}
    />
  )

  return (
    <div className="flex h-full w-full bg-[#FAF9FF] transition-colors duration-300 relative overflow-x-hidden min-h-screen">
      {/* Subtle top-right decorative wave background matching reference */}
      <div className="absolute top-0 right-0 w-[420px] md:w-[560px] h-[340px] pointer-events-none select-none overflow-hidden opacity-85 z-0">
        <svg viewBox="0 0 560 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          <path
            d="M120 0C240 85 310 50 400 115C490 180 520 145 560 160V0H120Z"
            fill="url(#arenaWave1)"
          />
          <path
            d="M240 0C330 65 410 85 480 65C520 55 540 75 560 85V0H240Z"
            fill="url(#arenaWave2)"
          />
          <defs>
            <linearGradient id="arenaWave1" x1="120" y1="0" x2="560" y2="160" gradientUnits="userSpaceOnUse">
              <stop stopColor="#F3EEFF" stopOpacity="0.85" />
              <stop offset="1" stopColor="#EAE2FD" stopOpacity="0.45" />
            </linearGradient>
            <linearGradient id="arenaWave2" x1="240" y1="0" x2="560" y2="85" gradientUnits="userSpaceOnUse">
              <stop stopColor="#EFE8FE" stopOpacity="0.9" />
              <stop offset="1" stopColor="#E4D7FC" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <main className="flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-5 md:py-6 max-w-[1360px] mx-auto w-full relative z-10">
        
        {/* Dynamic State Rendering */}
        {!dailyChallenge ? (
           <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-gray-100 shadow-sm my-auto">
              <Clock className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No Challenge Yet</h2>
              <p className="text-gray-500 text-center max-w-md">The arena is currently preparing today's challenge. Check back soon!</p>
           </div>
        ) : attempt ? (
           <div className="space-y-6">
             {topBarNode}

             {/* Daily Arena Header */}
             <div className="flex items-center gap-3.5 mb-7">
               <div className="w-12 h-12 rounded-2xl bg-[#F3EEFF] border border-purple-100/70 flex items-center justify-center shrink-0 shadow-xs">
                 <Trophy className="w-6 h-6 text-[#7628F5]" strokeWidth={2} />
               </div>
               <div>
                 <h1 className="text-[26px] md:text-[28px] font-bold text-[#17152F] tracking-tight leading-tight">
                   Daily Arena
                 </h1>
                 <p className="text-[14px] text-[#6B7280] mt-0.5 font-normal">
                   Test your skills, build your streak, and climb the leaderboard.
                 </p>
               </div>
             </div>

             <ResultScreen attempt={attempt} profile={profile} questions={questions} isFirstAttempt={isFirstAttempt} />
             
             {/* Feature Cards below results */}
             <div className="pt-4">
               <FeatureCards />
             </div>
           </div>
        ) : (
           /* Show Pre-Quiz Daily Arena screen or active Quiz Screen */
           <QuizScreen questions={questions} challengeDate={challengeDate} userId={user.id} topBarNode={topBarNode} />
        )}

      </main>
    </div>
  )
}

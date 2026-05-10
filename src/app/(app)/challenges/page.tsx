import { createClient } from "@/lib/supabase/server"
import { Trophy, Clock, Flame, ShieldAlert, Play, Target, ChevronLeft } from "lucide-react"
import Link from "next/link"
import { QuizScreen } from "@/components/challenges/quiz-screen"
import { ResultScreen } from "@/components/challenges/result-screen"

export default async function ChallengesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return <div>Please log in to view challenges.</div>
  }

  const today = new Date().toISOString().split('T')[0]

  let dailyChallenge = null
  const { data: todayChallenge } = await supabase
    .from('daily_challenges')
    .select('question_ids, date')
    .eq('date', today)
    .single()
  
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
        .single()
        
      if (error) {
        // If it failed (e.g. concurrent insert from another user), just fetch the newly created one
        const { data: concurrentChallenge } = await supabase
          .from('daily_challenges')
          .select('question_ids, date')
          .eq('date', today)
          .single()
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
        .single()
      dailyChallenge = latest
    }
  }
  
  const challengeDate = dailyChallenge?.date || today

  // 2. Fetch user's profile stats
  const { data: profile } = await supabase
    .from('profiles')
    .select('streak, challenge_rank, full_name')
    .eq('id', user.id)
    .single()

  let attempt = null
  let isFirstAttempt = false
  if (dailyChallenge) {
    const { data: existingAttempt } = await supabase
      .from('attempts')
      .select('*')
      .eq('user_id', user.id)
      .eq('challenge_date', challengeDate)
      .single()
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

  // 4. Fetch questions if there's a challenge
  let questions: any[] = []
  if (dailyChallenge) {
    const { data: qData } = await supabase
      .from('questions')
      .select('id, topic, difficulty, question, options, correct_answer')
      .in('id', dailyChallenge.question_ids)
    
    questions = qData || []
  }

  return (
    <div className="flex h-screen w-full bg-[#FCFBFF] dark:bg-[#050505] transition-colors duration-300">
      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8">
        
        {/* Header is now rendered inside QuizScreen/ResultScreen for dynamic hiding */}

        {/* Dynamic State Rendering */}
        {!dailyChallenge ? (
           <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-[#0B0A10] rounded-3xl border border-gray-100 dark:border-[#2D2B3B]">
              <Clock className="w-16 h-16 text-gray-300 dark:text-[#2D2B3B] mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No Challenge Yet</h2>
              <p className="text-gray-500 text-center max-w-md">The arena is currently preparing today's challenge. Check back soon!</p>
           </div>
        ) : attempt ? (
           <>
             <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
               <div>
                 <div className="flex items-center gap-3">
                   <Link href="/dashboard" className="md:hidden p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors">
                     <ChevronLeft className="w-6 h-6" />
                   </Link>
                   <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                     <Trophy className="w-8 h-8 text-violet-500 hidden md:block" />
                     Daily Arena
                   </h1>
                 </div>
                 <p className="text-gray-500 dark:text-gray-400 mt-1 md:ml-0 ml-11">Test your skills, build your streak, conquer the leaderboard.</p>
               </div>
               <div className="flex items-center gap-4 bg-white dark:bg-[#0B0A10] p-4 rounded-2xl border border-gray-100 dark:border-[#2D2B3B]">
                 <div className="flex items-center gap-2">
                   <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                     <Flame className="w-5 h-5 text-orange-500" />
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Streak</p>
                     <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{profile?.streak || 0} Days</p>
                   </div>
                 </div>
                 <div className="w-px h-10 bg-gray-100 dark:bg-[#2D2B3B]"></div>
                 <div className="flex items-center gap-2">
                   <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center">
                     <ShieldAlert className="w-5 h-5 text-violet-500" />
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</p>
                     <p className="text-lg font-bold text-violet-600 dark:text-violet-400 leading-none">{profile?.challenge_rank || 'Bronze'}</p>
                   </div>
                 </div>
               </div>
             </header>
             <ResultScreen attempt={attempt} profile={profile} questions={questions} isFirstAttempt={isFirstAttempt} />
           </>
        ) : (
           // Show Pre-Quiz or Quiz Screen
           <QuizScreen questions={questions} challengeDate={challengeDate} userId={user.id} headerNode={
             <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
               <div>
                 <div className="flex items-center gap-3">
                   <Link href="/dashboard" className="md:hidden p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors">
                     <ChevronLeft className="w-6 h-6" />
                   </Link>
                   <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                     <Trophy className="w-8 h-8 text-violet-500 hidden md:block" />
                     Daily Arena
                   </h1>
                 </div>
                 <p className="text-gray-500 dark:text-gray-400 mt-1 md:ml-0 ml-11">Test your skills, build your streak, conquer the leaderboard.</p>
               </div>
               <div className="flex items-center gap-4 bg-white dark:bg-[#0B0A10] p-4 rounded-2xl border border-gray-100 dark:border-[#2D2B3B]">
                 <div className="flex items-center gap-2">
                   <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
                     <Flame className="w-5 h-5 text-orange-500" />
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Streak</p>
                     <p className="text-lg font-bold text-gray-900 dark:text-white leading-none">{profile?.streak || 0} Days</p>
                   </div>
                 </div>
                 <div className="w-px h-10 bg-gray-100 dark:bg-[#2D2B3B]"></div>
                 <div className="flex items-center gap-2">
                   <div className="w-10 h-10 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center">
                     <ShieldAlert className="w-5 h-5 text-violet-500" />
                   </div>
                   <div>
                     <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rank</p>
                     <p className="text-lg font-bold text-violet-600 dark:text-violet-400 leading-none">{profile?.challenge_rank || 'Bronze'}</p>
                   </div>
                 </div>
               </div>
             </header>
           } />
        )}

      </main>
    </div>
  )
}

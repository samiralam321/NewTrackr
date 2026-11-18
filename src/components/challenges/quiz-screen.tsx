"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Timer, 
  AlertTriangle, 
  ChevronRight, 
  Trophy, 
  Calendar, 
  Code2, 
  Clock, 
  RotateCcw, 
  Play, 
  Check 
} from "lucide-react"
import { CodingIllustration } from "./coding-illustration"
import { FeatureCards } from "./feature-cards"

type Question = {
  id: string
  topic: string
  difficulty: string
  question: string
  options: string[]
  correct_answer: string
}

export function QuizScreen({ 
  questions, 
  challengeDate, 
  userId,
  topBarNode
}: { 
  questions: Question[]
  challengeDate: string
  userId: string
  topBarNode?: React.ReactNode 
}) {
  const [started, setStarted] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({})
  const [timeLeft, setTimeLeft] = useState(600) // 10 minutes
  const [warningCount, setWarningCount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [shuffledQuestions, setShuffledQuestions] = useState<Question[]>([])

  const supabase = createClient()

  // 1. Initialize and shuffle questions safely on client side to avoid hydration mismatch
  useEffect(() => {
    if (questions.length > 0) {
      const shuffled = [...questions].sort(() => Math.random() - 0.5).map(q => ({
        ...q,
        options: [...q.options].sort(() => Math.random() - 0.5)
      }))
      setShuffledQuestions(shuffled)
    }
  }, [questions])

  // 2. Anti-Cheat: Detect Tab Switching
  useEffect(() => {
    if (!started || submitting) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setWarningCount(prev => {
          const newCount = prev + 1
          if (newCount >= 2) {
            alert("Anti-Cheat Triggered: You left the tab multiple times. Your quiz is being auto-submitted.")
            handleSubmit()
          } else {
            alert("Warning: Please do not leave this tab. If you leave again, your quiz will be auto-submitted!")
          }
          return newCount
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange)
  }, [started, submitting])

  // 3. Timer Logic
  useEffect(() => {
    if (!started || submitting || timeLeft <= 0) {
      if (timeLeft === 0 && started && !submitting) {
        handleSubmit() // Auto submit on timeout
      }
      return
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1)
    }, 1000)

    return () => clearInterval(timer)
  }, [started, timeLeft, submitting])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  const handleSelectOption = (qId: string, option: string) => {
    setSelectedAnswers(prev => ({ ...prev, [qId]: option }))
  }

  const handleSubmit = useCallback(async () => {
    if (submitting) return
    setSubmitting(true)

    let correctCount = 0
    let skippedCount = 0
    let wrongCount = 0

    const finalAnswers = shuffledQuestions.map(q => {
      const selected = selectedAnswers[q.id]
      if (!selected) {
        skippedCount++
      } else if (selected === q.correct_answer) {
        correctCount++
      } else {
        wrongCount++
      }
      return { question_id: q.id, selected_option: selected || null, is_correct: selected === q.correct_answer }
    })

    const timeTaken = 600 - timeLeft

    // Scoring Formula: (Correct * 100) - (Time * 0.5) - (Wrong * 20)
    let rawScore = (correctCount * 100) - (timeTaken * 0.5) - (wrongCount * 20)
    const finalScore = Math.max(0, Math.round(rawScore)) // Prevent negative scores

    const accuracy = (correctCount / 5) * 100

    let newRank = 'Bronze'
    if (accuracy === 100) newRank = 'Diamond'
    else if (accuracy >= 80) newRank = 'Gold'
    else if (accuracy >= 60) newRank = 'Silver'
    else if (accuracy >= 40) newRank = 'Bronze'
    else newRank = 'Unranked'

    await supabase.from('attempts').insert({
      user_id: userId,
      challenge_date: challengeDate,
      score: finalScore,
      time_taken: timeTaken,
      answers: finalAnswers,
      accuracy: accuracy
    })

    // Calculate new streak
    let newStreak = 1
    const { data: previousAttempts } = await supabase
      .from('attempts')
      .select('challenge_date')
      .eq('user_id', userId)
      .neq('challenge_date', challengeDate)
      .order('challenge_date', { ascending: false })
      .limit(1)

    const lastAttemptDate = previousAttempts?.[0]?.challenge_date
    if (lastAttemptDate) {
      const [currY, currM, currD] = challengeDate.split('-').map(Number)
      const [lastY, lastM, lastD] = lastAttemptDate.split('-').map(Number)
      const current = Date.UTC(currY, currM - 1, currD)
      const last = Date.UTC(lastY, lastM - 1, lastD)
      const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24))
      
      const { data: profile } = await supabase.from('profiles').select('streak').eq('id', userId).single()
      
      if (diffDays === 1) {
         newStreak = (profile?.streak || 0) + 1
      } else if (diffDays <= 0) {
         newStreak = profile?.streak || 1
      } else {
         newStreak = 1
      }
    }

    // Update user's overall challenge rank and streak in profile
    await supabase.from('profiles').update({ challenge_rank: newRank, streak: newStreak }).eq('id', userId)

    // Force reload to show results screen
    window.location.reload()
  }, [shuffledQuestions, selectedAnswers, timeLeft, userId, challengeDate, submitting])

  // ================= PRE-QUIZ LANDING VIEW (EXACT MATCH TO REFERENCE IMAGE) =================
  if (!started) {
    return (
      <div className="flex flex-col w-full">
        {/* Top Bar with Search & Quick Stats if provided */}
        {topBarNode}

        {/* A. Daily Arena Header */}
        <div className="flex items-center gap-3.5 mb-6">
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

        {/* B. Main Challenge Card */}
        <div className="bg-white rounded-[24px] border border-[#EBE6F7] shadow-[0_4px_25px_rgba(118,40,245,0.03)] p-6 md:p-8 lg:p-9 mb-5 relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Section — Challenge Information */}
            <div className="lg:col-span-5 flex flex-col justify-center">
              {/* Today's Challenge Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F3EEFF] text-[#7628F5] text-xs font-semibold w-fit mb-3.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Today's Challenge</span>
              </div>

              {/* Main Heading */}
              <h2 className="text-2xl md:text-[30px] font-extrabold text-[#17152F] tracking-tight leading-tight mb-2">
                Arena Challenge
              </h2>

              {/* Description */}
              <p className="text-[14px] text-[#52525B] leading-relaxed mb-5 max-w-md">
                A short and focused challenge to keep your problem-solving skills sharp.
              </p>

              {/* Metadata Row */}
              <div className="flex items-center flex-wrap gap-3 md:gap-3.5 text-[13px] text-[#17152F] font-medium mb-6">
                <div className="flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-[#7628F5]" />
                  <span>5 Questions</span>
                </div>
                <span className="text-gray-300 select-none">|</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#7628F5]" />
                  <span>10 Minutes</span>
                </div>
                <span className="text-gray-300 select-none">|</span>
                <div className="flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-[#7628F5]" />
                  <span>One Attempt</span>
                </div>
              </div>

              {/* Start Challenge CTA Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setStarted(true)}
                  className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-[#6E27E8] to-[#591AD9] text-white font-semibold text-[15px] shadow-md shadow-purple-600/25 hover:shadow-lg hover:shadow-purple-600/35 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-none stroke-[2.4] text-white" />
                  <span>Start Challenge</span>
                </button>
              </div>
            </div>

            {/* Centre Section — Coding Illustration */}
            <div className="lg:col-span-3 flex items-center justify-center py-2 lg:py-0">
              <CodingIllustration className="w-full max-w-[240px] md:max-w-[260px] h-auto" />
            </div>

            {/* Right Section — Rules & Anti-Cheat */}
            <div className="lg:col-span-4 bg-[#FAF7FD] border border-[#EFEBF9] rounded-2xl p-5 md:p-6 flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-[15.5px] font-bold text-[#17152F]">
                  Rules & Anti-Cheat
                </h3>
              </div>

              <ul className="space-y-3">
                <li className="flex items-start gap-2.5">
                  <div className="w-[18px] h-[18px] rounded-full bg-[#B89CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white stroke-[2.5]" />
                  </div>
                  <span className="text-[13px] text-[#374151] leading-[1.45]">
                    Do not switch tabs. Your quiz will auto-submit on the second warning.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-[18px] h-[18px] rounded-full bg-[#B89CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white stroke-[2.5]" />
                  </div>
                  <span className="text-[13px] text-[#374151] leading-[1.45]">
                    Copy-pasting is disabled.
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-[18px] h-[18px] rounded-full bg-[#B89CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white stroke-[2.5]" />
                  </div>
                  <span className="text-[13px] text-[#374151] leading-[1.45]">
                    Score = (Correct × 100) − (Wrong × 20) − (Time in sec × 0.5).
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <div className="w-[18px] h-[18px] rounded-full bg-[#B89CF8] flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-white stroke-[2.5]" />
                  </div>
                  <span className="text-[13px] text-[#374151] leading-[1.45]">
                    Skipped questions give 0 points (no negative penalty).
                  </span>
                </li>
              </ul>
            </div>

          </div>
        </div>

        {/* C. Four Feature Cards Below the Main Card */}
        <FeatureCards />
      </div>
    )
  }

  // ================= ACTIVE QUIZ QUESTIONS VIEW =================
  const currentQ = shuffledQuestions[currentIndex]

  return (
    <div className="max-w-3xl mx-auto w-full" onCopy={(e) => e.preventDefault()} style={{ userSelect: 'none' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 bg-white p-4 rounded-2xl border border-gray-100 sticky top-4 z-10 shadow-xs">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
          <span className="text-lg font-bold text-gray-900">Question {currentIndex + 1} <span className="text-gray-400">/ 5</span></span>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full font-mono font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600' : 'bg-[#F3EEFF] text-[#7628F5]'}`}>
          <Timer className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-violet-100 text-violet-700 rounded-full text-xs font-bold uppercase tracking-wider">
            {currentQ?.topic}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentQ?.difficulty === 'Hard' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {currentQ?.difficulty}
          </span>
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-8 leading-relaxed">
          {currentQ?.question}
        </h3>

        <div className="space-y-3">
          {currentQ?.options?.map((option, idx) => {
            const isSelected = selectedAnswers[currentQ.id] === option
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(currentQ.id, option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isSelected 
                    ? 'border-violet-600 bg-violet-50 text-violet-900 shadow-xs' 
                    : 'border-gray-100 hover:border-violet-300 text-gray-700 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-violet-600 bg-violet-600' : 'border-gray-300'}`}>
                    {isSelected && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                  <span className="text-[15px] font-medium leading-relaxed">{option}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-6 py-3 font-semibold text-gray-500 hover:text-gray-900 disabled:opacity-30 transition-colors cursor-pointer"
        >
          Previous
        </button>

        {currentIndex < 4 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex items-center gap-2 bg-[#17152F] text-white px-8 py-3 rounded-full font-bold hover:bg-gray-800 transition-colors cursor-pointer shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-gradient-to-r from-[#6E27E8] to-[#591AD9] text-white px-10 py-3 rounded-full font-bold hover:opacity-95 transition-all shadow-lg shadow-purple-500/25 disabled:opacity-50 cursor-pointer"
          >
            {submitting ? 'Submitting...' : 'Submit Challenge'}
          </button>
        )}
      </div>
    </div>
  )
}

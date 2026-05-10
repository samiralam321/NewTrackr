"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Timer, AlertTriangle, CheckCircle2, ChevronRight, XCircle, Target } from "lucide-react"

type Question = {
  id: string
  topic: string
  difficulty: string
  question: string
  options: string[]
  correct_answer: string
}

export function QuizScreen({ questions, challengeDate, userId, headerNode }: { questions: Question[], challengeDate: string, userId: string, headerNode?: React.ReactNode }) {
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
    let newStreak = 1;
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

  if (!started) {
    return (
      <div className="flex flex-col w-full h-full">
        {headerNode}
        <div className="max-w-2xl mx-auto mt-10 bg-white dark:bg-[#0B0A10] p-8 rounded-3xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm text-center">
        <div className="w-20 h-20 bg-violet-100 dark:bg-violet-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Target className="w-10 h-10 text-violet-600" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Today's Arena Challenge</h2>
        <p className="text-gray-500 mb-8 text-lg">5 Questions • 10 Minutes • One Attempt</p>
        
        <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-900/30 p-4 rounded-xl text-left mb-8">
          <h4 className="font-semibold text-orange-800 dark:text-orange-400 flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Rules & Anti-Cheat
          </h4>
          <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1 list-disc pl-5">
            <li>Do not switch tabs. Your quiz will auto-submit on the second warning.</li>
            <li>Copy-pasting is disabled.</li>
            <li>Score = (Correct × 100) - (Wrong × 20) - (Time in sec × 0.5).</li>
            <li>Skipped questions give 0 points (no negative penalty).</li>
          </ul>
        </div>

        <button 
          onClick={() => setStarted(true)}
          className="bg-violet-600 hover:bg-violet-700 text-white font-bold py-4 px-12 rounded-full transition-transform hover:scale-105 active:scale-95 shadow-lg shadow-violet-500/25"
        >
          START CHALLENGE
        </button>
      </div>
      </div>
    )
  }

  const currentQ = shuffledQuestions[currentIndex]

  return (
    <div className="max-w-3xl mx-auto" onCopy={(e) => e.preventDefault()} style={{ userSelect: 'none' }}>
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-8 bg-white dark:bg-[#0B0A10] p-4 rounded-2xl border border-gray-100 dark:border-[#2D2B3B] sticky top-4 z-10">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Progress</span>
          <span className="text-lg font-bold text-gray-900 dark:text-white">Question {currentIndex + 1} <span className="text-gray-400">/ 5</span></span>
        </div>
        
        <div className={`flex items-center gap-3 px-4 py-2 rounded-full font-mono font-bold text-lg ${timeLeft < 60 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-900 dark:bg-[#1A1A24] dark:text-white'}`}>
          <Timer className="w-5 h-5" />
          {formatTime(timeLeft)}
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white dark:bg-[#0B0A10] p-6 md:p-8 rounded-3xl border border-gray-100 dark:border-[#2D2B3B] mb-6 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300 rounded-full text-xs font-bold uppercase tracking-wider">
            {currentQ?.topic}
          </span>
          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${currentQ?.difficulty === 'Hard' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'}`}>
            {currentQ?.difficulty}
          </span>
        </div>
        
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-8 leading-relaxed">
          {currentQ?.question}
        </h3>

        <div className="space-y-3">
          {currentQ?.options.map((option, idx) => {
            const isSelected = selectedAnswers[currentQ.id] === option
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(currentQ.id, option)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                  isSelected 
                    ? 'border-violet-600 bg-violet-50 dark:bg-violet-900/20 text-violet-900 dark:text-violet-100' 
                    : 'border-gray-100 dark:border-[#2D2B3B] hover:border-violet-300 dark:hover:border-violet-700/50 text-gray-700 dark:text-gray-300 bg-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-violet-600' : 'border-gray-300 dark:border-gray-600'}`}>
                    {isSelected && <div className="w-3 h-3 bg-violet-600 rounded-full" />}
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
          onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
          disabled={currentIndex === 0}
          className="px-6 py-3 font-semibold text-gray-500 hover:text-gray-900 dark:hover:text-white disabled:opacity-30 transition-colors"
        >
          Previous
        </button>

        {currentIndex < 4 ? (
          <button
            onClick={() => setCurrentIndex(prev => prev + 1)}
            className="flex items-center gap-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-8 py-3 rounded-full font-bold hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
          >
            Next <ChevronRight className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex items-center gap-2 bg-violet-600 text-white px-10 py-3 rounded-full font-bold hover:bg-violet-700 transition-colors shadow-lg shadow-violet-500/25 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit Challenge'}
          </button>
        )}
      </div>
    </div>
  )
}

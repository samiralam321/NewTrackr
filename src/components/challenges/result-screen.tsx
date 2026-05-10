import { Trophy, Clock, Target, CheckCircle2, Award, Zap, ChevronDown, Check, X } from "lucide-react"
import { Celebration } from "@/components/challenges/celebration"

export function ResultScreen({ attempt, profile, questions = [], isFirstAttempt = false }: { attempt: any, profile: any, questions?: any[], isFirstAttempt?: boolean }) {
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}m ${s}s`
  }

  // Count correct answers from the attempt
  const correctCount = attempt.answers.filter((a: any) => a.is_correct).length
  const skippedCount = attempt.answers.filter((a: any) => a.selected_option === null).length
  const wrongCount = 5 - correctCount - skippedCount

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Celebration Animation Overlay */}
      <Celebration accuracy={attempt.accuracy} />
      
      {/* First Attempt Banner */}
      {isFirstAttempt && (
        <div className="bg-gradient-to-r from-amber-200 to-yellow-400 dark:from-yellow-900/60 dark:to-amber-900/60 border border-yellow-400/50 rounded-2xl p-4 flex items-center justify-center gap-3 shadow-md mb-6">
           <Trophy className="w-6 h-6 text-yellow-700 dark:text-yellow-400" />
           <p className="font-bold text-yellow-900 dark:text-yellow-100 text-lg">Congratulations! You are the first one to attempt this quiz! 🚀</p>
        </div>
      )}
      
      {/* Hero Result Card */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-center text-white relative overflow-hidden shadow-xl shadow-violet-500/20">
        
        {/* Decorative background circles */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-black/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

        <div className="relative z-10">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-6 border border-white/20">
            <Trophy className="w-10 h-10 text-yellow-400" />
          </div>
          
          <h2 className="text-4xl font-black mb-2 tracking-tight">Challenge Completed!</h2>
          <p className="text-violet-200 text-lg mb-8 font-medium">You survived today's arena. Here's how you performed.</p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 w-full md:w-auto">
              <p className="text-violet-200 text-sm font-bold uppercase tracking-widest mb-1">Final Score</p>
              <p className="text-5xl font-black text-white">{attempt.score}</p>
            </div>
            
            <div className="bg-black/20 backdrop-blur-sm rounded-2xl p-6 border border-white/10 w-full md:w-auto flex gap-8">
              <div className="text-left">
                <p className="text-violet-200 text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4" /> Accuracy
                </p>
                <p className="text-3xl font-bold">{attempt.accuracy}%</p>
              </div>
              <div className="w-px bg-white/20"></div>
              <div className="text-left">
                <p className="text-violet-200 text-sm font-bold uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Time
                </p>
                <p className="text-3xl font-bold">{formatTime(attempt.time_taken)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-[#0B0A10] p-6 rounded-2xl border border-gray-100 dark:border-[#2D2B3B] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Correct</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{correctCount} <span className="text-sm text-gray-400 font-normal">/ 5</span></p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0A10] p-6 rounded-2xl border border-gray-100 dark:border-[#2D2B3B] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center shrink-0">
            <XCircle className="w-6 h-6 text-red-600 dark:text-red-500" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Incorrect</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{wrongCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#0B0A10] p-6 rounded-2xl border border-gray-100 dark:border-[#2D2B3B] flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#1A1A24] flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-500 uppercase">Skipped</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{skippedCount}</p>
          </div>
        </div>
      </div>

      {/* Badges / Rewards */}
      <div className="bg-white dark:bg-[#0B0A10] p-8 rounded-3xl border border-gray-100 dark:border-[#2D2B3B]">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Award className="w-5 h-5 text-violet-500" /> Unlocked Badges
        </h3>
        <div className="flex flex-wrap gap-4">
          {attempt.accuracy === 100 && (
             <div className="flex items-center gap-3 bg-gradient-to-r from-cyan-100 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/20 border border-cyan-200 dark:border-cyan-800/40 p-3 pr-5 rounded-full">
               <div className="w-8 h-8 rounded-full bg-cyan-500 flex items-center justify-center shrink-0 shadow-sm shadow-cyan-500/50">
                 <Trophy className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-sm font-bold text-cyan-900 dark:text-cyan-100 leading-none mb-1">Diamond Badge</p>
                 <p className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 tracking-wider">Flawless Victory</p>
               </div>
             </div>
          )}

          {attempt.accuracy >= 80 && attempt.accuracy < 100 && (
             <div className="flex items-center gap-3 bg-gradient-to-r from-yellow-100 to-amber-50 dark:from-yellow-900/30 dark:to-amber-900/20 border border-yellow-200 dark:border-yellow-800/40 p-3 pr-5 rounded-full">
               <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center shrink-0 shadow-sm shadow-yellow-500/50">
                 <Award className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-sm font-bold text-yellow-900 dark:text-yellow-100 leading-none mb-1">Gold Badge</p>
                 <p className="text-[10px] uppercase font-bold text-yellow-600 dark:text-yellow-400 tracking-wider">Excellent</p>
               </div>
             </div>
          )}

          {attempt.accuracy >= 60 && attempt.accuracy < 80 && (
             <div className="flex items-center gap-3 bg-gradient-to-r from-slate-200 to-gray-100 dark:from-slate-800/50 dark:to-gray-800/30 border border-slate-300 dark:border-slate-700/50 p-3 pr-5 rounded-full">
               <div className="w-8 h-8 rounded-full bg-slate-400 flex items-center justify-center shrink-0 shadow-sm shadow-slate-400/50">
                 <Award className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-none mb-1">Silver Badge</p>
                 <p className="text-[10px] uppercase font-bold text-slate-600 dark:text-slate-400 tracking-wider">Good Job</p>
               </div>
             </div>
          )}

          {attempt.accuracy >= 40 && attempt.accuracy < 60 && (
             <div className="flex items-center gap-3 bg-gradient-to-r from-orange-200 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/30 border border-orange-300 dark:border-orange-800/50 p-3 pr-5 rounded-full">
               <div className="w-8 h-8 rounded-full bg-orange-600 flex items-center justify-center shrink-0 shadow-sm shadow-orange-600/50">
                 <Award className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-sm font-bold text-orange-900 dark:text-orange-100 leading-none mb-1">Bronze Badge</p>
                 <p className="text-[10px] uppercase font-bold text-orange-600 dark:text-orange-400 tracking-wider">Passed</p>
               </div>
             </div>
          )}

          {attempt.time_taken < 180 && attempt.accuracy >= 60 && (
             <div className="flex items-center gap-3 bg-gradient-to-r from-red-100 to-rose-50 dark:from-red-900/30 dark:to-rose-900/20 border border-red-200 dark:border-red-800/40 p-3 pr-5 rounded-full">
               <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center shrink-0 shadow-sm shadow-red-500/50">
                 <Zap className="w-4 h-4 text-white" />
               </div>
               <div>
                 <p className="text-sm font-bold text-red-900 dark:text-red-100 leading-none mb-1">Speed Demon</p>
                 <p className="text-[10px] uppercase font-bold text-red-600 dark:text-red-400 tracking-wider">Under 3 mins</p>
               </div>
             </div>
          )}

          {attempt.accuracy < 40 && (
            <p className="text-gray-500 italic text-sm">No badges earned today. Keep pushing and studying!</p>
          )}
        </div>
      </div>

      {/* Answer Key / Review Section */}
      {questions.length > 0 && (
        <div className="bg-white dark:bg-[#0B0A10] p-8 rounded-3xl border border-gray-100 dark:border-[#2D2B3B]">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-violet-500" /> Challenge Review
          </h3>
          <div className="space-y-6">
            {questions.map((q, index) => {
              const attemptAnswer = attempt.answers.find((a: any) => a.question_id === q.id)
              const selectedOption = attemptAnswer?.selected_option
              const isCorrect = attemptAnswer?.is_correct
              const skipped = !selectedOption

              return (
                <div key={q.id} className="border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-6 bg-gray-50/50 dark:bg-[#1A1A24]/30">
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${isCorrect ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : skipped ? 'bg-gray-200 text-gray-600 dark:bg-[#2D2B3B] dark:text-gray-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {isCorrect ? <Check className="w-4 h-4" /> : skipped ? <Clock className="w-4 h-4" /> : <X className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-relaxed">{index + 1}. {q.question}</h4>
                      {skipped && <span className="inline-block mt-2 px-2 py-1 bg-gray-200 dark:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 text-xs font-bold uppercase rounded-md">Skipped</span>}
                    </div>
                  </div>

                  <div className="space-y-2 ml-12">
                    {q.options.map((option: string, optIdx: number) => {
                      const isUserSelection = option === selectedOption
                      const isActualCorrect = option === q.correct_answer

                      let styling = "bg-white dark:bg-[#0B0A10] border-gray-100 dark:border-[#2D2B3B] text-gray-600 dark:text-gray-400"
                      
                      if (isActualCorrect) {
                        styling = "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/10 dark:border-emerald-800/30 dark:text-emerald-300 font-semibold"
                      } else if (isUserSelection && !isCorrect) {
                        styling = "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/10 dark:border-red-800/30 dark:text-red-300"
                      }

                      return (
                        <div key={optIdx} className={`p-3 rounded-xl border flex items-center justify-between ${styling}`}>
                          <span>{option}</span>
                          {isActualCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {isUserSelection && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// Need to define XCircle since I used it but forgot to import
function XCircle(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="12" cy="12" r="10"/>
      <path d="m15 9-6 6"/>
      <path d="m9 9 6 6"/>
    </svg>
  )
}

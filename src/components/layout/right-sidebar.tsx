'use client'

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { 
  X, 
  Image as ImageIcon, 
  Smile, 
  Loader2, 
  TrendingUp, 
  Flame, 
  Sparkles, 
  Trophy, 
  Code2, 
  ChevronRight, 
  UserPlus, 
  Send, 
  Check 
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { updateUserStreakAndBadge } from "@/lib/utils/streak"
import Link from "next/link"

export function RightSidebar() {
  const [content, setContent] = useState("")
  const [progressType, setProgressType] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [isComposerExpanded, setIsComposerExpanded] = useState(false)
  
  // Dynamic Contextual Widgets State
  const [topStudents, setTopStudents] = useState<any[]>([])
  const [loadingWidgets, setLoadingWidgets] = useState(true)

  const commonEmojis = ["🔥", "🚀", "💡", "💻", "✅", "🎉", "🧠", "✨"]
  const trendingTags = [
    { tag: "LeetCode Daily", count: "142 posts", icon: "🧠" },
    { tag: "Next.js 16", count: "98 posts", icon: "⚡" },
    { tag: "System Design", count: "74 posts", icon: "🏗️" },
    { tag: "FullStack", count: "59 posts", icon: "💻" }
  ]

  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    const fetchWidgetData = async () => {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, consistency_score, college')
          .order('consistency_score', { ascending: false })
          .limit(4)

        if (profiles) {
          setTopStudents(profiles)
        }
      } catch (err) {
        console.warn("Failed to load right sidebar widgets:", err)
      } finally {
        setLoadingWidgets(false)
      }
    }

    fetchWidgetData()
  }, [])

  const handlePost = async () => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    if (!textContent && !imageFile) return

    setIsSubmitting(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) throw new Error("Not authenticated")

      let imageUrl = null

      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${userData.user.id}-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, imageFile)
        
        if (uploadError) throw uploadError

        const { data: publicUrl } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName)
        
        imageUrl = publicUrl.publicUrl
      }

      const { error } = await supabase.from('posts').insert({
        user_id: userData.user.id,
        content,
        tags: [],
        type: progressType,
        image_url: imageUrl
      })

      if (error) throw error

      // Update streak and handle badge achievements
      try {
        const result = await updateUserStreakAndBadge(supabase, userData.user.id)
        if (result) {
          window.dispatchEvent(
            new CustomEvent('profile-updated', {
              detail: {
                consistency_score: result.streak,
                badge_level: result.badgeLevel,
                last_post_date: new Date().toISOString().split('T')[0]
              }
            })
          )
        }
      } catch (streakErr) {
        console.error("Streak update error:", streakErr)
      }

      // Reset form
      setContent("")
      setImageFile(null)
      setIsComposerExpanded(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      router.refresh()
    } catch (error) {
      console.error("Error posting from right sidebar:", error)
      alert("Failed to post progress.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <aside className="hidden xl:flex w-[340px] h-screen sticky top-0 border-l border-gray-100 dark:border-[#2D2B3B] bg-[#FCFBFE] dark:bg-[#0B0A10] flex-col p-5 overflow-y-auto space-y-6 transition-colors duration-300 scrollbar-hide">
      
      {/* 1. Quick Progress Composer (Compact & Expandable) */}
      <div className="bg-white dark:bg-[#12111A] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-600 dark:text-violet-400">
            <Sparkles className="w-3.5 h-3.5" /> Quick Share
          </div>
          <div className="flex items-center gap-1">
            {(['Learned', 'Built', 'Practiced'] as const).map((type) => (
              <button
                key={type}
                onClick={() => setProgressType(type)}
                className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                  progressType === type
                    ? "bg-violet-600 text-white"
                    : "bg-gray-100 dark:bg-[#1E1D2A] text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <RichTextEditor
            value={content}
            onChange={(val) => {
              setContent(val)
              if (!isComposerExpanded && val.trim().length > 0) setIsComposerExpanded(true)
            }}
            placeholder="Share what you accomplished today..."
            className={`w-full bg-gray-50/70 dark:bg-[#1A1A24] border border-gray-200/70 dark:border-[#2D2B3B] rounded-xl text-xs p-3 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white outline-none focus-visible:ring-1 focus-visible:ring-violet-500 ${
              isComposerExpanded ? "min-h-[110px]" : "min-h-[64px]"
            }`}
            placeholderClassName="text-xs p-3"
          />

          {imageFile && (
            <div className="mt-2 flex items-center justify-between bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 px-2.5 py-1.5 rounded-lg text-xs font-medium text-violet-700 dark:text-violet-300">
              <span className="truncate max-w-[200px]">{imageFile.name}</span>
              <button onClick={() => setImageFile(null)} className="text-gray-400 hover:text-red-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-50 dark:border-[#2D2B3B]">
            <div className="flex items-center gap-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                accept="image/*" 
                className="hidden" 
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
                title="Attach image"
              >
                <ImageIcon className="w-3.5 h-3.5" />
              </button>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
                  title="Emoji"
                >
                  <Smile className="w-3.5 h-3.5" />
                </button>
                {showEmojis && (
                  <div className="absolute top-8 left-0 z-50 bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] p-2 rounded-xl shadow-xl flex gap-1.5">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => {
                          setContent((prev) => prev + emoji)
                          setShowEmojis(false)
                        }}
                        className="hover:scale-110 transition-transform text-sm p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Button
              size="sm"
              onClick={handlePost}
              disabled={isSubmitting || !content.trim()}
              className="h-7 px-3.5 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-xs font-bold shadow-xs active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Popular Tech Challenges Arena Card */}
      <div className="bg-gradient-to-br from-violet-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md shadow-violet-500/15 relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-xl group-hover:scale-125 transition-transform" />
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-violet-200 mb-1">
          <Code2 className="w-4 h-4 text-violet-200" /> Interview Arena
        </div>
        <h3 className="text-sm font-bold leading-snug">Daily Tech Practice</h3>
        <p className="text-xs text-violet-100/90 mt-1 leading-relaxed">
          Solve 280+ curated technical questions across DSA, OS, DBMS & System Design.
        </p>
        <Link 
          href="/challenges"
          className="mt-3 inline-flex items-center gap-1 text-xs font-bold bg-white text-violet-700 hover:bg-violet-50 px-3.5 py-1.5 rounded-full shadow-sm transition-all active:scale-95"
        >
          <span>Start Challenge</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3. Trending Discussions & Topics */}
      <div className="bg-white dark:bg-[#12111A] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Trending Discussions
          </div>
        </div>
        <div className="space-y-2.5">
          {trendingTags.map((item) => (
            <div 
              key={item.tag}
              className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1A1A24] p-1.5 -mx-1.5 rounded-xl cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.icon}</span>
                <div>
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 leading-tight">#{item.tag}</div>
                  <div className="text-[11px] text-gray-400 leading-tight mt-0.5">{item.count}</div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Top Consistent Students Leaderboard Snapshot */}
      <div className="bg-white dark:bg-[#12111A] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top Streaks
          </div>
          <Link href="/leaderboard" className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline">
            View all
          </Link>
        </div>

        {loadingWidgets ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-gray-100 dark:bg-[#1A1A24] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {topStudents.map((student, idx) => (
              <Link
                key={student.id}
                href={`/profile/${student.id}`}
                className="flex items-center justify-between hover:bg-gray-50 dark:hover:bg-[#1A1A24] p-1.5 -mx-1.5 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="relative shrink-0">
                    <img
                      src={student.avatar_url || `https://ui-avatars.com/api/?name=${student.full_name || 'User'}&background=7C3AED&color=fff`}
                      alt=""
                      className="w-8 h-8 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                    />
                    <span className="absolute -bottom-1 -right-1 text-[9px] font-bold w-4 h-4 bg-gray-100 dark:bg-[#1A1A24] rounded-full flex items-center justify-center border border-white dark:border-black">
                      {idx + 1}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      {student.full_name || "Student"}
                    </div>
                    <div className="text-[10px] text-gray-400 truncate">
                      {student.college || "Trackr Member"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-orange-500 font-bold text-xs bg-orange-50 dark:bg-orange-500/10 px-2 py-0.5 rounded-full shrink-0">
                  <Flame className="w-3 h-3 fill-current" />
                  <span>{student.consistency_score || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="text-[11px] text-gray-400 dark:text-gray-600 px-2 leading-relaxed">
        <p>© 2026 Trackr • Built for Students & Engineers</p>
      </div>
    </aside>
  )
}

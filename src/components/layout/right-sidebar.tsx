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
  Trophy, 
  ChevronRight, 
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
    <aside className="hidden xl:flex w-[340px] h-screen sticky top-0 border-l border-gray-100 dark:border-[#2D2B3B] bg-[#FCFBFE] dark:bg-[#0B0A10] flex-col p-5 overflow-y-auto space-y-5 transition-colors duration-300 scrollbar-hide">
      
      {/* Enhanced Progress Message Composer (Clean single-surface design) */}
      <div className="bg-white dark:bg-[#12111A] border border-gray-100 dark:border-[#22212E] rounded-2xl p-3.5 shadow-xs hover:border-violet-200 dark:hover:border-violet-950/70 focus-within:ring-2 focus-within:ring-violet-500/15 focus-within:border-violet-500/40 transition-all duration-200">
        
        {/* Category Pills Header */}
        <div className="flex items-center gap-1.5 pb-2.5 mb-2 border-b border-gray-100 dark:border-[#22212E]">
          {(['Learned', 'Built', 'Practiced'] as const).map((type) => {
            const icons = { Learned: '💡', Built: '🚀', Practiced: '🎯' }
            const isSelected = progressType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setProgressType(type)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-violet-600 text-white shadow-xs shadow-violet-500/30"
                    : "bg-gray-100/80 dark:bg-[#1E1D2A] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                <span>{icons[type]}</span>
                <span>{type}</span>
              </button>
            )
          })}
        </div>

        {/* Seamless Message Writing Canvas */}
        <div className="relative">
          <RichTextEditor
            value={content}
            onChange={(val) => {
              setContent(val)
              if (!isComposerExpanded && val.trim().length > 0) setIsComposerExpanded(true)
            }}
            placeholder="Share what you accomplished today..."
            className={`w-full bg-transparent text-xs p-1 outline-none text-gray-900 dark:text-white leading-relaxed ${
              isComposerExpanded ? "min-h-[95px]" : "min-h-[58px]"
            }`}
            placeholderClassName="text-xs p-1 leading-relaxed"
          />

          {/* Attached Image Preview */}
          {imageFile && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-[#2D2B3B] max-h-36">
              <img
                src={URL.createObjectURL(imageFile)}
                alt="Attachment"
                className="w-full h-32 object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-all shadow-sm"
                aria-label="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100 dark:border-[#22212E]">
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
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors ${
                  imageFile ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' : ''
                }`}
                title="Attach photo"
                aria-label="Attach photo"
              >
                <ImageIcon className="w-4 h-4 stroke-[2]" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors ${
                    showEmojis ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' : ''
                  }`}
                  title="Emoji"
                  aria-label="Insert emoji"
                >
                  <Smile className="w-4 h-4 stroke-[2]" />
                </button>

                {showEmojis && (
                  <div className="absolute bottom-9 left-0 z-50 bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] p-2 rounded-xl shadow-xl grid grid-cols-4 gap-1 animate-in fade-in zoom-in-95 duration-150">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setContent((prev) => prev + emoji)
                          setShowEmojis(false)
                        }}
                        className="w-7 h-7 hover:bg-gray-100 dark:hover:bg-[#2D2B3B] rounded-lg transition-transform active:scale-90 flex items-center justify-center text-sm"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {content.trim().length > 0 && (
                <span className="text-[10px] text-gray-400 font-medium">
                  {content.replace(/<[^>]*>/g, '').length}
                </span>
              )}

              <Button
                size="sm"
                onClick={handlePost}
                disabled={isSubmitting || (!content.trim() && !imageFile)}
                className="h-7 px-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-full text-xs font-semibold shadow-xs active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Trending Discussions & Topics */}
      <div className="bg-white dark:bg-[#12111A] border border-gray-100 dark:border-[#22212E] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            <TrendingUp className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" /> Trending Discussions
          </div>
        </div>
        <div className="space-y-1.5">
          {trendingTags.map((item) => (
            <div 
              key={item.tag}
              className="flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-[#1A1926] p-2 -mx-1 rounded-xl cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-gray-50 dark:bg-[#1B1A26] flex items-center justify-center text-xs shrink-0 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                    #{item.tag}
                  </div>
                  <div className="text-[10.5px] text-gray-400 leading-tight">
                    {item.count}
                  </div>
                </div>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 group-hover:text-violet-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </div>

      {/* Top Consistent Students Leaderboard Snapshot */}
      <div className="bg-white dark:bg-[#12111A] border border-gray-100 dark:border-[#22212E] rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
            <Trophy className="w-3.5 h-3.5 text-amber-500" /> Top Streaks
          </div>
          <Link href="/leaderboard" className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:underline">
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
          <div className="space-y-2">
            {topStudents.map((student, idx) => (
              <Link
                key={student.id}
                href={`/profile/${student.id}`}
                className="flex items-center justify-between hover:bg-gray-50/80 dark:hover:bg-[#1A1926] p-1.5 -mx-1 rounded-xl transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
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

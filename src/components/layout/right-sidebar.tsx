'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { 
  X, 
  Image as ImageIcon, 
  Smile, 
  Loader2, 
  Bold, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { updateUserStreakAndBadge } from "@/lib/utils/streak"

export function RightSidebar() {
  const [content, setContent] = useState("")
  const [progressType, setProgressType] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const commonEmojis = ["🔥", "🚀", "💡", "💻", "✅", "🎉", "🧠", "✨", "🎯", "⚡", "📚", "🙌"]

  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Close emoji popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojis(false)
      }
    }
    if (showEmojis) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojis])

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const toggleBold = () => {
    document.execCommand('bold', false)
  }

  const handlePost = async () => {
    const textContent = content.replace(/<[^>]*>/g, '').trim()
    if (!textContent && !imageFile) return
    if (isSubmitting) return

    setIsSubmitting(true)
    setFeedback(null)

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

      // Update streak and badge achievements
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
      setShowEmojis(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      setFeedback({ type: 'success', message: 'Progress posted successfully!' })
      router.refresh()
    } catch (error: any) {
      console.error("Error posting from right sidebar:", error)
      setFeedback({ type: 'error', message: error?.message || 'Failed to post progress. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const charCount = content.replace(/<[^>]*>/g, '').length
  const isPostValid = (charCount > 0 || imageFile !== null) && !isSubmitting

  const categories = [
    { id: 'Learned', label: 'Learned', icon: '💡' },
    { id: 'Built', label: 'Built', icon: '🚀' },
    { id: 'Practiced', label: 'Practiced', icon: '🎯' },
    { id: 'Other', label: 'Other', icon: '📝' },
  ] as const

  return (
    <aside className="hidden xl:flex w-[320px] h-screen sticky top-0 border-l border-gray-100 dark:border-[#2D2B3B] bg-[#FCFBFE] dark:bg-[#0B0A10] flex-col p-4 shrink-0 transition-colors duration-300">
      
      {/* Focused Share Your Progress Composer Card */}
      <div className="bg-white dark:bg-[#12111A] border border-gray-200/80 dark:border-[#242332] rounded-2xl p-4 shadow-xs flex flex-col transition-all">
        
        {/* Header */}
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900 dark:text-white">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <span>Share your progress</span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            What did you learn or build today?
          </p>
        </div>

        {/* Progress Type Selector */}
        <div className="flex items-center gap-1.5 pb-3 border-b border-gray-100 dark:border-[#22212E] mb-3">
          {categories.map((cat) => {
            const isSelected = progressType === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setProgressType(cat.id as any)}
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex items-center gap-1 transition-all active:scale-95 ${
                  isSelected
                    ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 shadow-xs"
                    : "bg-gray-100/70 dark:bg-[#1A1926] text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent"
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Text Input Area (Clean, comfortable, expanding, no forced min-160px) */}
        <div className="relative flex flex-col">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="What did you work on today? Share a breakthrough, win, or challenge..."
            className="w-full bg-transparent text-xs p-1 min-h-[90px] max-h-[220px] outline-none text-gray-900 dark:text-gray-100 leading-relaxed overflow-y-auto"
            placeholderClassName="text-xs p-1 leading-relaxed text-gray-400 dark:text-gray-500"
          />

          {/* Attached Image Preview */}
          {imageFile && (
            <div className="relative mt-2 rounded-xl overflow-hidden border border-gray-200 dark:border-[#2D2B3B] max-h-36 shrink-0">
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

          {/* Toolbar and Post Action */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-gray-100 dark:border-[#22212E] relative">
            
            {/* Toolbar Buttons */}
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
                className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors ${
                  imageFile ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' : ''
                }`}
                title="Attach photo"
                aria-label="Attach photo"
              >
                <ImageIcon className="w-4 h-4 stroke-[2]" />
              </button>

              <button
                type="button"
                onClick={toggleBold}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
                title="Bold text"
                aria-label="Bold text"
              >
                <Bold className="w-3.5 h-3.5 stroke-[2.2]" />
              </button>

              <div className="relative" ref={emojiPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors ${
                    showEmojis ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' : ''
                  }`}
                  title="Insert emoji"
                  aria-label="Insert emoji"
                >
                  <Smile className="w-4 h-4 stroke-[2]" />
                </button>

                {/* Popover correctly positioned OVERLAY above button (never inside text area) */}
                {showEmojis && (
                  <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-[#1A1926] border border-gray-200 dark:border-[#2D2B3B] p-2 rounded-2xl shadow-xl grid grid-cols-4 gap-1.5 w-44 animate-in fade-in zoom-in-95 duration-150">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setContent((prev) => prev + emoji)
                          setShowEmojis(false)
                        }}
                        className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-[#252436] rounded-lg transition-transform active:scale-90 flex items-center justify-center text-base"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Character Count & Post Button */}
            <div className="flex items-center gap-2">
              {charCount > 0 && (
                <span className="text-[10.5px] text-gray-400 font-medium">
                  {charCount}
                </span>
              )}

              <Button
                size="sm"
                onClick={handlePost}
                disabled={!isPostValid}
                className="h-7 px-3.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-full text-xs font-semibold shadow-xs active:scale-95 transition-all"
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`mt-3 p-2 rounded-xl text-xs flex items-center gap-1.5 animate-in fade-in duration-150 ${
            feedback.type === 'success' 
              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40' 
              : 'bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400 border border-red-200/50 dark:border-red-800/40'
          }`}>
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            )}
            <span className="truncate">{feedback.message}</span>
          </div>
        )}
      </div>

      {/* Subtle Sidebar Footer Info */}
      <div className="mt-auto pt-3 text-[11px] text-gray-400 dark:text-gray-600 px-1 leading-relaxed">
        <p>© 2026 Trackr • Focused Progress</p>
      </div>
    </aside>
  )
}

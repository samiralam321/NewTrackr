'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
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

  const textareaRef = useRef<HTMLTextAreaElement>(null)
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

  // Clear feedback after 3.5 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [feedback])

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)

    // Auto-expand naturally with typing up to 200px max height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }

  const toggleBold = () => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = content.substring(start, end)

    if (selectedText) {
      const isAlreadyBold = selectedText.startsWith('**') && selectedText.endsWith('**')
      const replacement = isAlreadyBold ? selectedText.slice(2, -2) : `**${selectedText}**`
      const newContent = content.substring(0, start) + replacement + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start, start + replacement.length)
      }, 0)
    } else {
      const replacement = '**bold**'
      const newContent = content.substring(0, start) + replacement + content.substring(end)
      setContent(newContent)
      setTimeout(() => {
        textarea.focus()
        textarea.setSelectionRange(start + 2, start + 6)
      }, 0)
    }
  }

  const insertEmoji = (emoji: string) => {
    const textarea = textareaRef.current
    if (!textarea) {
      setContent(prev => prev + emoji)
      setShowEmojis(false)
      return
    }

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const newContent = content.substring(0, start) + emoji + content.substring(end)
    setContent(newContent)
    setShowEmojis(false)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + emoji.length, start + emoji.length)
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
    }, 0)
  }

  const handlePost = async () => {
    const textContent = content.trim()
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
        content: textContent,
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
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
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

  const charCount = content.length
  const isPostValid = (charCount > 0 || imageFile !== null) && !isSubmitting

  const categories = [
    { id: 'Learned', label: 'Learned', icon: '💡' },
    { id: 'Built', label: 'Built', icon: '🚀' },
    { id: 'Practiced', label: 'Practiced', icon: '🎯' },
    { id: 'Other', label: 'Other', icon: '📝' },
  ] as const

  return (
    <aside className="hidden xl:flex w-[340px] h-screen sticky top-0 border-l border-gray-100 dark:border-[#2D2B3B] bg-[#FCFBFE] dark:bg-[#0B0A10] flex-col pt-8 px-4 pb-4 shrink-0 transition-colors duration-300">
      
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

        {/* Progress Type Selector (Grid with 4 visible items, zero clipping) */}
        <div className="grid grid-cols-4 gap-1.5 pb-3 border-b border-gray-100 dark:border-[#22212E] mb-3">
          {categories.map((cat) => {
            const isSelected = progressType === cat.id
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setProgressType(cat.id as any)}
                className={`text-[11px] font-semibold py-1.5 px-1 rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95 text-center ${
                  isSelected
                    ? "bg-violet-50 dark:bg-violet-950/60 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-800/60 shadow-xs"
                    : "bg-gray-100/70 dark:bg-[#1A1926] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-transparent"
                }`}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            )
          })}
        </div>

        {/* Text Input Area (Clean auto-expanding textarea, comfortable padding, no blank space) */}
        <div className="relative flex flex-col">
          <textarea
            ref={textareaRef}
            rows={2}
            value={content}
            onChange={handleTextareaInput}
            placeholder="What did you work on today? Share a breakthrough, win, or challenge..."
            className="w-full bg-transparent text-[13px] px-3 py-2 outline-none text-gray-900 dark:text-gray-100 leading-relaxed resize-none min-h-[68px] max-h-[200px] overflow-y-auto placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl"
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

          {/* Dedicated Toolbar Row */}
          <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-gray-100 dark:border-[#22212E] relative">
            
            {/* Toolbar Buttons: Image, Emoji, Formatting */}
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
                className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 font-bold text-xs transition-colors"
                title="Bold formatting (**text**)"
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

                {/* Popover overlay directly above button */}
                {showEmojis && (
                  <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-[#1A1926] border border-gray-200 dark:border-[#2D2B3B] p-2 rounded-2xl shadow-xl grid grid-cols-4 gap-1.5 w-44 animate-in fade-in zoom-in-95 duration-150">
                    {commonEmojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
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
                className={`h-7 px-3.5 rounded-full text-xs font-semibold shadow-xs transition-all ${
                  isPostValid
                    ? 'bg-violet-600 hover:bg-violet-700 text-white cursor-pointer active:scale-95'
                    : 'bg-violet-600/30 text-white/50 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3 h-3 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedback && (
          <div className={`mt-2.5 p-2 rounded-xl text-xs flex items-center gap-1.5 animate-in fade-in duration-150 ${
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

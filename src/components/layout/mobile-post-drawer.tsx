'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { X, Image as ImageIcon, Plus, Loader2, PenLine, Smile } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { updateUserStreakAndBadge } from "@/lib/utils/streak"

export function MobilePostDrawer() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [progressType, setProgressType] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const quickEmojis = ["🚀", "🔥", "💡", "💻", "🐛", "✅", "🎉", "👀", "🙌", "🧠"]
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()


  const toggleBold = () => {
    document.execCommand('bold', false)
    const editor = document.querySelector('.mobile-rich-editor') as HTMLElement
    if (editor) {
      setContent(editor.innerHTML)
      editor.focus()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
      e.preventDefault()
      toggleBold()
    }
  }



  const handlePost = async () => {
    if (!content.trim()) return

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
          // Dispatch custom event to notify all components about profile update
          window.dispatchEvent(
            new CustomEvent('profile-updated', {
              detail: {
                consistency_score: result.streak,
                badge_level: result.badgeLevel,
                last_post_date: new Date().toISOString().split('T')[0]
              }
            })
          )

          if ('isNewBadgeEarned' in result && result.isNewBadgeEarned) {
            // Dispatch custom event for immediate celebration modal
            window.dispatchEvent(
              new CustomEvent('badge-earned', {
                detail: {
                  level: result.badgeLevel,
                  streak: result.streak,
                },
              })
            )
          }
        }
      } catch (streakErr) {
        console.error("Error updating streak/badge on mobile post:", streakErr)
      }

      // Reset form
      setContent("")
      setImageFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      setIsOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error posting:", error)
      alert("Failed to post progress.")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Don't render the FAB on the messages page
  if (pathname?.startsWith('/messages')) {
    return null;
  }

  return (
    <>
      {/* Floating Action Button (FAB) - Material You Squircle */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom,0px))] right-4 w-13 h-13 bg-gradient-to-tr from-violet-600 to-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 hover:scale-105 active:scale-95 transition-all duration-200 z-40"
        aria-label="Create new progress post"
      >
        <PenLine className="w-5 h-5" />
      </button>

      {/* Full Screen Native Android Composer */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-white dark:bg-[#0B0A10] flex flex-col animate-in slide-in-from-bottom duration-250">
          {/* Top App Bar */}
          <div className="flex items-center justify-between px-3 h-14 border-b border-gray-100 dark:border-[#2D2B3B] bg-white/95 dark:bg-[#0B0A10]/95 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsOpen(false)} 
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A24] active:scale-95 transition-transform"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white">Share Progress</h2>
            </div>
            
            <Button 
              onClick={handlePost}
              disabled={isSubmitting || !content.trim()}
              className="h-8 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-xs font-bold disabled:opacity-40 shadow-sm active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post'}
            </Button>
          </div>

          {/* Category Chips Bar */}
          <div className="px-4 py-2 border-b border-gray-100/80 dark:border-[#2D2B3B]/60 bg-gray-50/50 dark:bg-[#12111A] shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 shrink-0">Type:</span>
              {(['Learned', 'Built', 'Practiced', 'Other'] as const).map((type) => {
                const isSelected = progressType === type
                const icon = type === 'Learned' ? '💡' : type === 'Built' ? '🚀' : type === 'Practiced' ? '🎯' : '📝'
                return (
                  <button 
                    key={type}
                    onClick={() => setProgressType(type)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 active:scale-95 ${
                      isSelected 
                        ? 'bg-violet-600 text-white shadow-xs' 
                        : 'bg-white dark:bg-[#1A1A24] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#2D2B3B]'
                    }`}
                  >
                    <span>{icon}</span>
                    <span>{type}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Body Editor Area */}
          <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col">
            <RichTextEditor 
              value={content}
              onChange={setContent}
              onKeyDown={handleKeyDown}
              placeholder="What did you work on today?&#10;• What did you learn, build, or practice?&#10;• Drop your progress here..."
              className="w-full flex-1 min-h-[220px] text-[15px] focus-visible:ring-0 placeholder:text-gray-400 bg-transparent mobile-rich-editor text-gray-900 dark:text-white"
            />

            {/* Attached Image Preview */}
            {imageFile && (
              <div className="relative mt-3 rounded-xl overflow-hidden border border-gray-200 dark:border-[#2D2B3B] bg-gray-50 dark:bg-[#1A1A24] max-h-48 flex items-center justify-center group">
                <img 
                  src={URL.createObjectURL(imageFile)} 
                  alt="Attachment preview" 
                  className="w-full h-48 object-cover" 
                />
                <button 
                  onClick={() => {
                    setImageFile(null)
                    if (fileInputRef.current) fileInputRef.current.value = ''
                  }} 
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom Docked Toolbar (Material 3 style) */}
          <div className="relative border-t border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] px-3 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] flex items-center justify-between shrink-0">
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
                className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A24] active:scale-90 transition-all ${imageFile ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' : ''}`}
                title="Add Image"
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className={`w-10 h-10 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A24] active:scale-90 transition-all ${showEmojis ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' : ''}`}
                title="Insert Emoji"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={toggleBold}
                className="w-10 h-10 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A24] font-black text-sm active:scale-90 transition-all"
                title="Bold Text"
              >
                B
              </button>
            </div>

            {/* Quick Helper Badge */}
            <span className="text-[11px] font-medium text-gray-400 pr-1">
              {content.length > 0 ? `${content.length} chars` : 'Markdown supported'}
            </span>

            {/* Emoji Picker Overlay */}
            {showEmojis && (
              <div className="absolute bottom-14 left-2 bg-white dark:bg-[#1A1A24] p-2.5 rounded-2xl border border-gray-100 dark:border-[#2D2B3B] shadow-xl grid grid-cols-5 gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                {quickEmojis.map(emoji => (
                  <button 
                    key={emoji} 
                    onClick={() => { setContent(prev => prev + emoji); setShowEmojis(false); }}
                    className="w-10 h-10 text-xl hover:bg-gray-100 dark:hover:bg-[#2D2B3B] rounded-xl transition-transform active:scale-90 flex items-center justify-center"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}

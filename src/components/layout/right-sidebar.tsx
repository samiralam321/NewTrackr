'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { X, Image as ImageIcon, Smile, Plus, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { updateUserStreakAndBadge } from "@/lib/utils/streak"

export function RightSidebar() {
  const [content, setContent] = useState("")
  const [hours, setHours] = useState("")
  const [mins, setMins] = useState("")
  const [progressType, setProgressType] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const commonEmojis = ["😂", "👍", "🔥", "🚀", "❤️", "💯", "✨", "🙏", "💡", "💻"]
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()


  const toggleBold = () => {
    document.execCommand('bold', false)
    const editor = document.querySelector('.desktop-rich-editor') as HTMLElement
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

      const timeSpent = (parseInt(hours || "0") * 60) + parseInt(mins || "0")

      const { error } = await supabase.from('posts').insert({
        user_id: userData.user.id,
        content,
        tags: [],
        time_spent: timeSpent > 0 ? timeSpent : null,
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
        console.error("Error updating streak/badge on desktop post:", streakErr)
      }

      // Reset form
      setContent("")
      setHours("")
      setMins("")
      setImageFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      
      router.refresh()
    } catch (error) {
      console.error("Error posting:", error)
      alert("Failed to post progress.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <aside className="hidden lg:flex w-[320px] h-screen sticky top-0 border-l border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] flex-col p-6 overflow-y-auto transition-colors duration-300">
      <div className="flex items-center justify-between mb-8">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 dark:text-gray-500 rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24]">
          <X className="w-4 h-4" />
        </Button>
      </div>

      <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Share your progress</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">What did you learn or build today?</p>

      <div className="flex-1 flex flex-col gap-6">
        {/* Textarea */}
        <div className="relative">
          <RichTextEditor 
            value={content}
            onChange={setContent}
            onKeyDown={handleKeyDown}
            placeholder="What did you work on today?&#10;Drop your progress 👇"
            className="min-h-[160px] border border-gray-200 dark:border-[#2D2B3B] bg-white dark:bg-[#1A1A24] dark:text-white dark:placeholder-gray-500 focus-visible:ring-violet-500 rounded-2xl p-4 text-sm pb-12 transition-colors duration-300 desktop-rich-editor"
          />
          <div className="absolute bottom-3 left-3 right-3 flex justify-between items-center text-gray-400">
            <div className="flex items-center gap-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                accept="image/*" 
                className="hidden" 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2B3B] hover:text-gray-600 dark:hover:text-gray-300"
              >
                <ImageIcon className="w-4 h-4" />
              </Button>
              <div className="relative">
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`h-8 w-8 rounded-full hover:bg-gray-100 dark:hover:bg-[#2D2B3B] hover:text-gray-600 dark:hover:text-gray-300 ${showEmojis ? 'bg-gray-100 dark:bg-[#2D2B3B] text-gray-900 dark:text-white' : ''}`}
                >
                  <Smile className="w-4 h-4" />
                </Button>
                
                {showEmojis && (
                  <div className="absolute bottom-full mb-2 left-0 bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] rounded-xl p-2 shadow-xl flex flex-wrap w-[220px] gap-1 z-50">
                    {commonEmojis.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => {
                          setContent(prev => prev + emoji)
                          setShowEmojis(false)
                        }} 
                        className="hover:bg-gray-100 dark:hover:bg-[#2D2B3B] w-8 h-8 flex items-center justify-center rounded-lg transition-colors text-lg"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={toggleBold}
                className="h-8 w-8 rounded-full text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 hover:text-violet-700 dark:hover:text-violet-300 font-extrabold text-sm active:scale-90 transition-all duration-200"
                title="Bold Text"
              >
                B
              </Button>
              
              {imageFile && (
                <div className="ml-2 bg-violet-50 dark:bg-violet-900/30 px-2 py-1 rounded-md text-[11px] font-semibold text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-800 flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  <span className="truncate max-w-[80px]">Attached</span>
                  <button onClick={() => setImageFile(null)} className="ml-1 text-violet-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
            </div>
          </div>
        </div>





        {/* Type of progress */}
        <div>
          <label className="text-sm font-semibold text-gray-900 dark:text-white block mb-3">What type of progress?</label>
          <div className="flex flex-wrap gap-2">
            {(['Learned', 'Built', 'Practiced', 'Other'] as const).map((type) => (
              <button 
                key={type}
                onClick={() => setProgressType(type)}
                className={`px-3 py-2 border rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors duration-300 ${
                  progressType === type 
                    ? 'bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-800 font-semibold' 
                    : 'bg-white dark:bg-[#1A1A24] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#2D2B3B] hover:bg-gray-50 dark:hover:bg-[#2D2B3B]'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${progressType === type ? 'bg-violet-600' : 'border border-gray-400'}`}></span> {type}
              </button>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-auto pt-4">
          <Button 
            onClick={handlePost}
            disabled={isSubmitting || !content.trim()}
            className="w-full bg-violet-500 hover:bg-violet-600 text-white rounded-xl h-12 text-base font-semibold shadow-sm disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Post Progress'}
          </Button>
        </div>
      </div>
    </aside>
  )
}

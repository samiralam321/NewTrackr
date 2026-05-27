'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { X, Image as ImageIcon, Plus, Loader2, PenLine, Smile } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"

export function MobilePostDrawer() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>(["#DSA", "#Coding"])
  const [newTag, setNewTag] = useState("")
  const [isAddingTag, setIsAddingTag] = useState(false)
  const [progressType, setProgressType] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const quickEmojis = ["🚀", "🔥", "💡", "💻", "🐛", "✅", "🎉", "👀", "🙌", "🧠"]
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim().startsWith('#') ? newTag.trim() : `#${newTag.trim()}`])
    }
    setNewTag("")
    setIsAddingTag(false)
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
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
        tags,
        type: progressType,
        image_url: imageUrl
      })

      if (error) throw error

      // Update streak (Sync Consistency Score)
      try {
        const { data: profile } = await supabase.from('profiles').select('consistency_score, last_post_date').eq('id', userData.user.id).single()
        if (profile) {
          const today = new Date()
          const todayStr = today.toISOString().split('T')[0]
          
          let newStreak = profile.consistency_score || 0
          const lastPostDate = profile.last_post_date ? new Date(profile.last_post_date) : null
          
          if (!lastPostDate) {
            newStreak = 1
          } else {
            const lastPostStr = lastPostDate.toISOString().split('T')[0]
            if (lastPostStr !== todayStr) {
              const yesterday = new Date(today)
              yesterday.setDate(yesterday.getDate() - 1)
              const yesterdayStr = yesterday.toISOString().split('T')[0]
              
              if (lastPostStr === yesterdayStr) {
                newStreak += 1
              } else {
                newStreak = 1 // Reset streak if yesterday was missed
              }
            }
          }

          if (profile.last_post_date !== todayStr || newStreak !== profile.consistency_score) {
            await supabase.from('profiles').update({
              consistency_score: newStreak,
              last_post_date: todayStr
            }).eq('id', userData.user.id)
          }
        }
      } catch (streakErr) {
        console.error("Error updating streak on mobile post:", streakErr)
      }

      // Reset form
      setContent("")
      setTags(["#DSA", "#Coding"])
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
      {/* Floating Action Button (FAB) */}
      <button 
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-violet-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-violet-700 active:scale-95 transition-transform z-40"
      >
        <PenLine className="w-6 h-6" />
      </button>

      {/* Full Screen Drawer/Modal */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-[#F8F7FF] flex flex-col animate-in slide-in-from-bottom-full duration-300">
          {/* Header */}
          <div className="flex items-center justify-between px-4 h-14 border-b border-violet-100 bg-white/50 backdrop-blur-md">
            <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 text-gray-900">
              <X className="w-6 h-6" />
            </button>
            <Button 
              onClick={handlePost}
              disabled={isSubmitting || !content.trim()}
              className="h-8 px-4 bg-violet-600 hover:bg-violet-700 text-white rounded-full text-sm font-semibold disabled:opacity-50 shadow-sm"
            >
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Post'}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
            {/* Textarea Card */}
            <div className="relative bg-white rounded-3xl p-1 shadow-sm border border-violet-50">
              <Textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="What did you work on today?&#10;Drop your progress 👇"
                className="min-h-[180px] text-base resize-none border-none shadow-none focus-visible:ring-0 p-4 placeholder:text-gray-400 pb-14 bg-transparent"
                autoFocus
              />
              {imageFile && (
                <div className="absolute top-2 right-0 bg-white/90 p-1 rounded-md text-xs font-medium text-violet-600 border border-violet-100 shadow-sm flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Attached
                  <button onClick={() => setImageFile(null)} className="ml-1 text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                </div>
              )}
              <div className="absolute bottom-2 left-2 flex gap-1 bg-violet-50/50 p-1 rounded-2xl border border-violet-100/50">
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
                  className="h-10 w-10 rounded-full text-violet-600 bg-violet-50 hover:bg-violet-100"
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowEmojis(!showEmojis)}
                  className={`h-10 w-10 rounded-full text-violet-600 hover:bg-violet-100 transition-colors ${showEmojis ? 'bg-violet-100' : 'bg-violet-50'}`}
                >
                  <Smile className="w-5 h-5" />
                </Button>
                {/* Emoji Picker Overlay */}
                {showEmojis && (
                  <div className="absolute bottom-14 left-0 bg-white p-3 rounded-2xl border border-violet-100 shadow-xl grid grid-cols-5 gap-2 w-max z-50">
                    {quickEmojis.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => { setContent(prev => prev + emoji); setShowEmojis(false); }}
                        className="text-2xl hover:bg-gray-100 p-2 rounded-xl shrink-0 transition-transform active:scale-95 flex items-center justify-center"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <hr className="border-gray-50" />

            {/* Options Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-violet-50 flex flex-col gap-6">
              {/* Tags */}
              <div>
                <label className="text-sm font-semibold text-gray-900 block mb-3">Add tags</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span key={tag} className="px-3 py-1.5 bg-[#E6F8F1] text-emerald-600 rounded-lg text-xs font-medium flex items-center gap-1 group">
                    {tag}
                    <button onClick={() => removeTag(tag)} className="opacity-100"><X className="w-3 h-3" /></button>
                  </span>
                ))}
                {isAddingTag ? (
                  <input 
                    autoFocus
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onBlur={handleAddTag}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="px-3 py-1.5 w-24 border border-violet-200 focus:outline-none focus:ring-1 focus:ring-violet-500 rounded-lg text-xs font-medium"
                  />
                ) : (
                  <button onClick={() => setIsAddingTag(true)} className="px-3 py-1.5 border border-gray-200 text-gray-400 hover:bg-gray-50 rounded-lg text-xs font-medium flex items-center justify-center">
                    <Plus className="w-3 h-3" /> Add
                  </button>
                )}
              </div>
            </div>

            {/* Type of progress */}
            <div>
              <label className="text-sm font-semibold text-gray-900 block mb-3">Type of progress</label>
              <div className="flex flex-wrap gap-2">
                {(['Learned', 'Built', 'Practiced', 'Other'] as const).map((type) => (
                  <button 
                    key={type}
                    onClick={() => setProgressType(type)}
                    className={`px-3 py-2 border rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                      progressType === type 
                        ? 'bg-violet-50 text-violet-600 border-violet-100 font-semibold' 
                        : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${progressType === type ? 'bg-violet-600' : 'border border-gray-400'}`}></span> {type}
                  </button>
                ))}
              </div>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

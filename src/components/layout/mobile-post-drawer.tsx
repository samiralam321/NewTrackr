'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { X, Image as ImageIcon, Loader2, PenLine, Smile, Check, AtSign, Code2 } from "lucide-react"
import { CodeSnippetModal, CodeSnippetData } from "@/components/dashboard/code-snippet-modal"
import { LANGUAGE_LABELS } from "@/components/ui/carbon-code-block"
import { createClient } from "@/lib/supabase/client"
import { useRouter, usePathname } from "next/navigation"
import { updateUserStreakAndBadge } from "@/lib/utils/streak"

export function MobilePostDrawer({ profile }: { profile?: any }) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [showEmojis, setShowEmojis] = useState(false)
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [attachedSnippet, setAttachedSnippet] = useState<CodeSnippetData | null>(null)
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

  const resetForm = () => {
    setContent("")
    setImageFile(null)
    setAttachedSnippet(null)
    setShowEmojis(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    setIsOpen(false)
  }

  const handlePasteImage = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
    if (!validTypes.includes(file.type.toLowerCase())) return
    if (file.size > 5 * 1024 * 1024) return

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
    const fileName = file.name && file.name !== 'image.png' && file.name !== 'blob'
      ? file.name
      : `pasted-${Date.now()}.${ext}`
    const namedFile = new File([file], fileName, { type: file.type })
    setImageFile(namedFile)
  }

  const handleGlobalPaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        const file = e.clipboardData.files[i]
        if (file && file.type.startsWith('image/')) {
          e.preventDefault()
          handlePasteImage(file)
          return
        }
      }
    }
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            handlePasteImage(file)
            return
          }
        }
      }
    }
  }

  const handlePost = async () => {
    if (!content.trim() && !imageFile && !attachedSnippet) return

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

      const finalSnippetBlock = attachedSnippet 
        ? `\`\`\`${attachedSnippet.language}:${attachedSnippet.theme}${attachedSnippet.title ? `:${attachedSnippet.title}` : ''}\n${attachedSnippet.code}\n\`\`\`` 
        : null
      const finalPostContent = finalSnippetBlock 
        ? (content.trim() ? `${content.trim()}\n\n${finalSnippetBlock}` : finalSnippetBlock) 
        : content.trim()

      const { data: insertedPost, error } = await supabase.from('posts').insert({
        user_id: userData.user.id,
        content: finalPostContent,
        tags: [],
        type: null,
        image_url: imageUrl
      }).select(`
        *,
        profiles!posts_user_id_fkey(id, full_name, avatar_url, bio, college, consistency_score, streak),
        likes(user_id),
        comments(user_id, id),
        bookmarks(user_id)
      `).single()

      if (insertedPost) {
        const formattedNewPost = {
          ...insertedPost,
          user_has_liked: false,
          user_has_bookmarked: false,
          likes_count: 0,
          comments_count: 0,
          bookmarks_count: 0,
          is_pinned: false
        }
        window.dispatchEvent(new CustomEvent('post-created', { detail: formattedNewPost }))
      }

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

          if ('isNewBadgeEarned' in result && result.isNewBadgeEarned) {
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
      resetForm()
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

  const charLimit = 500
  const charPercentage = Math.min(100, Math.round((content.length / charLimit) * 100))

  return (
    <>
      {/* Floating Action Button (FAB) - Circular Twitter/X Style */}
      <button 
        onClick={() => {
          resetForm()
          setIsOpen(true)
        }}
        className="md:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] right-4 w-14 h-14 bg-violet-600 hover:bg-violet-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-violet-500/35 active:scale-95 transition-all duration-200 z-40"
        aria-label="New post"
      >
        <PenLine className="w-6 h-6 stroke-[2.2]" />
      </button>

      {/* Full Screen Twitter/X Style Native Android Composer */}
      {isOpen && (
        <div 
          onPaste={handleGlobalPaste}
          className="md:hidden fixed inset-0 z-[100] bg-white dark:bg-black flex flex-col animate-in slide-in-from-bottom duration-200"
        >
          
          {/* Top Bar: Close on left, Character counter + Post pill on right */}
          <div className="flex items-center justify-between px-3 h-14 border-b border-gray-100 dark:border-neutral-900 bg-white dark:bg-black shrink-0">
            <button 
              onClick={handleClose} 
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-neutral-800 active:scale-90 transition-all"
              aria-label="Close"
            >
              <X className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">
                    {content.length}
                  </span>
                  <svg className="w-4 h-4 -rotate-90" viewBox="0 0 36 36">
                    <path
                      className="text-gray-200 dark:text-neutral-800 stroke-current"
                      strokeWidth="3.5"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      className={`${charPercentage >= 90 ? 'text-amber-500' : 'text-violet-600'} stroke-current transition-all duration-150`}
                      strokeDasharray={`${charPercentage}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                </div>
              )}
              
              <Button 
                onClick={handlePost}
                disabled={isSubmitting || !content.trim()}
                className={`h-8 px-4 rounded-full text-[13px] font-bold transition-all shadow-none ${
                  content.trim() 
                    ? 'bg-violet-600 hover:bg-violet-700 text-white active:scale-95' 
                    : 'bg-violet-600/40 text-white/60 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Post'}
              </Button>
            </div>
          </div>

          {/* Top Quick Toolbar: Gallery / Emoji / Code / Bold (Always on TOP, never hidden by keyboard) */}
          <div className="relative flex items-center justify-end px-3 py-2 border-b border-gray-100 dark:border-neutral-900 bg-gray-50/50 dark:bg-[#12111A] shrink-0">
            {/* Gallery, Emoji, Code, and Bold Actions */}
            <div className="flex items-center gap-1">
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={(e) => setImageFile(e.target.files?.[0] || null)} 
                accept="image/jpeg,image/png,image/webp,image/jpg" 
                className="hidden" 
              />
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-100/50 dark:hover:bg-violet-950/40 active:scale-90 transition-all ${imageFile ? 'bg-violet-100 dark:bg-violet-950/60 ring-1 ring-violet-500' : ''}`}
                title="Add Photo"
                aria-label="Add photo"
              >
                <ImageIcon className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>
              
                            <button 
                type="button"
                onClick={() => setContent(prev => prev + '@')}
                className="w-9 h-9 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-100/50 dark:hover:bg-violet-950/40 active:scale-90 transition-all"
                title="Tag Person"
                aria-label="Tag person"
              >
                <AtSign className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>

<button 
                type="button"
                onClick={() => setShowEmojis(!showEmojis)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-100/50 dark:hover:bg-violet-950/40 active:scale-90 transition-all ${showEmojis ? 'bg-violet-100 dark:bg-violet-950/60 ring-1 ring-violet-500' : ''}`}
                title="Insert Emoji"
                aria-label="Insert emoji"
              >
                <Smile className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>

              <button 
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-100/50 dark:hover:bg-violet-950/40 active:scale-90 transition-all ${attachedSnippet ? 'bg-violet-100 dark:bg-violet-950/60 ring-1 ring-violet-500' : ''}`}
                title="Code Snippet"
                aria-label="Code snippet"
              >
                <Code2 className="w-4.5 h-4.5 stroke-[2.2]" />
              </button>

              <button 
                type="button"
                onClick={toggleBold}
                className="w-9 h-9 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-100/50 dark:hover:bg-violet-950/40 font-black text-sm active:scale-90 transition-all"
                title="Bold Text"
                aria-label="Bold text"
              >
                B
              </button>
            </div>

            {/* Emoji Picker Overlay */}
            {showEmojis && (
              <div className="absolute top-11 right-2 bg-white dark:bg-[#1A1A24] p-2.5 rounded-2xl border border-gray-100 dark:border-[#2D2B3B] shadow-2xl grid grid-cols-5 gap-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
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

          {/* Main Writing Canvas (Avatar on Left, Content on Right) */}
          <div className="flex-1 overflow-y-auto px-4 pt-3 pb-4 flex gap-3">
            {/* User Avatar */}
            <img 
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name || 'User'}&background=7C3AED&color=fff`} 
              alt="Profile" 
              className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-black/5 dark:ring-white/10 mt-0.5" 
            />

            {/* Composer Content Area */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Seamless Rich Text Editor */}
              <RichTextEditor 
                value={content}
                onChange={setContent}
                onKeyDown={handleKeyDown}
                onPasteImage={handlePasteImage}
                placeholder="What did you work on today? Share a breakthrough, win, or challenge..."
                className="w-full text-[16px] leading-relaxed bg-transparent mobile-rich-editor text-gray-900 dark:text-white border-none p-1 focus-visible:ring-0 min-h-[140px]"
              />

              {/* Attached Code Snippet Card */}
              {attachedSnippet && (
                <div className="mt-3 rounded-2xl border border-violet-200/80 dark:border-violet-900/60 bg-gradient-to-r from-violet-50/80 via-purple-50/40 to-indigo-50/60 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/20 p-2.5 flex items-center justify-between gap-2 shadow-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-lg bg-violet-600 text-white flex items-center justify-center shrink-0">
                      <Code2 className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-xs text-gray-900 dark:text-gray-100 truncate">
                          {attachedSnippet.title || `${LANGUAGE_LABELS[attachedSnippet.language] || attachedSnippet.language.toUpperCase()} Snippet`}
                        </span>
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 uppercase">
                          {LANGUAGE_LABELS[attachedSnippet.language] || attachedSnippet.language}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        {attachedSnippet.code.split('\n').length} lines
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCodeModalOpen(true)}
                      className="px-2 py-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/60 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedSnippet(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Attached Image Preview Card */}
              {imageFile && (
                <div className="relative mt-3 rounded-2xl overflow-hidden border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900 max-h-60">
                  <img 
                    src={URL.createObjectURL(imageFile)} 
                    alt="Attachment preview" 
                    className="max-h-60 w-auto max-w-full mx-auto object-contain block" 
                  />
                  <button 
                    onClick={() => {
                      setImageFile(null)
                      if (fileInputRef.current) fileInputRef.current.value = ''
                    }} 
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center transition-all active:scale-90 shadow-md backdrop-blur-xs"
                    aria-label="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Code Snippet Modal */}
      <CodeSnippetModal
        open={isCodeModalOpen}
        onOpenChange={setIsCodeModalOpen}
        initialData={attachedSnippet}
        onSaveSnippet={(snippet) => setAttachedSnippet(snippet)}
      />
    </>
  )
}

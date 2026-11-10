'use client'

import React, { useState, useRef, useEffect } from 'react'
import { X, Smile, Loader2 } from 'lucide-react'
import { Post } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'
import { updateUserStreakAndBadge } from '@/lib/utils/streak'
import { EmbeddedQuoteCard } from '@/components/dashboard/embedded-quote-card'

interface QuoteModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  targetPost: Post | null
  user?: any
  profile?: any
  onSuccess?: (newQuotePost: Post) => void
}

const EMOJI_LIST = ["💡", "🚀", "🎯", "🔥", "💻", "✨", "🧠", "📚", "🏆", "🙌", "😊", "😂", "🎉", "❤️", "💯"]

export function QuoteModal({
  open,
  onOpenChange,
  targetPost,
  user,
  profile,
  onSuccess
}: QuoteModalProps) {
  const [commentary, setCommentary] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showEmojis, setShowEmojis] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const pickerContainerRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Auto-focus and reset on open
  useEffect(() => {
    if (open) {
      setCommentary("")
      setShowEmojis(false)
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus()
        }
      }, 100)
    }
  }, [open])

  // Close emojis on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        pickerContainerRef.current && 
        !pickerContainerRef.current.contains(e.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(e.target as Node)
      ) {
        setShowEmojis(false)
      }
    }
    if (showEmojis) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showEmojis])

  // Position adjustment to prevent emoji dropdown from clipping against viewport edges
  useEffect(() => {
    if (!showEmojis) return

    const adjustPosition = () => {
      const el = pickerContainerRef.current
      if (!el) return

      el.style.transform = ''
      const rect = el.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const padding = 12

      if (rect.right > viewportWidth - padding) {
        const overflow = rect.right - (viewportWidth - padding)
        el.style.transform = `translateX(-${overflow}px)`
      } else if (rect.left < padding) {
        const underflow = padding - rect.left
        el.style.transform = `translateX(${underflow}px)`
      }

      const viewportHeight = window.innerHeight
      if (rect.bottom > viewportHeight - padding) {
        const spaceBelow = viewportHeight - rect.top - padding
        if (spaceBelow >= 120) {
          el.style.maxHeight = `${spaceBelow}px`
          el.style.overflowY = 'auto'
        }
      }
    }

    const rafId = requestAnimationFrame(adjustPosition)
    window.addEventListener('resize', adjustPosition)
    window.addEventListener('scroll', adjustPosition, true)
    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', adjustPosition)
      window.removeEventListener('scroll', adjustPosition, true)
    }
  }, [showEmojis])

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        if (isSubmitting) return
        onOpenChange(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, isSubmitting, onOpenChange])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.max(textareaRef.current.scrollHeight, 60)}px`
    }
  }, [commentary])

  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setCommentary(prev => prev + emoji)
      return
    }
    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const next = commentary.substring(0, start) + emoji + commentary.substring(end)
    setCommentary(next)
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(start + emoji.length, start + emoji.length)
      }
    }, 10)
  }

  const handlePost = async () => {
    if (!commentary.trim() || !targetPost) return
    const currentUid = user?.id || profile?.id
    if (!currentUid) {
      window.location.href = '/login'
      return
    }

    setIsSubmitting(true)
    try {
      const trimmed = commentary.trim()
      const quoteTag = `quote:${targetPost.id}`

      // Auto-extract hashtags
      const tagRegex = /#[\w-]+/g
      const extractedTags: string[] = trimmed.match(tagRegex) || []
      const finalTags = Array.from(new Set([quoteTag, ...extractedTags]))

      const payload: any = {
        user_id: currentUid,
        content: trimmed,
        tags: finalTags,
        type: 'Quote',
        time_spent: null,
        image_url: null,
        quoted_post_id: targetPost.id
      }

      let res = await supabase
        .from('posts')
        .insert(payload)
        .select(`*, profiles:user_id(id, full_name, avatar_url, bio, college, consistency_score, streak)`)
        .single()

      // Graceful fallback if quoted_post_id column does not exist yet in public.posts
      if (res.error) {
        const errorMsg = (res.error.message || '').toLowerCase()
        if (
          res.error.code === 'PGRST204' || 
          res.error.code === '42703' || 
          errorMsg.includes('schema cache') || 
          errorMsg.includes('quoted_post_id') ||
          errorMsg.includes('type')
        ) {
          delete payload.quoted_post_id
          delete payload.type
          res = await supabase
            .from('posts')
            .insert(payload)
            .select(`*, profiles:user_id(id, full_name, avatar_url, bio, college, consistency_score, streak)`)
            .single()
        }
      }

      if (res.error) throw res.error

      const newPost = {
        ...res.data,
        quoted_post: targetPost,
        quoted_post_id: targetPost.id,
        likes_count: 0,
        comments_count: 0,
        bookmarks_count: 0,
        reposts_count: 0,
        user_has_liked: false,
        user_has_bookmarked: false,
        user_has_reposted: false
      }

      // Send notification to original post author if not quoting own post
      if (targetPost.user_id !== currentUid) {
        try {
          await supabase.from('notifications').insert({
            user_id: targetPost.user_id,
            actor_id: currentUid,
            type: 'mention', // using mention for universal compatibility with check constraints
            post_id: res.data.id,
            is_read: false
          })
        } catch (notifErr) {
          console.warn("Could not insert quote notification:", notifErr)
        }
      }

      // Update user streak
      try {
        await updateUserStreakAndBadge(supabase, currentUid)
      } catch (e) {}

      // Dispatch real-time post-created event
      window.dispatchEvent(new CustomEvent('post-created', { detail: newPost }))

      if (onSuccess) {
        onSuccess(newPost)
      }

      setCommentary("")
      onOpenChange(false)
    } catch (err: any) {
      console.error("Quote post error:", err)
      alert(err.message || "Failed to publish quote post.")
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open || !targetPost) return null

  const userAvatar = profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'You')}&background=7C3AED&color=fff&size=80`

  return (
    <div 
      className="fixed inset-0 bg-black/65 backdrop-blur-xs z-[10000] flex items-start sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) onOpenChange(false)
      }}
    >
      <div 
        className="bg-white dark:bg-[#000000] w-full h-full sm:h-auto sm:max-h-[85vh] sm:max-w-[600px] rounded-none sm:rounded-2xl border border-transparent sm:border-[#eff3f4] dark:sm:border-[#2f3336] shadow-2xl flex flex-col overflow-visible animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#eff3f4] dark:border-[#2f3336] shrink-0 sm:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#0f1419] dark:text-[#e7e9ea] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
              Quote Post
            </h3>
          </div>

          <button
            type="button"
            onClick={handlePost}
            disabled={isSubmitting || !commentary.trim()}
            className="px-4 py-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm disabled:opacity-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-none"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Posting...</span>
              </>
            ) : (
              <span>Post</span>
            )}
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col [scrollbar-gutter:stable]">
          {/* User Input Row */}
          <div className="flex items-start gap-3">
            <img 
              src={userAvatar} 
              alt="You" 
              className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5" 
            />
            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={commentary}
                onChange={(e) => setCommentary(e.target.value)}
                placeholder="Add a comment..."
                maxLength={280}
                className="w-full text-[17px] font-normal text-[#0f1419] dark:text-[#e7e9ea] placeholder:font-normal placeholder:text-[#536471] dark:placeholder:text-[#71767b] bg-transparent outline-none border-none resize-none leading-snug overflow-hidden min-h-[60px]"
              />
            </div>
          </div>

          {/* Embedded Quoted Post Preview */}
          <div className="ml-13 mt-2">
            <EmbeddedQuoteCard quotedPost={targetPost} quotedPostId={targetPost.id} />
          </div>
        </div>

        {/* Bottom Toolbar */}
        <div className="px-4 py-2.5 border-t border-[#eff3f4] dark:border-[#2f3336] flex items-center justify-between shrink-0 bg-white dark:bg-[#000000] sm:rounded-b-2xl">
          <div className="relative" ref={emojiRef}>
            <button
              type="button"
              ref={emojiButtonRef}
              onClick={() => setShowEmojis(!showEmojis)}
              className={`w-8 h-8 rounded-full flex items-center justify-center text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer ${showEmojis ? 'bg-violet-100 dark:bg-violet-950/60' : ''}`}
              title="Add emoji"
            >
              <Smile className="w-5 h-5" />
            </button>

            {showEmojis && (
              <div 
                ref={pickerContainerRef}
                className="absolute left-0 top-full mt-2 max-w-[calc(100vw-24px)] bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl shadow-xl p-2.5 w-60 z-50 animate-in fade-in zoom-in-95 duration-150"
              >
                <div className="grid grid-cols-5 gap-1">
                  {EMOJI_LIST.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleInsertEmoji(emoji)}
                      className="w-8 h-8 rounded-lg hover:bg-violet-50 dark:hover:bg-violet-950/40 text-base flex items-center justify-center transition-transform active:scale-125 select-none cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {commentary.length > 0 && (
              <span className={`text-xs font-medium ${
                commentary.length > 260 ? 'text-rose-500' : 'text-[#536471] dark:text-[#71767b]'
              }`}>
                {280 - commentary.length}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

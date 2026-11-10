'use client'

import { useState, useRef, useEffect } from "react"
import { 
  X, 
  Image as ImageIcon, 
  AtSign, 
  Smile, 
  Code2,
  Loader2, 
  CheckCircle2, 
  AlertCircle 
} from "lucide-react"
import { CodeSnippetModal, CodeSnippetData } from "@/components/dashboard/code-snippet-modal"
import { LANGUAGE_LABELS } from "@/components/ui/carbon-code-block"
import { createClient } from "@/lib/supabase/client"
import { updateUserStreakAndBadge } from "@/lib/utils/streak"
import { getUserHandle } from "@/lib/utils/user"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getBadgeLevel } from "@/lib/utils/streak"

interface PostModalProps {
  user?: any
  profile?: any
}

interface MentionUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  consistency_score?: number | null
  college?: string | null
}

const EMOJI_CATEGORIES = [
  {
    name: "Popular",
    emojis: ["💡", "🚀", "🎯", "🔥", "💻", "✨", "🧠", "📚", "🏆", "🙌", "😊", "😂", "🎉", "❤️", "💯"]
  },
  {
    name: "Learning & Code",
    emojis: ["⚡", "📝", "☕", "📈", "🛠️", "🧑‍💻", "🧪", "🦾", "🌟", "🤝", "👀", "🔮", "🎨", "🌐", "🔔"]
  }
]

interface PostModalDialogProps {
  user?: any
  profile?: any
  onClose: () => void
}

function PostModalDialog({ user, profile, onClose }: PostModalDialogProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  // Mention Autocomplete States
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [mentionIndex, setMentionIndex] = useState<number>(-1)
  const [mentionResults, setMentionResults] = useState<MentionUser[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [trackedMentions, setTrackedMentions] = useState<Array<{ id: string; handle: string; name: string }>>([])

  // Emoji Picker State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  // Code Snippet Modal & Attachment State
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false)
  const [attachedSnippet, setAttachedSnippet] = useState<CodeSnippetData | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
  const mentionDropdownRef = useRef<HTMLDivElement>(null)
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null)
  const imagePreviewRef = useRef<string | null>(null)
  imagePreviewRef.current = imagePreview

  const supabase = createClient()

  // Reset all temporary composer form state and revoke preview URLs
  const resetForm = () => {
    setContent("")
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImageFile(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
    setAttachedSnippet(null)
    setTrackedMentions([])
    setMentionQuery(null)
    setMentionIndex(-1)
    setMentionResults([])
    setShowEmojiPicker(false)
    setIsCodeModalOpen(false)
    setStatusMessage(null)
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current)
    }
  }

  // Gracefully close modal, resetting all temporary composer state
  const handleClose = () => {
    if (isSubmitting) return
    resetForm()
    onClose()
  }

  // Auto-focus on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Close on Escape key (unless code snippet modal is open)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isCodeModalOpen) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isCodeModalOpen, isSubmitting])

  // Cleanup on unmount (revoke object URL and clear debounce timer)
  useEffect(() => {
    return () => {
      if (imagePreviewRef.current) {
        URL.revokeObjectURL(imagePreviewRef.current)
      }
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
    }
  }, [])

  // Close emoji picker and mention dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        emojiPickerRef.current && 
        !emojiPickerRef.current.contains(event.target as Node) &&
        emojiButtonRef.current &&
        !emojiButtonRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false)
      }
      if (mentionDropdownRef.current && !mentionDropdownRef.current.contains(event.target as Node)) {
        setMentionQuery(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Position adjustment to prevent emoji picker dropdown from getting clipped by viewport edges
  useEffect(() => {
    if (!showEmojiPicker) return

    const adjustPosition = () => {
      const el = emojiPickerRef.current
      if (!el) return

      el.style.transform = ''
      const rect = el.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const padding = 12

      // Check horizontal collision (prevent clipping on small mobile screens)
      if (rect.right > viewportWidth - padding) {
        const overflow = rect.right - (viewportWidth - padding)
        el.style.transform = `translateX(-${overflow}px)`
      } else if (rect.left < padding) {
        const underflow = padding - rect.left
        el.style.transform = `translateX(${underflow}px)`
      }

      // Check vertical collision (keep within viewport height)
      const viewportHeight = window.innerHeight
      if (rect.bottom > viewportHeight - padding) {
        const spaceBelow = viewportHeight - rect.top - padding
        if (spaceBelow >= 140) {
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
  }, [showEmojiPicker])

  // Auto-resize textarea to fit content snugly without leaving excessive empty vertical space
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const hasAttachment = Boolean(imagePreview || attachedSnippet)
      const minHeight = hasAttachment ? 36 : 64
      const calculatedHeight = Math.max(textareaRef.current.scrollHeight, minHeight)
      textareaRef.current.style.height = `${calculatedHeight}px`
    }
  }, [content, imagePreview, attachedSnippet])

  // Handle Text change and detect @mention trigger
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setContent(value)

    const cursorPos = e.target.selectionStart
    const textBeforeCursor = value.slice(0, cursorPos)
    const atMatch = textBeforeCursor.match(/@([a-zA-Z0-9_]*)$/)

    if (atMatch) {
      const query = atMatch[1]
      const startIndex = cursorPos - query.length - 1
      setMentionQuery(query)
      setMentionIndex(startIndex)
      searchUsers(query)
    } else {
      setMentionQuery(null)
      setMentionIndex(-1)
      setMentionResults([])
    }
  }

  // Search profiles in Supabase for mention suggestions
  const searchUsers = (query: string) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        let queryBuilder = supabase
          .from('profiles')
          .select('id, full_name, avatar_url, consistency_score, college')
          .limit(5)

        if (query.trim().length > 0) {
          queryBuilder = queryBuilder.ilike('full_name', `%${query.trim()}%`)
        } else {
          queryBuilder = queryBuilder.order('consistency_score', { ascending: false })
        }

        const { data, error } = await queryBuilder

        if (!error && data) {
          const filtered = data.filter((p: any) => p.id !== user?.id && p.full_name)
          setMentionResults(filtered)
        }
      } catch (err) {
        console.error("Mention search error:", err)
      } finally {
        setIsSearchingUsers(false)
      }
    }, 180)
  }

  // Select mention user and insert into content
  const handleSelectMention = (selectedUser: MentionUser) => {
    if (mentionIndex === -1 || !selectedUser.full_name) return

    const handle = selectedUser.full_name.replace(/\s+/g, '').toLowerCase()
    const cursorPos = textareaRef.current ? textareaRef.current.selectionStart : content.length
    const before = content.slice(0, mentionIndex)
    const after = content.slice(cursorPos)

    const newContent = `${before}@${handle} ${after}`
    setContent(newContent)

    if (!trackedMentions.some(m => m.id === selectedUser.id)) {
      setTrackedMentions(prev => [...prev, {
        id: selectedUser.id,
        handle,
        name: selectedUser.full_name || 'User'
      }])
    }

    setMentionQuery(null)
    setMentionResults([])

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newCursorPos = before.length + handle.length + 2
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos)
      }
    }, 10)
  }

  // Calculate top offset for @mention autocomplete dropdown so it drops right below current typing line
  const getMentionTopOffset = () => {
    if (mentionIndex <= 0) return 44
    const textBeforeMention = content.slice(0, mentionIndex)
    const lines = textBeforeMention.split('\n').length
    return Math.min(lines * 28 + 14, 180)
  }

  // Insert @ trigger manually
  const handleTriggerMention = () => {
    if (!textareaRef.current) return
    const cursorPos = textareaRef.current.selectionStart
    const before = content.slice(0, cursorPos)
    const after = content.slice(cursorPos)

    const needsSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n')
    const insert = needsSpace ? ' @' : '@'
    const newContent = `${before}${insert}${after}`
    
    setContent(newContent)
    setMentionIndex(before.length + (needsSpace ? 1 : 0))
    setMentionQuery("")
    searchUsers("")
    
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPos = cursorPos + insert.length
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 10)
  }

  // Insert emoji at cursor position
  const handleInsertEmoji = (emoji: string) => {
    if (!textareaRef.current) {
      setContent(prev => prev + emoji)
      return
    }

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const before = content.substring(0, start)
    const after = content.substring(end)
    const newContent = `${before}${emoji}${after}`
    
    setContent(newContent)

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const nextPos = start + emoji.length
        textareaRef.current.setSelectionRange(nextPos, nextPos)
      }
    }, 10)
  }

  // Image Upload handler
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
      
      if (!validTypes.includes(file.type.toLowerCase())) {
        setStatusMessage({ text: "Please select a JPG, PNG, or WEBP image", type: 'error' })
        setTimeout(() => setStatusMessage(null), 3500)
        return
      }

      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({ text: "Image size must be less than 5MB", type: 'error' })
        setTimeout(() => setStatusMessage(null), 3500)
        return
      }

      if (imagePreview) {
        URL.revokeObjectURL(imagePreview)
      }

      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Publish Post
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !imageFile && !attachedSnippet) return

    if (!user) {
      window.location.href = '/login'
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      let imageUrl = null

      // 1. Upload image to Supabase Storage bucket 'post_images'
      if (imageFile) {
        setIsUploadingImage(true)
        const fileExt = imageFile.name.split('.').pop() || 'png'
        const fileName = `${user.id}-${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, imageFile, {
            cacheControl: '3600',
            upsert: false
          })

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`)
        }

        const { data: { publicUrl } } = supabase.storage
          .from('post_images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
        setIsUploadingImage(false)
      }

      // 2. Prepare post content and append code snippet if attached
      let finalContent = content.trim()
      if (attachedSnippet) {
        const header = `${attachedSnippet.language}:${attachedSnippet.theme}${attachedSnippet.title ? `:${attachedSnippet.title}` : ''}`
        const snippetBlock = `\`\`\`${header}\n${attachedSnippet.code}\n\`\`\``
        finalContent = finalContent ? `${finalContent}\n\n${snippetBlock}` : snippetBlock
      }

      // 3. Auto-extract hashtags from content
      const tagRegex = /#[\w-]+/g
      const extractedTags: string[] = finalContent.match(tagRegex) || []

      // 4. Insert post into Supabase posts table
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: finalContent,
          type: null,
          image_url: imageUrl,
          tags: extractedTags,
          time_spent: null
        })
        .select(`
          *,
          profiles:user_id (id, full_name, avatar_url, bio, college, consistency_score, streak)
        `)
        .single()

      if (postError) throw postError

      // 4. Send Notifications for Mentioned Users
      const mentionedUserIds = new Set<string>()
      trackedMentions.forEach(m => {
        if (content.toLowerCase().includes(`@${m.handle.toLowerCase()}`)) {
          mentionedUserIds.add(m.id)
        }
      })

      if (mentionedUserIds.size > 0 && newPost) {
        const notifPayloads = Array.from(mentionedUserIds).map(targetId => ({
          user_id: targetId,
          actor_id: user.id,
          type: 'mention',
          post_id: newPost.id,
          is_read: false
        }))

        try {
          await supabase.from('notifications').insert(notifPayloads)
        } catch (notifErr) {
          console.warn("Could not insert mention notifications:", notifErr)
        }
      }

      // 5. Update user streak and consistency score
      const streakResult = await updateUserStreakAndBadge(supabase, user.id)

      // 6. Dispatch post-created event so feed updates immediately without page refresh
      window.dispatchEvent(new CustomEvent('post-created', { detail: newPost }))

      // 7. Dispatch profile-updated event for sidebar streak count
      if (streakResult?.streak !== undefined) {
        window.dispatchEvent(new CustomEvent('profile-updated', {
          detail: {
            consistency_score: streakResult.streak,
            last_post_date: new Date().toISOString().split('T')[0]
          }
        }))
      }

      // Reset form and close modal
      resetForm()
      onClose()
    } catch (err: any) {
      console.error("Posting error:", err)
      setStatusMessage({ text: err.message || "Failed to post progress", type: 'error' })
      setTimeout(() => setStatusMessage(null), 4000)
    } finally {
      setIsSubmitting(false)
      setIsUploadingImage(false)
    }
  }

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Samir'

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs z-[9999] flex items-start sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isCodeModalOpen) handleClose()
        }}
      >
        <div 
          className="bg-white dark:bg-[#000000] sm:rounded-2xl border border-transparent sm:border-[#eff3f4] dark:sm:border-[#2f3336] shadow-2xl w-full max-w-[600px] flex flex-col overflow-visible max-h-screen sm:max-h-[90vh] animate-in zoom-in-95 duration-200 relative"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Header Row: Close button */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 border-b border-[#eff3f4] dark:border-[#2f3336] sm:rounded-t-2xl">
            <button
              type="button"
              onClick={handleClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#0f1419] dark:text-[#e7e9ea] hover:bg-black/[0.06] dark:hover:bg-white/[0.1] transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`px-4 py-2 text-xs font-semibold flex items-center gap-2 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' 
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
            }`}>
              {statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Main Content Area: Avatar + Text Input */}
          <div className="flex-1 overflow-y-auto p-4 flex items-start gap-3 relative min-h-[70px]">
            <img
              src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Samir')}&background=7C3AED&color=fff&size=80`}
              alt="You"
              width={40}
              height={40}
              className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
            />

            <div className="flex-1 min-w-0 relative">
              <textarea
                ref={textareaRef}
                rows={(imagePreview || attachedSnippet) ? 1 : 2}
                value={content}
                onChange={handleTextChange}
                placeholder={`What's on your mind, ${firstName}?`}
                className={`w-full text-[18px] font-normal text-[#0f1419] dark:text-[#e7e9ea] placeholder:font-normal placeholder:text-[#536471] dark:placeholder:text-[#71767b] bg-transparent outline-none border-none resize-none leading-snug overflow-hidden transition-[height] duration-75 ${
                  (imagePreview || attachedSnippet) ? 'min-h-[36px]' : 'min-h-[64px]'
                }`}
              />

              {/* User @Mention Autocomplete Dropdown Popover */}
              {mentionQuery !== null && (
                <div 
                  ref={mentionDropdownRef}
                  style={{ top: `${getMentionTopOffset()}px` }}
                  className="absolute left-0 w-80 max-h-60 overflow-y-auto no-scrollbar bg-white dark:bg-[#1A1A24] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2D2B3B] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Mention someone
                  </div>
                  {isSearchingUsers ? (
                    <div className="px-3 py-3 text-xs text-gray-400 flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-violet-500" />
                      <span>Searching students...</span>
                    </div>
                  ) : mentionResults.length === 0 ? (
                    <div className="px-3 py-3 text-xs text-gray-400">
                      No students found matching "@{mentionQuery}"
                    </div>
                  ) : (
                    mentionResults.map((u) => {
                      const handle = getUserHandle(u.full_name)
                      const badgeLevel = getBadgeLevel(u.consistency_score, u.full_name)
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectMention(u)}
                          className="w-full px-3 py-2 text-left hover:bg-violet-50/70 dark:hover:bg-violet-950/30 flex items-center gap-2.5 transition-colors cursor-pointer group"
                        >
                          <img
                            src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'User')}&background=7C3AED&color=fff&size=60`}
                            alt=""
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-[13px] font-bold text-gray-900 dark:text-white flex items-center gap-1 truncate group-hover:text-violet-600 transition-colors">
                              <span className="truncate">{u.full_name}</span>
                              <VerifiedBadge level={badgeLevel} nameOrHandle={u.full_name} />
                            </div>
                            <div className="text-[11px] text-gray-400 truncate">
                              {handle}
                            </div>
                          </div>
                        </button>
                      )
                    })
                  )}
                </div>
              )}

              {/* Image Preview with remove button */}
              {imagePreview && (
                <div className="relative mt-2 rounded-2xl overflow-hidden border border-[#eff3f4] dark:border-[#2f3336] bg-black/[0.02] dark:bg-white/[0.02] max-h-60 w-fit max-w-full inline-block">
                  <img
                    src={imagePreview}
                    alt="Upload preview"
                    className="max-h-60 w-auto max-w-full rounded-2xl object-contain block"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-black/75 hover:bg-black text-white flex items-center justify-center shadow-md transition-all cursor-pointer"
                    title="Remove image"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Attached Code Snippet Card */}
              {attachedSnippet && (
                <div className="mt-2.5 mb-1.5 rounded-2xl border border-violet-200/80 dark:border-violet-900/60 bg-gradient-to-r from-violet-50/80 via-purple-50/40 to-indigo-50/60 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/20 p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-violet-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[13px] text-gray-900 dark:text-gray-100 truncate">
                          {attachedSnippet.title || `${LANGUAGE_LABELS[attachedSnippet.language] || attachedSnippet.language.toUpperCase()} Snippet`}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-violet-100 dark:bg-violet-900/60 text-violet-700 dark:text-violet-300 uppercase">
                          {LANGUAGE_LABELS[attachedSnippet.language] || attachedSnippet.language}
                        </span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                          {attachedSnippet.code.split('\n').length} {attachedSnippet.code.split('\n').length === 1 ? 'line' : 'lines'}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 font-mono truncate max-w-md mt-0.5">
                        {attachedSnippet.code.split('\n')[0] || '// Empty snippet'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setIsCodeModalOpen(true)}
                      className="px-2.5 py-1 text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/60 rounded-lg transition-colors cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setAttachedSnippet(null)}
                      className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors cursor-pointer"
                      title="Remove snippet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Toolbar: Attachments + Post Button */}
          <div className="px-4 py-3 border-t border-[#eff3f4] dark:border-[#2f3336] flex items-center justify-between bg-white dark:bg-[#000000] sm:rounded-b-2xl">
            {/* Action Icons */}
            <div className="flex items-center gap-1 text-[#7C3AED] relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleImageChange}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                title="Add image"
              >
                <ImageIcon className="w-[19px] h-[19px]" />
              </button>

              <button
                type="button"
                onClick={handleTriggerMention}
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
                title="Mention a student"
              >
                <AtSign className="w-[19px] h-[19px]" />
              </button>

              {/* Emoji Picker Button & Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer ${
                    showEmojiPicker ? 'bg-violet-100 dark:bg-violet-950/60' : ''
                  }`}
                  title="Add emoji"
                >
                  <Smile className="w-[19px] h-[19px]" />
                </button>

                {/* Emoji Popover */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute left-0 top-full mt-2 max-w-[calc(100vw-24px)] bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl shadow-2xl p-3 w-64 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#2D2B3B]">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Quick Emojis</span>
                      <button
                        type="button"
                        onClick={() => setShowEmojiPicker(false)}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <div className="space-y-2.5 max-h-48 overflow-y-auto no-scrollbar">
                      {EMOJI_CATEGORIES.map((cat) => (
                        <div key={cat.name}>
                          <p className="text-[10px] font-semibold text-gray-400 mb-1">{cat.name}</p>
                          <div className="grid grid-cols-5 gap-1.5">
                            {cat.emojis.map((emoji) => (
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
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Code Snippet Button (immediately beside Emoji button) */}
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                className={`w-9 h-9 rounded-full flex items-center justify-center hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer ${
                  attachedSnippet ? 'bg-violet-100 dark:bg-violet-950/60 ring-1 ring-violet-300 dark:ring-violet-700' : ''
                }`}
                title="Add code snippet"
              >
                <Code2 className="w-[19px] h-[19px]" />
              </button>
            </div>

            {/* Right: Submit Button */}
            <div className="flex items-center gap-3">
              {content.length > 0 && (
                <span className={`text-[12px] font-medium ${
                  content.length > 280 ? 'text-rose-500' : 'text-[#536471] dark:text-[#71767b]'
                }`}>
                  {280 - content.length}
                </span>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !imageFile && !attachedSnippet)}
                className="px-5 py-2 rounded-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold text-[15px] disabled:opacity-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5 shadow-none"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <span>Post</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

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

export function PostModal({ user, profile }: PostModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [modalKey, setModalKey] = useState(0)

  // Listen for open-post-modal custom event from sidebar Post button
  useEffect(() => {
    const handleOpen = () => {
      setModalKey(prev => prev + 1)
      setIsOpen(true)
    }

    window.addEventListener('open-post-modal', handleOpen)
    return () => window.removeEventListener('open-post-modal', handleOpen)
  }, [])

  if (!isOpen) return null

  return (
    <PostModalDialog
      key={modalKey}
      user={user}
      profile={profile}
      onClose={() => setIsOpen(false)}
    />
  )
}

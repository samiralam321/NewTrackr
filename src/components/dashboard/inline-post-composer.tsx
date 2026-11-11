'use client'

import { useState, useRef, useEffect } from "react"
import { 
  Image as ImageIcon, 
  AtSign, 
  Smile, 
  Code2,
  X, 
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

interface InlinePostComposerProps {
  user?: any
  profile?: any
}

interface MentionUser {
  id: string
  full_name: string | null
  username?: string | null
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

export function InlinePostComposer({ user, profile }: InlinePostComposerProps) {
  const [content, setContent] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isFocused, setIsFocused] = useState(false)

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
  const supabase = createClient()

  // Close emoji picker on outside click
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

  // Listen for sidebar Post button trigger to focus composer
  useEffect(() => {
    const handleFocusTrigger = () => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        textareaRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
        setIsFocused(true)
      }
    }
    window.addEventListener('focus-post-composer', handleFocusTrigger)
    return () => window.removeEventListener('focus-post-composer', handleFocusTrigger)
  }, [])

  // Auto-resize textarea to fit content snugly without excessive vertical gap
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      const hasAttachment = Boolean(imagePreview || attachedSnippet)
      const minH = hasAttachment ? 36 : (isFocused ? 64 : 48)
      const calculatedHeight = Math.max(textareaRef.current.scrollHeight, minH)
      textareaRef.current.style.height = `${calculatedHeight}px`
    }
  }, [content, imagePreview, attachedSnippet, isFocused])

  // Debounced search for registered users when @ is typed
  useEffect(() => {
    if (mentionQuery === null) {
      setMentionResults([])
      return
    }

    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)

    searchDebounceRef.current = setTimeout(async () => {
      setIsSearchingUsers(true)
      try {
        let query = supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, consistency_score, college')
          .limit(8)

        const cleanQ = mentionQuery.trim().replace(/^@/, '')
        if (cleanQ.length > 0) {
          query = query.or(`username.ilike.%${cleanQ}%,full_name.ilike.%${cleanQ}%`)
        } else {
          query = query.order('consistency_score', { ascending: false })
        }

        if (user?.id) {
          query = query.neq('id', user.id)
        }

        const { data, error } = await query
        if (!error && data) {
          const filtered = data.filter((p: any) => p.full_name || p.username)
          setMentionResults(filtered)
        }
      } catch (err) {
        console.warn("Error searching users for mention:", err)
      } finally {
        setIsSearchingUsers(false)
      }
    }, 100)

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current)
    }
  }, [mentionQuery, user?.id])

  // Handle textarea text change & detect @mention trigger
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value
    setContent(val)

    const cursorPos = e.target.selectionStart
    const textBefore = val.slice(0, cursorPos)
    
    // Check if cursor is right after an '@' or typing a username after '@'
    const mentionMatch = textBefore.match(/@([a-zA-Z0-9_]*)$/)
    if (mentionMatch) {
      setMentionIndex(mentionMatch.index!)
      setMentionQuery(mentionMatch[1])
    } else {
      setMentionQuery(null)
    }
  }

  // Insert selected user mention using their exact username
  const handleSelectMention = (targetUser: MentionUser) => {
    if (!textareaRef.current) return
    const rawHandle = targetUser.username
      ? targetUser.username.replace(/^@/, '')
      : getUserHandle(targetUser).replace(/^@/, '')
    const mentionText = `@${rawHandle} `

    const textBefore = content.slice(0, mentionIndex)
    const textAfter = content.slice(textareaRef.current.selectionStart)
    const newContent = `${textBefore}${mentionText}${textAfter}`
    
    setContent(newContent)
    setTrackedMentions(prev => [
      ...prev.filter(m => m.id !== targetUser.id),
      { id: targetUser.id, handle: rawHandle, name: targetUser.full_name || targetUser.username || 'User' }
    ])
    setMentionQuery(null)

    // Restore focus and position cursor after inserted mention
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus()
        const newPos = textBefore.length + mentionText.length
        textareaRef.current.setSelectionRange(newPos, newPos)
      }
    }, 10)
  }

  // Trigger @ from the Tag People button
  const triggerMentionButton = () => {
    if (!textareaRef.current) return
    const cursorPos = textareaRef.current.selectionStart || content.length
    const before = content.slice(0, cursorPos)
    const after = content.slice(cursorPos)
    
    // Add space before @ if needed
    const needsSpace = before.length > 0 && !before.endsWith(' ') && !before.endsWith('\n')
    const insert = needsSpace ? ' @' : '@'
    const newContent = `${before}${insert}${after}`
    
    setContent(newContent)
    setMentionIndex(before.length + (needsSpace ? 1 : 0))
    setMentionQuery("")
    
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

  // Process image from file input, clipboard paste, or drag-and-drop
  const processImageFile = (file: File, source: 'upload' | 'paste' | 'drop' = 'upload') => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif']
    
    if (!validTypes.includes(file.type.toLowerCase())) {
      setStatusMessage({ text: "Please select or paste a JPG, PNG, WEBP, or GIF image", type: 'error' })
      setTimeout(() => setStatusMessage(null), 3500)
      return false
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ text: "Image size must be less than 5MB", type: 'error' })
      setTimeout(() => setStatusMessage(null), 3500)
      return false
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    const ext = file.type.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
    const fileName = file.name && file.name !== 'image.png' && file.name !== 'blob'
      ? file.name
      : `pasted-${Date.now()}.${ext}`
    const namedFile = new File([file], fileName, { type: file.type })

    setImageFile(namedFile)
    setImagePreview(URL.createObjectURL(namedFile))
    
    if (source === 'paste') {
      setStatusMessage({ text: "Image pasted from clipboard! 📋✨", type: 'success' })
      setTimeout(() => setStatusMessage(null), 3000)
    } else if (source === 'drop') {
      setStatusMessage({ text: "Image attached! 🖼️✨", type: 'success' })
      setTimeout(() => setStatusMessage(null), 3000)
    }

    return true
  }

  // Image Upload handler with format validation (JPG, JPEG, PNG, WEBP) & max 5MB size
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0], 'upload')
    }
  }

  // Paste image directly from clipboard (e.g. Snipping Tool, screenshot, copied image)
  const handlePaste = (e: React.ClipboardEvent) => {
    // 1. Check e.clipboardData.files first
    if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
      for (let i = 0; i < e.clipboardData.files.length; i++) {
        const file = e.clipboardData.files[i]
        if (file && file.type.startsWith('image/')) {
          e.preventDefault()
          processImageFile(file, 'paste')
          return
        }
      }
    }

    // 2. Check e.clipboardData.items
    const items = e.clipboardData?.items
    if (items) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            e.preventDefault()
            processImageFile(file, 'paste')
            return
          }
        }
      }
    }
  }

  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files[i]
        if (file && file.type.startsWith('image/')) {
          processImageFile(file, 'drop')
          return
        }
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
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

      // 4. Send Notifications for Mentioned Users (without duplicates)
      const mentionedUserIds = new Set<string>()
      
      // Match from tracked mentions
      trackedMentions.forEach(m => {
        if (content.toLowerCase().includes(`@${m.handle.toLowerCase()}`)) {
          mentionedUserIds.add(m.id)
        }
      })

      // Also match manually typed @username mentions
      const typedMatches = Array.from(content.matchAll(/@([a-zA-Z0-9_]+)/g)).map(m => m[1].toLowerCase())
      if (typedMatches.length > 0) {
        try {
          const { data: matchedProfiles } = await supabase
            .from('profiles')
            .select('id, username')
            .in('username', typedMatches)
          if (matchedProfiles) {
            matchedProfiles.forEach((p: any) => {
              if (p.id !== user.id) mentionedUserIds.add(p.id)
            })
          }
        } catch (e) {
          console.warn("Typed mention notification resolution failed:", e)
        }
      }

      // Send mention notifications in background
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

      // Reset form
      setContent("")
      removeImage()
      setAttachedSnippet(null)
      setTrackedMentions([])
      setIsFocused(false)
      setShowEmojiPicker(false)
      setMentionQuery(null)
      setStatusMessage({ text: "Progress posted! Streak updated 🔥", type: 'success' })
      setTimeout(() => setStatusMessage(null), 3500)
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
    <div 
      onPaste={handlePaste}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`px-4 py-3.5 border-b border-[#eff3f4] dark:border-[#2f3336] bg-white dark:bg-[#000000] relative transition-colors ${
        isDragging ? 'ring-2 ring-violet-500 bg-violet-50/20 dark:bg-violet-950/20' : ''
      }`}
    >
      {/* Main Composer Row: Avatar + Text Input */}
      <div className="flex items-start gap-3">
        <img
          src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Samir')}&background=7C3AED&color=fff&size=80`}
          alt="You"
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          className="w-10 h-10 rounded-full object-cover shrink-0 mt-0.5"
        />

        <div className="flex-1 min-w-0 relative">
          <textarea
            ref={textareaRef}
            rows={(imagePreview || attachedSnippet) ? 1 : (isFocused || content.length > 50 ? 3 : 2)}
            value={content}
            onChange={handleTextChange}
            onPaste={handlePaste}
            onFocus={() => setIsFocused(true)}
            placeholder={`What's on your mind, ${firstName}?`}
            className={`w-full text-[18px] font-normal text-[#0f1419] dark:text-[#e7e9ea] placeholder:font-normal placeholder:text-[#536471] dark:placeholder:text-[#71767b] bg-transparent outline-none border-none resize-none leading-snug overflow-hidden transition-[height] duration-75 ${
              (imagePreview || attachedSnippet) ? 'min-h-[36px]' : 'min-h-[48px]'
            }`}
          />

          {/* User @Mention Autocomplete Dropdown Popover */}
          {mentionQuery !== null && (
            <div 
              ref={mentionDropdownRef}
              className="absolute left-0 top-full mt-1 w-72 max-h-56 overflow-y-auto no-scrollbar bg-white dark:bg-[#1A1A24] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2D2B3B] p-1.5 z-[100] animate-in fade-in zoom-in-95 duration-150"
            >
              <div className="px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                <span>Mention student</span>
                {isSearchingUsers && <Loader2 className="w-3 h-3 animate-spin text-violet-500" />}
              </div>

              {mentionResults.length > 0 ? (
                mentionResults.map((u) => {
                  const handle = u.username 
                    ? `@${u.username.replace(/^@/, '')}` 
                    : getUserHandle(u)
                  const badgeLevel = getBadgeLevel(u.consistency_score, u.full_name)
                  return (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => handleSelectMention(u)}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors group"
                    >
                      <img
                        src={u.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.full_name || 'Student')}&background=7C3AED&color=fff`}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-700"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate group-hover:text-violet-600 dark:group-hover:text-violet-400">
                            {u.full_name}
                          </span>
                          <VerifiedBadge level={badgeLevel} nameOrHandle={u.full_name} size="sm" />
                        </div>
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                          {handle}
                        </p>
                      </div>
                      {(u.consistency_score || 0) > 0 && (
                        <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-950/30 px-1.5 py-0.5 rounded-full shrink-0">
                          🔥{u.consistency_score}
                        </span>
                      )}
                    </button>
                  )
                })
              ) : !isSearchingUsers ? (
                <div className="px-3 py-3 text-center text-xs text-gray-400 dark:text-gray-500">
                  No matching student found
                </div>
              ) : null}
            </div>
          )}

          {/* Image Thumbnail Preview */}
          {imagePreview && (
            <div className="relative mt-2 mb-3 inline-block rounded-2xl overflow-hidden border border-[#eff3f4] dark:border-[#2f3336] bg-black/[0.02] dark:bg-white/[0.02] max-h-60 w-fit max-w-full">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-60 w-auto max-w-full rounded-2xl object-contain block"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors active:scale-95 shadow-md cursor-pointer"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Attached Code Snippet Card */}
          {attachedSnippet && (
            <div className="mt-2.5 mb-2 rounded-2xl border border-violet-200/80 dark:border-violet-900/60 bg-gradient-to-r from-violet-50/80 via-purple-50/40 to-indigo-50/60 dark:from-violet-950/30 dark:via-purple-950/20 dark:to-indigo-950/20 p-2.5 sm:p-3 flex items-center justify-between gap-3 shadow-xs">
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

          {/* Hidden File Input for JPG, PNG, WEBP */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/jpg"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Bottom Action Bar: Image, Tag People, Emoji, Code Snippet */}
          <div className="flex items-center justify-between pt-2.5 border-t border-[#eff3f4] dark:border-[#2f3336] mt-2 relative">
            {/* Quick Action Icons: Image Upload, Tag People (@Mention), Emoji Picker, Code Snippet */}
            <div className="flex items-center gap-0.5">
              {/* 1. Image Upload Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Upload image (JPG, PNG, WEBP)"
                className={`p-2 rounded-full text-[#7C3AED] hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer ${imageFile ? 'bg-violet-100 dark:bg-violet-950/60' : ''}`}
              >
                <ImageIcon className="w-[19px] h-[19px]" />
              </button>

              {/* 2. Tag People (@Mention) Button */}
              <button
                type="button"
                onClick={triggerMentionButton}
                title="Tag people (@mention)"
                className="p-2 rounded-full text-[#7C3AED] hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer"
              >
                <AtSign className="w-[19px] h-[19px]" />
              </button>

              {/* 3. Emoji Picker Button */}
              <div className="relative">
                <button
                  type="button"
                  ref={emojiButtonRef}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  title="Add emoji"
                  className={`p-2 rounded-full text-[#7C3AED] hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer ${showEmojiPicker ? 'bg-violet-100 dark:bg-violet-950/60' : ''}`}
                >
                  <Smile className="w-[19px] h-[19px]" />
                </button>

                {/* Emoji Picker Popover */}
                {showEmojiPicker && (
                  <div
                    ref={emojiPickerRef}
                    className="absolute left-0 top-full mt-2 max-w-[calc(100vw-24px)] bg-white dark:bg-[#1A1A24] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#2D2B3B] p-3 w-64 z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    <div className="space-y-2.5">
                      {EMOJI_CATEGORIES.map((category) => (
                        <div key={category.name}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1.5 px-0.5">
                            {category.name}
                          </p>
                          <div className="grid grid-cols-5 gap-1">
                            {category.emojis.map((emoji) => (
                              <button
                                key={emoji}
                                type="button"
                                onClick={() => handleInsertEmoji(emoji)}
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-[#252330] active:scale-90 transition-transform cursor-pointer"
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

              {/* 4. Code Snippet Button (immediately beside Emoji button) */}
              <button
                type="button"
                onClick={() => setIsCodeModalOpen(true)}
                title="Add code snippet"
                className={`p-2 rounded-full text-[#7C3AED] hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors cursor-pointer ${
                  attachedSnippet ? 'bg-violet-100 dark:bg-violet-950/60 ring-1 ring-violet-300 dark:ring-violet-700' : ''
                }`}
              >
                <Code2 className="w-[19px] h-[19px]" />
              </button>
            </div>

            {/* Right side: Status message, Uploading indicator & Post Button */}
            <div className="flex items-center gap-3">
              {isUploadingImage && (
                <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1 animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Uploading image...
                </span>
              )}

              {statusMessage && !isUploadingImage && (
                <span
                  className={`text-xs font-semibold flex items-center gap-1 ${
                    statusMessage.type === 'success' ? 'text-emerald-500' : 'text-red-500'
                  }`}
                >
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5" />
                  )}
                  {statusMessage.text}
                </span>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || (!content.trim() && !imageFile && !attachedSnippet)}
                className={`px-5 py-2 rounded-full text-[14px] font-bold transition-all duration-150 flex items-center gap-1.5 select-none ${
                  content.trim() || imageFile || attachedSnippet
                    ? 'bg-[#7C3AED] hover:bg-violet-700 active:scale-95 text-white shadow-none cursor-pointer'
                    : 'bg-[#7C3AED]/40 dark:bg-[#7C3AED]/30 text-white/60 dark:text-white/40 cursor-not-allowed shadow-none'
                }`}
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
    </div>
  )
}

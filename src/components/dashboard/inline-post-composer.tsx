'use client'

import { useState, useRef } from "react"
import { 
  Image as ImageIcon, 
  Link2, 
  Code, 
  X, 
  Loader2, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { updateUserStreakAndBadge } from "@/lib/utils/streak"

interface InlinePostComposerProps {
  user?: any
  profile?: any
}

export function InlinePostComposer({ user, profile }: InlinePostComposerProps) {
  const [content, setContent] = useState("")
  const [progressType, setProgressType] = useState<'Learned' | 'Built' | 'Practiced' | 'Other'>('Learned')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [linkInputOpen, setLinkInputOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("")
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const supabase = createClient()

  const categories = [
    { type: 'Learned', label: 'Learned', icon: '💡' },
    { type: 'Built', label: 'Built', icon: '🚀' },
    { type: 'Practiced', label: 'Practiced', icon: '🎯' },
    { type: 'Other', label: 'Other', icon: '📝' },
  ] as const

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.size > 5 * 1024 * 1024) {
        setStatusMessage({ text: "Image size must be less than 5MB", type: 'error' })
        setTimeout(() => setStatusMessage(null), 3000)
        return
      }
      setImageFile(file)
      setImagePreview(URL.createObjectURL(file))
    }
  }

  const removeImage = () => {
    setImageFile(null)
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const insertLink = () => {
    if (!linkUrl.trim()) {
      setLinkInputOpen(false)
      return
    }
    const formatted = linkUrl.startsWith('http') ? linkUrl : `https://${linkUrl}`
    setContent(prev => (prev ? `${prev} ${formatted}` : formatted))
    setLinkUrl("")
    setLinkInputOpen(false)
    textareaRef.current?.focus()
  }

  const insertCodeBlock = () => {
    setContent(prev => `${prev}\n\`\`\`javascript\n// your code here\n\`\`\`\n`)
    textareaRef.current?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() && !imageFile) return

    if (!user) {
      window.location.href = '/login'
      return
    }

    setIsSubmitting(true)
    setStatusMessage(null)

    try {
      let imageUrl = null

      // Upload image to Supabase Storage if selected
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop()
        const fileName = `${user.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('post_images')
          .upload(fileName, imageFile)

        if (uploadError) {
          console.warn("Storage upload warning:", uploadError)
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('post_images')
            .getPublicUrl(fileName)
          imageUrl = publicUrl
        }
      }

      // Auto-extract hashtags from content
      const tagRegex = /#[\w-]+/g
      const extractedTags: string[] = content.match(tagRegex) || []
      // Add default category tag if not present
      if (!extractedTags.some(t => t.toLowerCase() === `#${progressType.toLowerCase()}`)) {
        extractedTags.push(`#${progressType}`)
      }

      // Insert post into Supabase
      const { data: newPost, error: postError } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content: content.trim(),
          type: progressType,
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

      // Update user streak and consistency score
      const streakResult = await updateUserStreakAndBadge(supabase, user.id)

      // Dispatch post-created event so feed updates immediately without page refresh
      window.dispatchEvent(new CustomEvent('post-created', { detail: newPost }))

      // Dispatch profile-updated event for sidebar streak count
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
      setIsFocused(false)
      setStatusMessage({ text: "Progress posted! Streak updated 🔥", type: 'success' })
      setTimeout(() => setStatusMessage(null), 3500)
    } catch (err: any) {
      console.error("Posting error:", err)
      setStatusMessage({ text: err.message || "Failed to post progress", type: 'error' })
      setTimeout(() => setStatusMessage(null), 4000)
    } finally {
      setIsSubmitting(false)
    }
  }

  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : 'Samir'

  return (
    <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-sm hover:shadow-md transition-all duration-300 mb-6">
      {/* Category Selection Bar (Shown when focused or typing) */}
      {(isFocused || content.trim().length > 0) && (
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-100 dark:border-[#1F1E2A] overflow-x-auto no-scrollbar">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 mr-1 shrink-0">
            Category:
          </span>
          {categories.map((cat) => (
            <button
              key={cat.type}
              type="button"
              onClick={() => setProgressType(cat.type)}
              className={`px-3 py-1 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 ${
                progressType === cat.type
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-950/60 dark:text-violet-300 border border-violet-300 dark:border-violet-700 shadow-sm'
                  : 'bg-gray-50 text-gray-600 dark:bg-[#1A1A24] dark:text-gray-400 border border-gray-200/50 dark:border-[#2D2B3B] hover:bg-gray-100 dark:hover:bg-[#252330]'
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Composer Row: Avatar + Text Input */}
      <div className="flex items-start gap-3">
        <img
          src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.full_name || 'Samir')}&background=7C3AED&color=fff&size=80`}
          alt="You"
          width={40}
          height={40}
          loading="lazy"
          decoding="async"
          className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-800 mt-1"
        />

        <div className="flex-1 min-w-0">
          <textarea
            ref={textareaRef}
            rows={isFocused || content.length > 50 ? 3 : 2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setIsFocused(true)}
            placeholder={`What's on your mind, ${firstName}?`}
            className="w-full text-[14.5px] bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none resize-none leading-relaxed"
          />

          {/* Link URL Inline Popover */}
          {linkInputOpen && (
            <div className="flex items-center gap-2 mt-2 mb-3 p-2 bg-gray-50 dark:bg-[#1A1A24] rounded-xl border border-gray-200 dark:border-[#2D2B3B]">
              <Link2 className="w-4 h-4 text-violet-500 shrink-0" />
              <input
                type="url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), insertLink())}
                placeholder="Paste link URL (e.g. https://github.com/...)"
                className="flex-1 bg-transparent text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
                autoFocus
              />
              <button
                type="button"
                onClick={insertLink}
                className="px-2.5 py-1 text-xs font-semibold bg-violet-600 text-white rounded-lg hover:bg-violet-700"
              >
                Add
              </button>
              <button
                type="button"
                onClick={() => setLinkInputOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Image Thumbnail Preview */}
          {imagePreview && (
            <div className="relative mt-2 mb-3 inline-block rounded-xl overflow-hidden border border-gray-200 dark:border-[#2D2B3B]">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-48 rounded-xl object-cover"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1 rounded-full transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />

          {/* Bottom Action Bar */}
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-[#1F1E2A] mt-2">
            {/* Quick Action Icons: Image, Link, Code */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Attach photo/image"
                className="p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-[#1A1A24] transition-colors"
              >
                <ImageIcon className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setLinkInputOpen(!linkInputOpen)}
                title="Insert link"
                className="p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-[#1A1A24] transition-colors"
              >
                <Link2 className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={insertCodeBlock}
                title="Insert code snippet"
                className="p-2 rounded-lg text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:text-gray-400 dark:hover:text-violet-400 dark:hover:bg-[#1A1A24] transition-colors"
              >
                <Code className="w-4 h-4" />
              </button>
            </div>

            {/* Right side: Status message & Post Button */}
            <div className="flex items-center gap-3">
              {statusMessage && (
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
                disabled={isSubmitting || (!content.trim() && !imageFile)}
                className={`px-5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 select-none ${
                  content.trim() || imageFile
                    ? 'bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20 active:scale-95 cursor-pointer'
                    : 'bg-violet-300 dark:bg-violet-950/60 text-white/70 dark:text-violet-400/40 cursor-not-allowed'
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
    </div>
  )
}

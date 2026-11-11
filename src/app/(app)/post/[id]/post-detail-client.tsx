'use client'

import React, { useState, useRef } from 'react'
import { Post, Comment } from '@/lib/supabase/types'
import { ArrowLeft, MessageCircle, Bookmark, Share2, Send, Loader2, Pin } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { VerifiedBadge } from '@/components/ui/verified-badge'
import { getBadgeLevel } from '@/lib/utils/streak'
import { getUserHandle } from '@/lib/utils/user'
import { formatTimeCompact, formatFullDateTime } from '@/lib/utils/date'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'
import { LikeButton } from '@/components/ui/like-button'
import { RepostButton } from '@/components/ui/repost-button'
import { ActionTooltip } from '@/components/ui/action-tooltip'
import { EmbeddedQuoteCard } from '@/components/dashboard/embedded-quote-card'
import { QuoteModal } from '@/components/dashboard/quote-modal'
import { ImagePreviewModal } from '@/components/ui/image-preview-modal'
import { createClient } from '@/lib/supabase/client'

interface PostDetailClientProps {
  initialPost: Post
  currentUserId: string
  currentUserProfile: any
}

export function PostDetailClient({
  initialPost,
  currentUserId,
  currentUserProfile
}: PostDetailClientProps) {
  const router = useRouter()
  const [post, setPost] = useState<Post>(initialPost)
  const [isLiked, setIsLiked] = useState<boolean>(Boolean(initialPost.user_has_liked))
  const [likesCount, setLikesCount] = useState<number>((initialPost as any).likes_count || 0)
  
  // Repost state from localStorage + post
  const [isReposted, setIsReposted] = useState<boolean>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('trackr_user_reposts') || '{}')
      return Boolean(stored[initialPost.id])
    } catch {
      return false
    }
  })
  const [repostsCount, setRepostsCount] = useState<number>((initialPost as any).reposts_count || 0)

  const [isBookmarked, setIsBookmarked] = useState<boolean>(Boolean(initialPost.user_has_bookmarked))
  const [comments, setComments] = useState<Comment[]>((initialPost as any).comments || [])
  const [newComment, setNewComment] = useState("")
  const [isSubmittingComment, setIsSubmittingComment] = useState(false)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  const previewImageUrlRef = useRef<string | null>(null)
  const isLikingInFlightRef = useRef(false)

  const supabase = createClient()

  // Like toggle with in-flight debounce to prevent race conditions
  const handleToggleLike = async () => {
    if (isLikingInFlightRef.current) return
    isLikingInFlightRef.current = true

    const nextLiked = !isLiked
    setIsLiked(nextLiked)
    setLikesCount(prev => Math.max(0, prev + (nextLiked ? 1 : -1)))

    try {
      if (nextLiked) {
        const { error } = await supabase.from('likes').insert({ post_id: post.id, user_id: currentUserId })
        if (error && (error as any).code !== '23505') {
          throw error
        }

        // Send like notification to post author if not self
        if (post.user_id !== currentUserId) {
          try {
            await supabase.from('notifications').insert({
              user_id: post.user_id,
              actor_id: currentUserId,
              type: 'like',
              post_id: post.id,
              is_read: false
            })
          } catch (e) {}
        }
      } else {
        const { error } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
        if (error) throw error

        // Automatically clean up like notification on unlike
        if (post.user_id !== currentUserId) {
          try {
            await supabase
              .from('notifications')
              .delete()
              .eq('user_id', post.user_id)
              .eq('actor_id', currentUserId)
              .eq('type', 'like')
              .eq('post_id', post.id)
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn("Error toggling like:", err)
      // Rollback on genuine error
      setIsLiked(isLiked)
      setLikesCount(prev => Math.max(0, prev + (nextLiked ? -1 : 1)))
    } finally {
      isLikingInFlightRef.current = false
    }
  }

  // Repost toggle
  const handleRepost = async () => {
    if (post.user_id === currentUserId) return

    setIsReposted(true)
    setRepostsCount(prev => prev + 1)
    try {
      const stored = JSON.parse(localStorage.getItem('trackr_user_reposts') || '{}')
      stored[post.id] = true
      localStorage.setItem('trackr_user_reposts', JSON.stringify(stored))
    } catch (e) {}

    try {
      await supabase.from('reposts').insert({ post_id: post.id, user_id: currentUserId })
      const repostPayload: any = {
        user_id: currentUserId,
        content: '',
        tags: [`repost:${post.id}`],
        type: 'Repost',
        repost_of_id: post.id
      }
      const { error: repErr } = await supabase.from('posts').insert(repostPayload)
      if (repErr) {
        delete repostPayload.repost_of_id
        delete repostPayload.type
        await supabase.from('posts').insert(repostPayload)
      }
      if (post.user_id !== currentUserId) {
        try {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: currentUserId,
            type: 'mention',
            post_id: post.id,
            is_read: false
          })
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Error inserting repost:", err)
    }
  }

  const handleUndoRepost = async () => {
    setIsReposted(false)
    setRepostsCount(prev => Math.max(0, prev - 1))
    try {
      const stored = JSON.parse(localStorage.getItem('trackr_user_reposts') || '{}')
      delete stored[post.id]
      localStorage.setItem('trackr_user_reposts', JSON.stringify(stored))
    } catch (e) {}

    try {
      await supabase.from('reposts').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      await supabase.from('posts').delete().eq('user_id', currentUserId).contains('tags', [`repost:${post.id}`])
    } catch (err) {
      console.warn("Error undoing repost:", err)
    }
  }

  // Bookmark toggle
  const handleToggleBookmark = async () => {
    const nextBm = !isBookmarked
    setIsBookmarked(nextBm)
    try {
      if (nextBm) {
        await supabase.from('bookmarks').insert({ post_id: post.id, user_id: currentUserId })
      } else {
        await supabase.from('bookmarks').delete().eq('post_id', post.id).eq('user_id', currentUserId)
      }
    } catch (err) {
      console.warn("Error toggling bookmark:", err)
    }
  }

  // Share post
  const handleShare = async () => {
    const postUrl = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({ title: "Trackr Post", url: postUrl })
      } catch (e) {}
    } else {
      await navigator.clipboard.writeText(postUrl)
      alert("Post link copied to clipboard! 🔗")
    }
  }

  // Add Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || isSubmittingComment) return

    setIsSubmittingComment(true)
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: post.id,
          user_id: currentUserId,
          content: newComment.trim()
        })
        .select(`*, profiles(id, full_name, avatar_url, consistency_score, college)`)
        .single()

      if (error) throw error

      if (data) {
        setComments(prev => [...prev, data as any])
        setNewComment("")
      }
    } catch (err: any) {
      console.error("Error adding comment:", err)
      alert(err.message || "Failed to post reply")
    } finally {
      setIsSubmittingComment(false)
    }
  }

  const authorName = post.profiles?.full_name || 'User'
  const handle = getUserHandle(post.profiles)
  const badgeLevel = getBadgeLevel(post.profiles?.consistency_score, post.profiles?.full_name)
  const avatarUrl = post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=7C3AED&color=fff&size=80`

  return (
    <>
      {/* Top Header */}
      <div className="flex items-center gap-6 px-4 py-3 border-b border-[#eff3f4] dark:border-[#2f3336] sticky top-0 z-30 bg-white/90 dark:bg-black/90 backdrop-blur-md shrink-0">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-black/[0.06] dark:hover:bg-white/[0.1] text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          Post
        </h2>
      </div>

      {/* Main Post Section */}
      <article className="px-4 py-4 border-b border-[#eff3f4] dark:border-[#2f3336]">
        {/* Author Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <Link href={`/profile/${post.user_id}`}>
              <img 
                src={avatarUrl} 
                alt={authorName} 
                className="w-11 h-11 rounded-full object-cover shrink-0 hover:opacity-90 transition-opacity" 
              />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link href={`/profile/${post.user_id}`} className="font-bold text-[16px] text-gray-900 dark:text-white hover:underline truncate">
                  {authorName}
                </Link>
                <VerifiedBadge level={badgeLevel} nameOrHandle={authorName} />
              </div>
              <p className="text-[13px] text-[#536471] dark:text-[#71767b] font-normal truncate">
                {handle}
              </p>
            </div>
          </div>

          {(post.profiles?.consistency_score || 0) > 0 && (
            <span className="text-xs font-bold text-orange-500 flex items-center gap-0.5">
              🔥 {post.profiles?.consistency_score}
            </span>
          )}
        </div>

        {/* Content */}
        <div className="text-[17px] leading-relaxed text-[#0f1419] dark:text-[#e7e9ea] whitespace-pre-wrap font-normal mb-3">
          <RichTextRenderer content={post.content} />
        </div>

        {/* Image Attachment */}
        {post.image_url && (
          <div className="mt-2 mb-3 rounded-2xl overflow-hidden border border-[#eff3f4] dark:border-[#2f3336] max-h-96 w-fit cursor-pointer" onClick={() => setPreviewImageUrl(post.image_url!)}>
            <img src={post.image_url} alt="Attachment" className="max-h-96 w-auto object-contain rounded-2xl block" />
          </div>
        )}

        {/* Embedded Quoted Post */}
        {(post.quoted_post || post.quoted_post_id) && (
          <EmbeddedQuoteCard quotedPost={post.quoted_post} quotedPostId={post.quoted_post_id} onImageClick={setPreviewImageUrl} />
        )}

        {/* Timestamp */}
        <div className="py-3 border-y border-[#eff3f4] dark:border-[#2f3336] text-[14px] text-[#536471] dark:text-[#71767b] font-normal my-2 flex items-center gap-2">
          <span>{formatFullDateTime(post.created_at)}</span>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-around py-1 text-[#536471] dark:text-[#71767b] border-b border-[#eff3f4] dark:border-[#2f3336]">
          <ActionTooltip label="Reply">
            <button 
              type="button" 
              className="flex items-center gap-1.5 p-2 rounded-full hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 transition-colors cursor-pointer"
              onClick={() => document.getElementById('reply-input')?.focus()}
            >
              <MessageCircle className="w-5 h-5" />
              <span className="text-[13px]">{comments.length}</span>
            </button>
          </ActionTooltip>

          <RepostButton
            isReposted={isReposted}
            repostsCount={repostsCount}
            isOwnPost={post.user_id === currentUserId}
            onRepost={handleRepost}
            onUndoRepost={handleUndoRepost}
            onQuote={() => setIsQuoteModalOpen(true)}
          />

          <LikeButton
            isLiked={isLiked}
            likesCount={likesCount}
            onToggle={handleToggleLike}
          />

          <ActionTooltip label={isBookmarked ? 'Saved' : 'Save'}>
            <button 
              type="button" 
              onClick={handleToggleBookmark} 
              className={`flex items-center gap-1.5 p-2 rounded-full hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 transition-colors cursor-pointer ${
                isBookmarked ? 'text-violet-600 dark:text-violet-400' : ''
              }`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
          </ActionTooltip>

          <ActionTooltip label="Share">
            <button 
              type="button" 
              onClick={handleShare} 
              className="p-2 rounded-full hover:bg-violet-50 dark:hover:bg-violet-950/40 hover:text-violet-600 transition-colors cursor-pointer"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </ActionTooltip>
        </div>
      </article>

      {/* Reply Input Box */}
      <form onSubmit={handleAddComment} className="p-4 border-b border-[#eff3f4] dark:border-[#2f3336] flex items-center gap-3">
        <img 
          src={currentUserProfile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUserProfile?.full_name || 'You')}&background=7C3AED&color=fff&size=80`} 
          alt="You" 
          className="w-9 h-9 rounded-full object-cover shrink-0" 
        />
        <input
          id="reply-input"
          type="text"
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Post your reply"
          className="flex-1 text-[15px] bg-transparent outline-none border-none text-[#0f1419] dark:text-[#e7e9ea] placeholder-[#536471] dark:placeholder-[#71767b]"
        />
        <button
          type="submit"
          disabled={!newComment.trim() || isSubmittingComment}
          className="px-4 py-1.5 rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs disabled:opacity-50 active:scale-95 transition-all cursor-pointer flex items-center gap-1.5"
        >
          {isSubmittingComment ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Reply'}
        </button>
      </form>

      {/* Replies List */}
      <div className="flex-1 overflow-y-auto">
        {comments.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500 dark:text-gray-400">
            No replies yet. Be the first to join the conversation!
          </div>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="p-4 border-b border-gray-100 dark:border-white/5 flex gap-3">
              <Link href={`/profile/${comment.user_id}`}>
                <img 
                  src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.profiles?.full_name || 'User')}&background=7C3AED&color=fff&size=80`} 
                  alt="" 
                  className="w-9 h-9 rounded-full object-cover shrink-0" 
                />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-nowrap overflow-hidden">
                  <Link href={`/profile/${comment.user_id}`} className="font-bold text-[13.5px] sm:text-[14px] text-gray-900 dark:text-white hover:underline truncate shrink min-w-0 max-w-[140px] sm:max-w-none">
                    {comment.profiles?.full_name}
                  </Link>
                  <span className="shrink-0 flex items-center">
                    <VerifiedBadge level={getBadgeLevel(comment.profiles?.consistency_score, comment.profiles?.full_name)} size="xs" />
                  </span>
                  <span className="text-[12px] text-gray-400 dark:text-gray-500 shrink-0 select-none">·</span>
                  <span className="text-[12px] text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap">{formatTimeCompact(comment.created_at)}</span>
                </div>
                <div className="mt-1 text-[14.5px] text-gray-800 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                  <RichTextRenderer content={comment.content} />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImageUrl && (
        <ImagePreviewModal
          isOpen={Boolean(previewImageUrl)}
          imageUrl={previewImageUrl}
          onClose={() => setPreviewImageUrl(null)}
        />
      )}

      {/* Quote Composer Modal */}
      <QuoteModal
        open={isQuoteModalOpen}
        onOpenChange={setIsQuoteModalOpen}
        targetPost={post}
        user={{ id: currentUserId }}
        profile={currentUserProfile}
        onSuccess={() => {
          setRepostsCount(prev => prev + 1)
        }}
      />
    </>
  )
}

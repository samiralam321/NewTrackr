'use client'

import React, { useState, useEffect } from 'react'
import { Post } from '@/lib/supabase/types'
import { VerifiedBadge } from '@/components/ui/verified-badge'
import { getBadgeLevel } from '@/lib/utils/streak'
import { getUserHandle } from '@/lib/utils/user'
import { formatTimeCompact, formatFullDateTime } from '@/lib/utils/date'
import { AlertCircle, Code2, ChevronDown, ChevronUp, Maximize2, X } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { RichTextRenderer } from '@/components/ui/rich-text-renderer'

interface EmbeddedQuoteCardProps {
  quotedPost?: Post | null
  quotedPostId?: string | null
  onImageClick?: (imageUrl: string) => void
  interactive?: boolean
}

export function EmbeddedQuoteCard({
  quotedPost,
  quotedPostId,
  onImageClick,
  interactive = true
}: EmbeddedQuoteCardProps) {
  const [localPost, setLocalPost] = useState<Post | null>(quotedPost || null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(!quotedPost && !!quotedPostId)

  // Fetch quoted post on-demand if only quotedPostId was provided and quotedPost was missing
  useEffect(() => {
    if (quotedPost) {
      setLocalPost(quotedPost)
      setIsLoading(false)
      return
    }

    if (quotedPostId && !localPost) {
      let isMounted = true
      setIsLoading(true)

      const fetchQuotedPost = async () => {
        try {
          const supabase = createClient()
          const { data } = await supabase
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey(id, full_name, username, avatar_url, bio, college, consistency_score, streak)
            `)
            .eq('id', quotedPostId)
            .single()

          if (isMounted && data) {
            setLocalPost(data)
          }
        } catch (err) {
          console.warn('Could not fetch quoted post:', err)
        } finally {
          if (isMounted) setIsLoading(false)
        }
      }

      fetchQuotedPost()
      return () => {
        isMounted = false
      }
    }
  }, [quotedPost, quotedPostId])

  // ESC key listener to close quick view modal
  useEffect(() => {
    if (!isModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isModalOpen])

  // If loading quoted post
  if (isLoading) {
    return (
      <div className="mt-2.5 mb-2 p-3 sm:p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] animate-pulse">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="w-24 h-3 bg-gray-200 dark:bg-gray-800 rounded" />
        </div>
        <div className="w-full h-8 bg-gray-200 dark:bg-gray-800 rounded" />
      </div>
    )
  }

  // If quoted post was deleted or unavailable
  if (!localPost) {
    return (
      <div className="mt-2.5 mb-2 p-3 sm:p-3.5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 select-none">
        <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="italic font-medium">This post is unavailable. It may have been deleted or removed.</span>
      </div>
    )
  }

  const authorName = localPost.profiles?.full_name || 'Student'
  const handle = getUserHandle(localPost.profiles)
  const badgeLevel = getBadgeLevel(localPost.profiles?.consistency_score, localPost.profiles?.full_name)
  const avatarUrl = localPost.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=7C3AED&color=fff&size=80`
  const profileUrl = `/profile/${localPost.profiles?.username ? localPost.profiles.username.replace(/^@/, '') : localPost.user_id}`

  // Detect code block inside content
  const codeBlockMatch = localPost.content ? localPost.content.match(/```([a-zA-Z0-9_:-]*)\n([\s\S]*?)```/) : null
  const codeLang = codeBlockMatch ? (codeBlockMatch[1].split(':')[0] || 'Code') : null
  const codeLines = codeBlockMatch ? codeBlockMatch[2].split('\n').length : 0

  // Text content without code block for clean preview when collapsed
  const plainText = localPost.content 
    ? localPost.content.replace(/```[\s\S]*?```/g, '').trim()
    : ''

  // Card click toggles expansion on the same page without navigating or refreshing
  const handleCardClick = (e: React.MouseEvent) => {
    if (!interactive) return
    // If user is highlighting text, do not toggle
    const selection = window.getSelection()
    if (selection && selection.toString().length > 0) return

    e.stopPropagation()
    setIsExpanded(prev => !prev)
  }

  return (
    <>
      <div 
        onClick={handleCardClick}
        role={interactive ? "button" : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-expanded={isExpanded}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            setIsExpanded(prev => !prev)
          }
        }}
        className={`mt-2.5 mb-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/70 dark:bg-[#12101A]/70 transition-all duration-200 p-3 sm:p-3.5 overflow-hidden group/quote select-text text-left ${
          interactive 
            ? 'cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.03] hover:border-gray-300 dark:hover:border-white/20 active:scale-[0.998]' 
            : ''
        }`}
      >
        {/* Quoted Author Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
          <div className="flex items-center gap-2 min-w-0 flex-wrap">
            <Link 
              href={profileUrl}
              onClick={(e) => e.stopPropagation()}
              className="shrink-0 group/avatar"
            >
              <img 
                src={avatarUrl} 
                alt={authorName} 
                className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover group-hover/avatar:opacity-85 transition-opacity" 
                loading="lazy" 
              />
            </Link>

            <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
              <Link
                href={profileUrl}
                onClick={(e) => e.stopPropagation()}
                className="font-bold text-[13px] text-gray-900 dark:text-gray-100 hover:underline truncate"
              >
                {authorName}
              </Link>
              <VerifiedBadge level={badgeLevel} nameOrHandle={authorName} size="sm" />
              <span className="text-[11.5px] text-gray-400 dark:text-gray-500 font-normal truncate">
                {handle}
              </span>
              {localPost.created_at && (
                <>
                  <span className="text-gray-400 dark:text-gray-600 text-xs select-none">·</span>
                  <span 
                    className="text-[11.5px] text-gray-400 dark:text-gray-500 font-normal shrink-0"
                    title={formatFullDateTime(localPost.created_at)}
                  >
                    {formatTimeCompact(localPost.created_at)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Top-Right Toggle & Modal Button */}
          {interactive && (
            <div className="flex items-center gap-1 shrink-0 ml-auto" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                title="View in full popup modal"
                className="p-1 rounded-md text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIsExpanded(prev => !prev)}
                title={isExpanded ? "Collapse post" : "Expand full post"}
                className="flex items-center gap-0.5 text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 px-2 py-0.5 rounded-full transition-colors cursor-pointer"
              >
                <span>{isExpanded ? "Less" : "Full Post"}</span>
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          )}
        </div>

        {/* ================= POST CONTENT ================= */}
        {isExpanded ? (
          /* Full Post View (Expanded Inline on Same Page) */
          <div className="text-[14px] leading-relaxed text-gray-900 dark:text-[#e7e9ea] font-normal mb-2 mt-1">
            <RichTextRenderer content={localPost.content} />
          </div>
        ) : (
          /* Truncated Preview View */
          <>
            {plainText && (
              <p className="text-[13.5px] text-gray-800 dark:text-gray-200 line-clamp-3 leading-relaxed whitespace-pre-wrap font-normal mb-1.5">
                {plainText}
              </p>
            )}

            {/* Code snippet badge if post contains code */}
            {codeBlockMatch && (
              <div className="my-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-900/40 text-[11px] font-medium text-violet-700 dark:text-violet-300">
                <Code2 className="w-3.5 h-3.5 shrink-0 text-violet-500" />
                <span className="font-semibold uppercase">{codeLang} Snippet</span>
                <span className="text-gray-400 dark:text-gray-500">·</span>
                <span>{codeLines} {codeLines === 1 ? 'line' : 'lines'}</span>
              </div>
            )}
          </>
        )}

        {/* Image attachment thumbnail / full image */}
        {localPost.image_url && (
          <div className="mt-2 rounded-xl overflow-hidden border border-gray-100 dark:border-white/5 bg-black/5">
            <img 
              src={localPost.image_url} 
              alt="Quoted attachment" 
              className={`w-full h-auto object-cover hover:scale-[1.01] transition-transform cursor-pointer ${
                isExpanded ? 'max-h-96' : 'max-h-48'
              }`}
              loading="lazy" 
              onClick={(e) => {
                if (onImageClick) {
                  e.stopPropagation()
                  onImageClick(localPost.image_url!)
                }
              }}
            />
          </div>
        )}

        {/* Bottom Expansion Bar (visible when expanded) */}
        {isExpanded && interactive && (
          <div 
            className="flex items-center justify-between text-xs pt-2 mt-2.5 border-t border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setIsExpanded(false)}
              className="flex items-center gap-1 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show less</span>
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-1 text-violet-600 dark:text-violet-400 hover:underline font-semibold cursor-pointer"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Open in popup modal</span>
            </button>
          </div>
        )}
      </div>

      {/* ================= QUICK POST MODAL OVERLAY (ON SAME PAGE, NO NAVIGATION) ================= */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={(e) => {
            e.stopPropagation()
            setIsModalOpen(false)
          }}
        >
          <div 
            className="bg-white dark:bg-[#12101A] border border-gray-200 dark:border-[#2D2B3B] rounded-3xl max-w-xl w-full max-h-[85vh] overflow-y-auto no-scrollbar shadow-2xl p-5 sm:p-6 animate-in zoom-in-95 duration-200 relative text-left"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100 dark:border-white/10">
              <div className="flex items-center gap-3">
                <Link 
                  href={profileUrl}
                  onClick={() => setIsModalOpen(false)}
                  className="shrink-0 group/avatar"
                >
                  <img 
                    src={avatarUrl} 
                    alt={authorName} 
                    className="w-10 h-10 rounded-full object-cover group-hover/avatar:opacity-85 transition-opacity"
                  />
                </Link>
                <div>
                  <div className="flex items-center gap-1.5">
                    <Link
                      href={profileUrl}
                      onClick={() => setIsModalOpen(false)}
                      className="font-bold text-[15px] text-gray-900 dark:text-white hover:underline"
                    >
                      {authorName}
                    </Link>
                    <VerifiedBadge level={badgeLevel} nameOrHandle={authorName} size="sm" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{handle}</span>
                    {localPost.created_at && (
                      <>
                        <span>·</span>
                        <span>{formatFullDateTime(localPost.created_at)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Full Post Content */}
            <div className="text-[15.5px] leading-relaxed text-gray-900 dark:text-[#e7e9ea] font-normal mb-4">
              <RichTextRenderer content={localPost.content} />
            </div>

            {/* Modal Image if any */}
            {localPost.image_url && (
              <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/10 mb-4 bg-black/5">
                <img 
                  src={localPost.image_url} 
                  alt="Post attachment" 
                  className="w-full max-h-[420px] object-contain"
                />
              </div>
            )}

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import React from 'react'
import { Post } from '@/lib/supabase/types'
import { VerifiedBadge } from '@/components/ui/verified-badge'
import { getBadgeLevel } from '@/lib/utils/streak'
import { getUserHandle } from '@/lib/utils/user'
import { formatTimeCompact } from '@/lib/utils/date'
import { AlertCircle, Code2 } from 'lucide-react'
import Link from 'next/link'

interface EmbeddedQuoteCardProps {
  quotedPost?: Post | null
  quotedPostId?: string | null
  onImageClick?: (imageUrl: string) => void
}

export function EmbeddedQuoteCard({
  quotedPost,
  quotedPostId,
  onImageClick
}: EmbeddedQuoteCardProps) {
  // If quoted post was deleted or unavailable
  if (!quotedPost) {
    return (
      <div className="mt-2.5 mb-2 p-3 sm:p-3.5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center gap-2.5 text-xs text-gray-500 dark:text-gray-400 select-none">
        <AlertCircle className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="italic font-medium">This post is unavailable. It may have been deleted or removed.</span>
      </div>
    )
  }

  const authorName = quotedPost.profiles?.full_name || 'Student'
  const handle = getUserHandle(quotedPost.profiles?.full_name)
  const badgeLevel = getBadgeLevel(quotedPost.profiles?.consistency_score, quotedPost.profiles?.full_name)
  const avatarUrl = quotedPost.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=7C3AED&color=fff&size=80`

  // Detect code block inside content
  const codeBlockMatch = quotedPost.content ? quotedPost.content.match(/```([a-zA-Z0-9_:-]*)\n([\s\S]*?)```/) : null
  const codeLang = codeBlockMatch ? (codeBlockMatch[1].split(':')[0] || 'Code') : null
  const codeLines = codeBlockMatch ? codeBlockMatch[2].split('\n').length : 0

  // Text content without code block for clean preview
  const plainText = quotedPost.content 
    ? quotedPost.content.replace(/```[\s\S]*?```/g, '').trim()
    : ''

  return (
    <div className="mt-2.5 mb-2 rounded-2xl border border-gray-200 dark:border-white/10 bg-white/50 dark:bg-[#12101A]/60 hover:bg-gray-50/70 dark:hover:bg-[#161420] transition-all p-3 sm:p-3.5 overflow-hidden group/quote">
      {/* Quoted Author Header */}
      <div className="flex items-center gap-2 mb-1.5 min-w-0">
        <Link 
          href={`/profile/${quotedPost.user_id}`}
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
            href={`/profile/${quotedPost.user_id}`}
            onClick={(e) => e.stopPropagation()}
            className="font-bold text-[13px] text-gray-900 dark:text-gray-100 hover:underline truncate"
          >
            {authorName}
          </Link>
          <VerifiedBadge level={badgeLevel} nameOrHandle={authorName} size="sm" />
          <span className="text-[11.5px] text-gray-400 dark:text-gray-500 font-normal truncate">
            {handle}
          </span>
          {quotedPost.created_at && (
            <>
              <span className="text-gray-400 dark:text-gray-600 text-xs select-none">·</span>
              <span className="text-[11.5px] text-gray-400 dark:text-gray-500 font-normal shrink-0">
                {formatTimeCompact(quotedPost.created_at)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Quoted Text Content */}
      {plainText && (
        <p className="text-[13.5px] text-gray-800 dark:text-gray-200 line-clamp-3 leading-relaxed whitespace-pre-wrap font-normal mb-1.5">
          {plainText}
        </p>
      )}

      {/* Code snippet badge if original post had code */}
      {codeBlockMatch && (
        <div className="my-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 border border-violet-200/60 dark:border-violet-900/40 text-[11px] font-medium text-violet-700 dark:text-violet-300">
          <Code2 className="w-3.5 h-3.5 shrink-0 text-violet-500" />
          <span className="font-semibold uppercase">{codeLang} Snippet</span>
          <span className="text-gray-400 dark:text-gray-500">·</span>
          <span>{codeLines} {codeLines === 1 ? 'line' : 'lines'}</span>
        </div>
      )}

      {/* Image attachment thumbnail */}
      {quotedPost.image_url && (
        <div className="mt-2 rounded-xl overflow-hidden max-h-48 border border-gray-100 dark:border-white/5 bg-black/5">
          <img 
            src={quotedPost.image_url} 
            alt="Quoted attachment" 
            className="w-full h-auto max-h-48 object-cover hover:scale-[1.01] transition-transform cursor-pointer"
            loading="lazy"
            onClick={(e) => {
              if (onImageClick) {
                e.stopPropagation()
                onImageClick(quotedPost.image_url!)
              }
            }}
          />
        </div>
      )}
    </div>
  )
}

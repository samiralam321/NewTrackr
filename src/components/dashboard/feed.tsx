'use client'

import { useEffect, useState, useRef } from "react"
import { Bookmark, Heart, MessageCircle, Repeat2, Send, Trash2, MoreVertical, Edit2, Pin, Flag, BellOff, UserX, AlertTriangle, Share2, Copy, Check, Link2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Post, Comment } from "@/lib/supabase/types"
import Link from "next/link"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { RichTextRenderer } from "@/components/ui/rich-text-renderer"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { getBadgeLevel } from "@/lib/utils/streak"
import { getUserHandle } from "@/lib/utils/user"
import { extractCleanPlainText } from "@/lib/utils/text"
import { formatTimeCompact, formatFullDateTime } from "@/lib/utils/date"
import { getCacheEntry, setCacheEntry, mutateAllFeedCaches } from "@/lib/cache/client-cache"
import { ImagePreviewModal } from "@/components/ui/image-preview-modal"
import { LikeButton } from "@/components/ui/like-button"
import { RepostButton } from "@/components/ui/repost-button"
import { ActionTooltip } from "@/components/ui/action-tooltip"
import { EmbeddedQuoteCard } from "@/components/dashboard/embedded-quote-card"
import { QuoteModal } from "@/components/dashboard/quote-modal"

export function Feed({ 
  userIdFilter,
  savedOnlyFilter,
  likedByFilter,
  commentedByFilter,
  followingOnlyFilter,
  collegeOnlyFilter,
  opportunitiesOnlyFilter,
  eventsOnlyFilter,
  isJourneyMode,
  highlightsOnlyFilter,
  currentUserIdProp,
  sortBy = 'new'
}: { 
  userIdFilter?: string,
  savedOnlyFilter?: boolean,
  likedByFilter?: string,
  commentedByFilter?: string,
  followingOnlyFilter?: boolean,
  collegeOnlyFilter?: boolean,
  opportunitiesOnlyFilter?: boolean,
  eventsOnlyFilter?: boolean,
  isJourneyMode?: boolean,
  highlightsOnlyFilter?: boolean,
  currentUserIdProp?: string,
  sortBy?: 'popular' | 'new' | 'relevant'
}) {
  const currentFeedKey = `feed_${userIdFilter || 'all'}_sv${Boolean(savedOnlyFilter)}_lk${likedByFilter || 'none'}_cm${commentedByFilter || 'none'}_hl${Boolean(highlightsOnlyFilter)}_f${Boolean(followingOnlyFilter)}_c${Boolean(collegeOnlyFilter)}_o${Boolean(opportunitiesOnlyFilter)}_e${Boolean(eventsOnlyFilter)}_s${sortBy}_u${currentUserIdProp || 'anon'}`

  // Synchronously initialize from client cache if available (0ms render on tab switch)
  const [posts, setPosts] = useState<Post[]>(() => {
    const entry = getCacheEntry<Post[]>(currentFeedKey, 30_000, currentUserIdProp)
    return entry?.data || []
  })
  const [currentUserId, setCurrentUserId] = useState<string | null>(currentUserIdProp || null)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [repostedPosts, setRepostedPosts] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem('trackr_user_reposts') || '{}')
    } catch {
      return {}
    }
  })
  const [quoteTargetPost, setQuoteTargetPost] = useState<Post | null>(null)
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false)
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({})
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // New States for Advanced Actions
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [reportPostId, setReportPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [blockUser, setBlockUser] = useState<{id: string, name: string} | null>(null)
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([])
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [copiedPostId, setCopiedPostId] = useState<string | null>(null)
  const [copiedToast, setCopiedToast] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(() => {
    const entry = getCacheEntry<Post[]>(currentFeedKey, 30_000, currentUserIdProp)
    return !entry
  })
  const liveChannelRef = useRef<any>(null)
  const realtimeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.post-menu-container')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  // Load muted and blocked users from localStorage
  useEffect(() => {
    if (!currentUserId) return
    try {
      const storedMuted = localStorage.getItem(`muted_users_${currentUserId}`)
      const storedBlocked = localStorage.getItem(`blocked_users_${currentUserId}`)
      const muted = storedMuted ? JSON.parse(storedMuted) : []
      const blocked = storedBlocked ? JSON.parse(storedBlocked) : []
      setHiddenUserIds(Array.from(new Set([...muted, ...blocked])))
    } catch (e) {
      console.warn("Failed to load muted or blocked users from localStorage", e)
    }
  }, [currentUserId])

  // Load pinned post on mount / userId change
  useEffect(() => {
    const storedPinned = localStorage.getItem(`pinned_post_${userIdFilter || currentUserId}`)
    setPinnedPostId(storedPinned)
  }, [userIdFilter, currentUserId])

  useEffect(() => {
    // Check client cache on mount or filter switch
    const entry = getCacheEntry<Post[]>(currentFeedKey, 30_000, currentUserIdProp || currentUserId)
    const isMainTimeline = !userIdFilter && !savedOnlyFilter && !likedByFilter && !commentedByFilter && !followingOnlyFilter && !collegeOnlyFilter && !opportunitiesOnlyFilter && !eventsOnlyFilter
    if (entry && entry.data && entry.data.length > 0) {
      setPosts(entry.data)
      setIsLoading(false)
      // If stale or if this is the main feed and has suspiciously few posts (< 4), revalidate in background
      if (entry.isStale || (isMainTimeline && entry.data.length < 4)) {
        fetchPosts(false)
      }
    } else {
      fetchPosts(true)
    }
    
    // Instant local optimistic update when a post is created from right sidebar or mobile drawer
    const handlePostCreated = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        if (userIdFilter && customEvent.detail.user_id !== userIdFilter) return
        setPosts(prev => {
          if (prev.some(p => p.id === customEvent.detail.id)) return prev
          return [customEvent.detail, ...prev]
        })
      }
      fetchPosts(false)
    }

    window.addEventListener('post-created', handlePostCreated)

    // Debounced realtime refresh to prevent hammering the database on rapid events
    const debouncedRealtimeRefresh = () => {
      if (realtimeDebounceTimerRef.current) {
        clearTimeout(realtimeDebounceTimerRef.current)
      }
      realtimeDebounceTimerRef.current = setTimeout(() => {
        fetchPosts(false)
      }, 1200)
    }
    
    const uniqueChannelName = `trackr-feed-${Math.random().toString(36).substring(7)}`
    
    const channel = supabase
      .channel(uniqueChannelName)
      // Real-time broadcast events for instant live sync between all clients
      .on('broadcast', { event: 'like_toggled' }, ({ payload }) => {
        if (!payload) return
        setPosts(prev => prev.map(p => {
          if (p.id === payload.postId) {
            const count = (p as any).likes_count || 0
            return {
              ...p,
              likes_count: Math.max(0, count + (payload.action === 'like' ? 1 : -1))
            }
          }
          return p
        }))
      })
      .on('broadcast', { event: 'comment_added' }, ({ payload }) => {
        if (!payload) return
        setPosts(prev => prev.map(p => {
          if (p.id === payload.postId) {
            return {
              ...p,
              comments_count: ((p as any).comments_count || 0) + 1
            }
          }
          return p
        }))
        if (payload.postId) {
          fetchComments(payload.postId)
        }
      })
      .on('broadcast', { event: 'repost_toggled' }, ({ payload }) => {
        if (!payload) return
        setPosts(prev => prev.map(p => {
          if (p.id === payload.postId) {
            const count = (p as any).reposts_count || 0
            return {
              ...p,
              reposts_count: Math.max(0, count + (payload.action === 'repost' ? 1 : -1))
            }
          }
          return p
        }))
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, debouncedRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, debouncedRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, debouncedRealtimeRefresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, (payload) => {
        const pid = (payload.new as any)?.post_id || (payload.old as any)?.post_id
        if (pid) fetchComments(pid)
        debouncedRealtimeRefresh()
      })
      .subscribe()

    liveChannelRef.current = channel

    return () => {
      window.removeEventListener('post-created', handlePostCreated)
      if (realtimeDebounceTimerRef.current) {
        clearTimeout(realtimeDebounceTimerRef.current)
      }
      supabase.removeChannel(channel)
    }
  }, [currentFeedKey, userIdFilter, savedOnlyFilter, likedByFilter, commentedByFilter, followingOnlyFilter, collegeOnlyFilter, opportunitiesOnlyFilter, eventsOnlyFilter, sortBy, currentUserIdProp])

  const handleOpenQuote = (post: Post) => {
    setQuoteTargetPost(post)
    setIsQuoteModalOpen(true)
  }

  const handleRepost = async (target: Post | string) => {
    const uid = currentUserId || currentUserIdProp
    if (!uid) {
      window.location.href = '/login'
      return
    }

    const postId = typeof target === 'string' ? target : target.id
    const post = typeof target === 'string' ? posts.find(p => p.id === target) : target

    if (post && post.user_id === uid) {
      return
    }

    const isCurrentlyReposted = !!repostedPosts[postId]
    if (isCurrentlyReposted) {
      handleUndoRepost(target)
      return
    }

    // 1. Instant optimistic UI toggle
    setRepostedPosts(prev => {
      const next = { ...prev, [postId]: true }
      try {
        localStorage.setItem('trackr_user_reposts', JSON.stringify(next))
      } catch (e) {}
      return next
    })

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const count = (p as any).reposts_count || 0
        return {
          ...p,
          user_has_reposted: true,
          reposts_count: count + 1
        }
      }
      return p
    }))

    // 2. Broadcast repost to other viewers in real time
    try {
      liveChannelRef.current?.send({
        type: 'broadcast',
        event: 'repost_toggled',
        payload: { postId, userId: uid, action: 'repost' }
      })
    } catch (e) {}

    // 3. Persist relational repost in Supabase
    try {
      // A) Try inserting into relational reposts table
      await supabase.from('reposts').insert({
        post_id: postId,
        user_id: uid
      })

      // B) Insert timeline repost reference in posts table (without duplicating content!)
      const repostPayload: any = {
        user_id: uid,
        content: '',
        tags: [`repost:${postId}`],
        type: 'Repost',
        repost_of_id: postId
      }

      const { error: repostErr } = await supabase
        .from('posts')
        .insert(repostPayload)

      if (repostErr) {
        // Fallback if repost_of_id or type column doesn't exist yet
        delete repostPayload.repost_of_id
        delete repostPayload.type
        await supabase.from('posts').insert(repostPayload)
      }

      // C) Send notification to original post author if not own post
      if (post && post.user_id !== uid) {
        try {
          await supabase.from('notifications').insert({
            user_id: post.user_id,
            actor_id: uid,
            type: 'repost',
            post_id: postId,
            is_read: false
          })
        } catch (notifErr) {
          try {
            await supabase.from('notifications').insert({
              user_id: post.user_id,
              actor_id: uid,
              type: 'mention',
              post_id: postId,
              is_read: false
            })
          } catch (e) {}
        }
      }
    } catch (err) {
      console.warn('Could not insert repost:', err)
    }
  }

  const handleUndoRepost = async (target: Post | string) => {
    const uid = currentUserId || currentUserIdProp
    if (!uid) return

    const postId = typeof target === 'string' ? target : target.id

    // 1. Instant optimistic UI toggle
    setRepostedPosts(prev => {
      const next = { ...prev }
      delete next[postId]
      try {
        localStorage.setItem('trackr_user_reposts', JSON.stringify(next))
      } catch (e) {}
      return next
    })

    setPosts(prev => {
      // Remove any pure repost timeline item by current user for this post
      const filtered = prev.filter(p => !(p.is_repost && p.reposted_by?.id === uid && p.id === postId))
      return filtered.map(p => {
        if (p.id === postId) {
          const count = (p as any).reposts_count || 0
          return {
            ...p,
            user_has_reposted: false,
            reposts_count: Math.max(0, count - 1)
          }
        }
        return p
      })
    })

    // 2. Broadcast unrepost to other viewers in real time
    try {
      liveChannelRef.current?.send({
        type: 'broadcast',
        event: 'repost_toggled',
        payload: { postId, userId: uid, action: 'unrepost' }
      })
    } catch (e) {}

    // 3. Delete from Supabase
    try {
      await supabase.from('reposts').delete().eq('post_id', postId).eq('user_id', uid)
      await supabase.from('posts').delete().eq('user_id', uid).contains('tags', [`repost:${postId}`])
    } catch (err) {
      console.warn("Could not undo repost in database:", err)
    }
  }

  const fetchPosts = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    let currentUid: string | null = currentUserIdProp || null;
    if (!currentUid) {
      const { data: userData } = await supabase.auth.getUser()
      currentUid = userData.user?.id || null
    }
    setCurrentUserId(currentUid)

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(id, full_name, username, avatar_url, bio, college, consistency_score, streak),
        likes(user_id),
        comments(user_id, id),
        bookmarks(user_id)
      `)
      .order('created_at', { ascending: false })
      .limit(30)
      
    if (userIdFilter) query = query.eq('user_id', userIdFilter)

    if (likedByFilter) {
      const { data: likedRows } = await supabase
        .from('likes')
        .select('post_id')
        .eq('user_id', likedByFilter)
        .order('created_at', { ascending: false })
        .limit(50)
      const postIds = likedRows?.map((r: any) => r.post_id).filter(Boolean) || []
      if (postIds.length > 0) {
        query = query.in('id', postIds)
      } else {
        setPosts([])
        if (showLoading) setIsLoading(false)
        return
      }
    }

    if (commentedByFilter) {
      const { data: commentRows } = await supabase
        .from('comments')
        .select('post_id')
        .eq('user_id', commentedByFilter)
        .order('created_at', { ascending: false })
        .limit(50)
      const postIds = Array.from(new Set((commentRows?.map((r: any) => r.post_id) || []).filter(Boolean)))
      if (postIds.length > 0) {
        query = query.in('id', postIds)
      } else {
        setPosts([])
        if (showLoading) setIsLoading(false)
        return
      }
    }

    if (savedOnlyFilter && currentUid) {
      const { data: bookmarkRows } = await supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', currentUid)
        .order('created_at', { ascending: false })
        .limit(50)
      const postIds = bookmarkRows?.map((r: any) => r.post_id).filter(Boolean) || []
      if (postIds.length > 0) {
        query = query.in('id', postIds)
      } else {
        setPosts([])
        if (showLoading) setIsLoading(false)
        return
      }
    }

    if (followingOnlyFilter && currentUid) {
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUid)
      
      const followingIds = followData?.map((f: any) => f.following_id) || []
      
      if (followingIds.length > 0) {
        query = query.in('user_id', followingIds)
      } else {
        setPosts([])
        return
      }
    }

    if (collegeOnlyFilter && currentUid) {
      const { data: profileData } = await supabase.from('profiles').select('college').eq('id', currentUid).single()
      if (profileData?.college) {
        const { data: collegeUsers } = await supabase.from('profiles').select('id').eq('college', profileData.college)
        const collegeUserIds = collegeUsers?.map(u => u.id) || []
        if (collegeUserIds.length > 0) {
          query = query.in('user_id', collegeUserIds)
        } else {
          setPosts([])
          return
        }
      } else {
        setPosts([])
        return
      }
    }
    
    const { data, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return
    }

    // Build raw post map to resolve quotes and reposts
    const rawPostMap = new Map<string, any>()
    data.forEach((p: any) => rawPostMap.set(p.id, p))

    // Collect any missing referenced IDs (for quotes or pure reposts)
    const missingIds = new Set<string>()
    data.forEach((p: any) => {
      const quoteTag = p.tags?.find((t: string) => typeof t === 'string' && t.startsWith('quote:'))
      const quotedId = p.quoted_post_id || (quoteTag ? quoteTag.split('quote:')[1] : null)
      if (quotedId && !rawPostMap.has(quotedId)) {
        missingIds.add(quotedId)
      }

      const repostTag = p.tags?.find((t: string) => typeof t === 'string' && t.startsWith('repost:'))
      const repostId = p.repost_of_id || (repostTag ? repostTag.split('repost:')[1] : null)
      if (repostId && !rawPostMap.has(repostId)) {
        missingIds.add(repostId)
      }
    })

    if (missingIds.size > 0) {
      try {
        const { data: missingPosts } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey(id, full_name, username, avatar_url, bio, college, consistency_score, streak),
            likes(user_id),
            comments(user_id, id),
            bookmarks(user_id)
          `)
          .in('id', Array.from(missingIds))

        if (missingPosts) {
          missingPosts.forEach((mp: any) => rawPostMap.set(mp.id, mp))
        }
      } catch (e) {}
    }

    // Calculate repost counts and user repost status
    const repostCountsMap: Record<string, number> = {}
    const userRepostsSet = new Set<string>()

    try {
      const { data: dbReposts } = await supabase.from('reposts').select('post_id, user_id')
      if (dbReposts) {
        dbReposts.forEach((r: any) => {
          repostCountsMap[r.post_id] = (repostCountsMap[r.post_id] || 0) + 1
          if (r.user_id === currentUid) {
            userRepostsSet.add(r.post_id)
          }
        })
      }
    } catch (e) {}

    data.forEach((p: any) => {
      const repostTag = p.tags?.find((t: string) => typeof t === 'string' && t.startsWith('repost:'))
      const repostId = p.repost_of_id || (repostTag ? repostTag.split('repost:')[1] : null)
      if (repostId) {
        repostCountsMap[repostId] = (repostCountsMap[repostId] || 0) + 1
        if (p.user_id === currentUid) {
          userRepostsSet.add(repostId)
        }
      }
    })

    try {
      const localReposts = JSON.parse(localStorage.getItem('trackr_user_reposts') || '{}')
      Object.keys(localReposts).forEach(pid => {
        if (localReposts[pid]) {
          userRepostsSet.add(pid)
        }
      })
    } catch (e) {}

    const mergedRepostsObj: Record<string, boolean> = {}
    userRepostsSet.forEach(id => {
      mergedRepostsObj[id] = true
    })
    setRepostedPosts(mergedRepostsObj)
    try {
      localStorage.setItem('trackr_user_reposts', JSON.stringify(mergedRepostsObj))
    } catch (e) {}

    const activePinnedId = localStorage.getItem(`pinned_post_${userIdFilter || currentUid}`)
    let formattedPosts: Post[] = []

    for (const p of data) {
      const repostTag = p.tags?.find((t: string) => typeof t === 'string' && t.startsWith('repost:'))
      const repostId = p.repost_of_id || (repostTag ? repostTag.split('repost:')[1] : null)

      // If pure repost timeline entry:
      if (repostId) {
        const original = rawPostMap.get(repostId)
        if (original) {
          formattedPosts.push({
            ...original,
            feed_item_id: `repost-${p.id}`,
            is_repost: true,
            reposted_by: p.profiles,
            reposted_at: p.created_at,
            user_has_liked: (original.likes || []).some((l: any) => l.user_id === currentUid),
            user_has_bookmarked: (original.bookmarks || []).some((b: any) => b.user_id === currentUid),
            likes_count: (original.likes || []).length,
            comments_count: (original.comments || []).length,
            bookmarks_count: (original.bookmarks || []).length,
            reposts_count: repostCountsMap[original.id] || 0,
            user_has_reposted: userRepostsSet.has(original.id)
          })
        }
        continue
      }

      // Normal post or Quote post:
      const quoteTag = p.tags?.find((t: string) => typeof t === 'string' && t.startsWith('quote:'))
      const quotedId = p.quoted_post_id || (quoteTag ? quoteTag.split('quote:')[1] : null)
      const quotedPost = quotedId ? (rawPostMap.get(quotedId) || null) : null

      formattedPosts.push({
        ...p,
        feed_item_id: p.id,
        quoted_post_id: quotedId,
        quoted_post: quotedPost,
        user_has_liked: (p.likes || []).some((l: any) => l.user_id === currentUid),
        user_has_bookmarked: (p.bookmarks || []).some((b: any) => b.user_id === currentUid),
        likes_count: (p.likes || []).length,
        comments_count: (p.comments || []).length,
        bookmarks_count: (p.bookmarks || []).length,
        reposts_count: repostCountsMap[p.id] || 0,
        user_has_reposted: userRepostsSet.has(p.id),
        is_pinned: p.id === activePinnedId
      })
    }

    // Sort the pinned post to the very top of the feed
    if (activePinnedId) {
      formattedPosts = formattedPosts.sort((a, b) => (a.id === activePinnedId ? -1 : b.id === activePinnedId ? 1 : 0))
    }

    // Deduplicate any accidental duplicate items in formattedPosts
    const seenItemKeys = new Set<string>()
    formattedPosts = formattedPosts.filter(p => {
      const key = p.feed_item_id || (p.is_repost ? `repost-${p.id}-${p.reposted_by?.id || ''}` : p.id)
      if (seenItemKeys.has(key)) return false
      seenItemKeys.add(key)
      return true
    })

    
    if (opportunitiesOnlyFilter) {
      formattedPosts = formattedPosts.filter(p => {
        const content = (p.content || '').toLowerCase()
        const tags = (p.tags || []).map((t: string) => t.toLowerCase())
        return (
          p.type === 'Built' ||
          tags.some((t: string) => t.includes('placement') || t.includes('hackathon') || t.includes('internship') || t.includes('dsa') || t.includes('opportunity')) ||
          content.includes('hackathon') || content.includes('internship') || content.includes('placement') || content.includes('offer') || content.includes('opportunity')
        )
      })
    }

    if (eventsOnlyFilter) {
      formattedPosts = formattedPosts.filter(p => {
        const content = (p.content || '').toLowerCase()
        const tags = (p.tags || []).map((t: string) => t.toLowerCase())
        return (
          tags.some((t: string) => t.includes('event') || t.includes('hackathon') || t.includes('workshop') || t.includes('sih') || t.includes('meetup')) ||
          content.includes('hackathon') || content.includes('event') || content.includes('workshop') || content.includes('registrations')
        )
      })
    }

    if (savedOnlyFilter && currentUid) {
      formattedPosts = formattedPosts.filter(p => p.user_has_bookmarked)
    }
    
    if (likedByFilter) {
      formattedPosts = formattedPosts.filter(p => (p as any).likes?.some((l: any) => l.user_id === likedByFilter) ?? true)
    }

    if (commentedByFilter) {
      formattedPosts = formattedPosts.filter(p => (p as any).comments?.some((c: any) => c.user_id === commentedByFilter) ?? true)
    }

    if (highlightsOnlyFilter && formattedPosts.length > 0) {
      const topPost = formattedPosts.reduce((prev, current) => ((prev as any).likes_count > (current as any).likes_count) ? prev : current)
      formattedPosts = [topPost]
    }

    // Apply Reddit-style feed sorting (Popular, New, Relevant)
    if (sortBy === 'popular') {
      formattedPosts.sort((a, b) => {
        if (a.id === activePinnedId) return -1
        if (b.id === activePinnedId) return 1
        const scoreA = ((a as any).likes_count || 0) * 2 + ((a as any).comments_count || 0) * 3
        const scoreB = ((b as any).likes_count || 0) * 2 + ((b as any).comments_count || 0) * 3
        if (scoreB !== scoreA) return scoreB - scoreA
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } else if (sortBy === 'new') {
      formattedPosts.sort((a, b) => {
        if (a.id === activePinnedId) return -1
        if (b.id === activePinnedId) return 1
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      })
    } else if (sortBy === 'relevant') {
      formattedPosts.sort((a, b) => {
        if (a.id === activePinnedId) return -1
        if (b.id === activePinnedId) return 1
        const weightA = (a.type ? 2 : 0) + ((a.profiles?.consistency_score || 0) > 0 ? 3 : 0) + ((a as any).likes_count || 0)
        const weightB = (b.type ? 2 : 0) + ((b.profiles?.consistency_score || 0) > 0 ? 3 : 0) + ((b as any).likes_count || 0)
        return weightB - weightA
      })
    }

    setPosts(formattedPosts)
    // Save to client cache with current user isolation
    setCacheEntry(currentFeedKey, formattedPosts, currentUid)
    if (showLoading) setIsLoading(false)
  }

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`*, profiles(id, full_name, avatar_url, bio, college, consistency_score, streak)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (data && !error) {
      setPostComments(prev => ({ ...prev, [postId]: data as any }))
    }
    setIsLoadingComments(prev => ({ ...prev, [postId]: false }))
  }

  const toggleComments = (postId: string) => {
    const isExpanding = !expandedComments[postId]
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanding }))
    if (isExpanding && !postComments[postId]) {
      setIsLoadingComments(prev => ({ ...prev, [postId]: true }))
      fetchComments(postId)
    }
  }

  const submitComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim()
    const uid = currentUserId || currentUserIdProp
    if (!text || !uid) return

    const newComment = {
      id: `temp-${Date.now()}`,
      post_id: postId,
      user_id: uid,
      content: text,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: "You",
        avatar_url: ""
      }
    }

    // 1. Optimistically append new comment to comments list
    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment as any]
    }))
    setCommentTexts(prev => ({ ...prev, [postId]: "" }))

    // 2. Optimistically increment comments_count on post card
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments_count: ((p as any).comments_count || 0) + 1
        }
      }
      return p
    }))

    // 3. Persist to Supabase comments table
    try {
      const { data: inserted, error } = await supabase.from('comments').insert({
        post_id: postId,
        user_id: uid,
        content: text
      }).select(`*, profiles(*)`).single()

      if (inserted && !error) {
        setPostComments(prev => ({
          ...prev,
          [postId]: (prev[postId] || []).map(c => c.id === newComment.id ? inserted : c)
        }))

        // Broadcast comment to all connected users
        liveChannelRef.current?.send({
          type: 'broadcast',
          event: 'comment_added',
          payload: { postId, comment: inserted }
        })
      }
    } catch (err) {
      console.error("Comment submit error:", err)
    }
  }

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    const uid = currentUserId || currentUserIdProp
    if (!uid) {
      window.location.href = '/login'
      return
    }

    // 1. Instant optimistic update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        const currentCount = (p as any).likes_count || 0
        return {
          ...p,
          user_has_liked: !currentlyLiked,
          likes_count: Math.max(0, currentCount + (currentlyLiked ? -1 : 1))
        }
      }
      return p
    }))

    // Update client cache for all tabs optimistically
    mutateAllFeedCaches(cachedPosts => cachedPosts.map(p => {
      if (p.id === postId) {
        const currentCount = (p as any).likes_count || 0
        return {
          ...p,
          user_has_liked: !currentlyLiked,
          likes_count: Math.max(0, currentCount + (currentlyLiked ? -1 : 1))
        }
      }
      return p
    }))

    // 2. Broadcast immediately to all connected clients
    try {
      liveChannelRef.current?.send({
        type: 'broadcast',
        event: 'like_toggled',
        payload: { postId, userId: uid, action: currentlyLiked ? 'unlike' : 'like' }
      })
    } catch (e) {}

    // 3. Persist to Supabase likes table
    try {
      if (currentlyLiked) {
        await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', uid)
      } else {
        await supabase.from('likes').insert({ post_id: postId, user_id: uid })

        // Create notification for post owner if not self
        const post = posts.find(p => p.id === postId)
        if (post && post.user_id !== uid) {
          try {
            await supabase.from('notifications').insert({
              user_id: post.user_id,
              actor_id: uid,
              type: 'like',
              post_id: postId,
              is_read: false
            })
          } catch (notifErr) {}
        }
      }
    } catch (err) {
      console.error("Like toggle error:", err)
      // Rollback on error
      setPosts(prev => prev.map(p => {
        if (p.id === postId) {
          const currentCount = (p as any).likes_count || 0
          return {
            ...p,
            user_has_liked: currentlyLiked,
            likes_count: Math.max(0, currentCount + (currentlyLiked ? 1 : -1))
          }
        }
        return p
      }))
    }
  }

  const toggleBookmark = async (postId: string, currentlyBookmarked: boolean) => {
    if (!currentUserId) return
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          user_has_bookmarked: !currentlyBookmarked,
          bookmarks_count: (p as any).bookmarks_count + (currentlyBookmarked ? -1 : 1)
        }
      }
      return p
    }))

    mutateAllFeedCaches(cachedPosts => cachedPosts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          user_has_bookmarked: !currentlyBookmarked,
          bookmarks_count: ((p as any).bookmarks_count || 0) + (currentlyBookmarked ? -1 : 1)
        }
      }
      return p
    }))

    if (currentlyBookmarked) {
      await supabase.from('bookmarks').delete().match({ post_id: postId, user_id: currentUserId })
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUserId!)
    if (!error) {
      setPosts(posts.filter(p => p.id !== postId))
      setPostToDelete(null)
    } else {
      console.error("Error deleting post:", error)
      alert("Failed to delete post.")
    }
  }

  // Advanced Action Handlers
  const handleEditSave = async (postId: string) => {
    const textContent = editContent.replace(/<[^>]*>/g, '').trim()
    if (!textContent) return

    const { error } = await supabase.from('posts').update({ 
      content: editContent
    }).eq('id', postId)

    if (!error) {
      setPosts(posts.map(p => p.id === postId ? { ...p, content: editContent } : p))
      setEditingPostId(null)
    }
  }

  const handlePinPost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').update({ is_pinned: true } as any).eq('id', postId)
      if (error) {
        console.warn("is_pinned db update bypassed (column missing). Falling back to localStorage.", error)
      }
    } catch (e) {
      console.warn("Pin db update error:", e)
    }

    localStorage.setItem(`pinned_post_${currentUserId}`, postId)
    setPinnedPostId(postId)
    setPosts(prev => {
      const updated = prev.map(p => p.id === postId ? { ...p, is_pinned: true } as any : { ...p, is_pinned: false } as any)
      return [...updated].sort((a, b) => (a.id === postId ? -1 : b.id === postId ? 1 : 0))
    })
  }

  const handleUnpinPost = async (postId: string) => {
    try {
      const { error } = await supabase.from('posts').update({ is_pinned: false } as any).eq('id', postId)
      if (error) {
        console.warn("is_pinned db unpin update bypassed.", error)
      }
    } catch (e) {
      console.warn("Unpin db update error:", e)
    }

    localStorage.removeItem(`pinned_post_${currentUserId}`)
    setPinnedPostId(null)
    setPosts(prev => {
      const updated = prev.map(p => p.id === postId ? { ...p, is_pinned: false } as any : p)
      return [...updated].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    })
  }

  const handleCopyPost = async (post: Post) => {
    try {
      const cleanText = extractCleanPlainText(post.content)
      await navigator.clipboard.writeText(cleanText)
      setCopiedPostId(post.id)
      setCopiedToast("Post text copied to clipboard! 📋")
      setTimeout(() => {
        setCopiedPostId(null)
        setOpenMenuId(null)
      }, 1000)
      setTimeout(() => {
        setCopiedToast(null)
      }, 2500)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }

  const handleCopyPostLink = async (post: Post) => {
    try {
      const postUrl = `${window.location.origin}/post/${post.id}`
      await navigator.clipboard.writeText(postUrl)
      setCopiedPostId(`link-${post.id}`)
      setCopiedToast("Post link copied to clipboard! 🔗")
      setTimeout(() => {
        setCopiedPostId(null)
        setOpenMenuId(null)
      }, 1000)
      setTimeout(() => {
        setCopiedToast(null)
      }, 2500)
    } catch (err) {
      console.error("Failed to copy link:", err)
    }
  }

  const handleSharePost = async (post: Post) => {
    const postUrl = `${window.location.origin}/post/${post.id}`
    const shareData = {
      title: `${post.profiles?.full_name || 'A user'} shared a progress update on Trackr`,
      text: extractCleanPlainText(post.content).substring(0, 100) + '...',
      url: postUrl
    }
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.warn("Share failed or cancelled:", err)
      }
    } else {
      await handleCopyPostLink(post)
    }
  }

  const handleReportSubmit = async () => {
    if (!reportPostId || !reportReason.trim() || !currentUserId) return
    
    // Simulate API call for reporting
    setTimeout(() => {
      setReportPostId(null)
      setReportReason("")
      alert("Post reported successfully. Thank you for keeping Trackr safe.")
    }, 500)
  }

  const handleBlockSubmit = async () => {
    if (!blockUser || !currentUserId) return
    
    try {
      const { error } = await supabase.from('blocks').insert({
        blocker_id: currentUserId,
        blocked_user_id: blockUser.id
      } as any)
      
      if (error) {
        console.warn("Supabase database block sync bypassed (table may be missing). falling back to local storage.", error.message || error)
      }
    } catch (e) {
      console.warn("Block database insert error:", e)
    }
    
    try {
      const storedBlocked = localStorage.getItem(`blocked_users_${currentUserId}`)
      const blocked = storedBlocked ? JSON.parse(storedBlocked) : []
      const newBlocked = Array.from(new Set([...blocked, blockUser.id]))
      localStorage.setItem(`blocked_users_${currentUserId}`, JSON.stringify(newBlocked))
    } catch (e) {
      console.warn("Failed to save blocked user to localStorage", e)
    }
    
    setHiddenUserIds(prev => Array.from(new Set([...prev, blockUser.id])))
    setBlockUser(null)
  }

  const handleMuteUser = async (userId: string) => {
    if (!currentUserId) return
    
    try {
      const { error } = await supabase.from('mutes').insert({
        muter_id: currentUserId,
        muted_user_id: userId
      } as any)
      
      if (error) {
        console.warn("Supabase database mute sync bypassed (table may be missing). falling back to local storage.", error.message || error)
      }
    } catch (e) {
      console.warn("Mute database insert error:", e)
    }
    
    try {
      const storedMuted = localStorage.getItem(`muted_users_${currentUserId}`)
      const muted = storedMuted ? JSON.parse(storedMuted) : []
      const newMuted = Array.from(new Set([...muted, userId]))
      localStorage.setItem(`muted_users_${currentUserId}`, JSON.stringify(newMuted))
    } catch (e) {
      console.warn("Failed to save muted user to localStorage", e)
    }
    
    setHiddenUserIds(prev => Array.from(new Set([...prev, userId])))
  }

  return (
    <div className={`divide-y divide-[#eff3f4] dark:divide-[#2f3336] bg-white dark:bg-[#000000] pb-28 md:pb-8 ${isJourneyMode ? 'pl-2' : ''}`}>
      {isLoading ? (
        <div className="divide-y divide-[#eff3f4] dark:divide-[#2f3336]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="px-4 py-4 animate-pulse flex gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1A1A24] shrink-0"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-16 text-[#536471] dark:text-[#71767b] text-[15px]">No progress shared yet. Be the first to post!</div>
      ) : posts
          .filter(p => !hiddenUserIds.includes(p.user_id))
          .filter((post, idx, arr) => {
            const key = post.feed_item_id || (post.is_repost ? `repost-${post.id}-${post.reposted_by?.id || ''}` : post.id)
            return arr.findIndex(p => (p.feed_item_id || (p.is_repost ? `repost-${p.id}-${p.reposted_by?.id || ''}` : p.id)) === key) === idx
          })
          .map((post, index) => {
            const postDate = new Date(post.created_at)
            const dateDisplay = postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const itemKey = post.feed_item_id || (post.is_repost ? `repost-${post.id}-${post.reposted_by?.id || index}` : `${post.id}-${index}`)

            return (
              <div key={itemKey} className={isJourneyMode ? "relative pl-[90px] md:pl-[120px]" : ""}>
                {/* Timeline UI for Journey Mode */}
                {isJourneyMode && (
                  <>
                    {/* Vertical Line */}
                    {index !== posts.length - 1 && (
                      <div className="absolute left-[7px] top-[40px] bottom-[-40px] w-px bg-gray-200 dark:bg-[#2D2B3B] z-0"></div>
                    )}
                    
                    {/* Date & Dot */}
                    <div className="absolute left-0 top-6 flex items-center gap-4 z-10">
                      <div className={`w-4 h-4 rounded-full border-[3px] border-white dark:border-[#0B0A10] shadow-sm shrink-0 ${index === 0 ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                      <span className="text-[14px] font-bold text-gray-900 dark:text-white whitespace-nowrap">{dateDisplay}</span>
                    </div>
                  </>
                )}

                <article 
                  className={`px-4 py-3.5 hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors border-b border-[#eff3f4] dark:border-[#2f3336] flex flex-col text-left w-full group/card ${isJourneyMode ? 'relative z-10' : ''}`}
                >
              {/* Repost Header Banner: Display "Username reposted" if pure repost */}
              {post.is_repost && (
                <div className="flex items-center gap-2 text-xs font-bold text-[#536471] dark:text-[#71767b] mb-1.5 ml-11">
                  <Repeat2 className="w-4 h-4 stroke-[2.3] text-emerald-500 shrink-0" />
                  <Link 
                    href={`/profile/${post.reposted_by?.id || ''}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:underline hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    {post.reposted_by?.id === currentUserId ? 'You' : (post.reposted_by?.full_name || 'Someone')} reposted
                  </Link>
                </div>
              )}

              <div className="flex gap-3 text-left w-full">
                {/* Left Column: Author Avatar */}
                <Link href={`/profile/${post.user_id}`} className="shrink-0 group mt-0.5">
                  <img 
                    src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.profiles?.full_name || 'User')}&background=7C3AED&color=fff&size=80`} 
                    className="w-10 h-10 rounded-full object-cover group-hover:opacity-90 transition-opacity" 
                    alt={post.profiles?.full_name || "Author"} 
                    width={40} 
                    height={40} 
                    loading="lazy" 
                    decoding="async" 
                  />
                </Link>

                {/* Right Column: Post Body, Header, Media, Actions */}
                <div className="flex-1 min-w-0">
                {/* Twitter-style Header Line: Name · @Handle · Time · Category */}
                <div className="flex items-center justify-between gap-1 mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    <Link 
                      href={`/profile/${post.user_id}`} 
                      className="text-[15px] sm:text-[16px] font-bold text-[#0f1419] dark:text-[#e7e9ea] hover:underline transition-colors truncate"
                    >
                      {post.profiles?.full_name || 'Anonymous User'}
                    </Link>
                    <VerifiedBadge level={getBadgeLevel(post.profiles?.consistency_score, post.profiles?.full_name)} nameOrHandle={post.profiles?.full_name} />
                    <span className="text-[14px] text-[#536471] dark:text-[#71767b] font-normal truncate">
                      {getUserHandle(post.profiles)}
                    </span>
                    <span className="text-[#536471] dark:text-[#71767b] text-[14px] font-normal">·</span>
                    <span 
                      className="text-[14px] text-[#536471] dark:text-[#71767b] font-normal hover:underline shrink-0"
                      title={formatFullDateTime(post.created_at)}
                      suppressHydrationWarning
                    >
                      {formatTimeCompact(post.created_at)}
                    </span>

                    {post.time_spent && (
                      <span className="text-[12px] font-semibold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-[#1A1A24] px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        ⏱️ {Math.floor(post.time_spent/60)}h {post.time_spent%60}m
                      </span>
                    )}
                  </div>

                  {/* Header Right: Streak & More Options */}
                  <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 shrink-0">
                    {(post.profiles?.consistency_score || 0) > 0 && (
                      <span className="text-[11px] font-bold text-orange-500 flex items-center gap-0.5 mr-1">
                        🔥{post.profiles?.consistency_score}
                      </span>
                    )}
                    
                    {(post as any).is_pinned && (
                      <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md flex items-center gap-1 mr-1">
                        <Pin className="w-3 h-3 fill-current" /> Pinned
                      </span>
                    )}
                    
                    <div className="relative post-menu-container">
                      <button 
                        onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[#536471] dark:text-[#71767b] hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 dark:hover:text-violet-400 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      
                      {openMenuId === post.id && (
                        <div className="absolute right-0 top-8 w-48 bg-white dark:bg-[#1A1A24] rounded-xl shadow-xl border border-gray-100 dark:border-[#2D2B3B] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right overflow-hidden">
                          {post.user_id === currentUserId ? (
                            <>
                              <button 
                                onClick={() => { setEditingPostId(post.id); setEditContent(post.content); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer rounded-t-lg focus:outline-none"
                              >
                                <Edit2 className="w-4 h-4 text-gray-400" /> Edit Post
                              </button>
                              {pinnedPostId === post.id ? (
                                <button 
                                  onClick={() => { handleUnpinPost(post.id); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none"
                                >
                                  <Pin className="w-4 h-4 text-violet-500 fill-violet-500" /> Unpin from Profile
                                </button>
                              ) : (
                                <button 
                                  onClick={() => { handlePinPost(post.id); setOpenMenuId(null); }}
                                  className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none"
                                >
                                  <Pin className="w-4 h-4 text-gray-400" /> Pin to Profile
                                </button>
                              )}

                              <button 
                                onClick={() => handleCopyPost(post)}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none"
                              >
                                {copiedPostId === post.id ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 text-gray-400" />
                                    <span>Copy Text</span>
                                  </>
                                )}
                              </button>

                              <button 
                                onClick={() => handleCopyPostLink(post)}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none"
                              >
                                {copiedPostId === `link-${post.id}` ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="w-4 h-4 text-gray-400" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <div className="w-full h-px bg-gray-100 dark:bg-[#2D2B3B] my-1"></div>
                              <button 
                                onClick={() => { setPostToDelete(post.id); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-[13px] font-bold text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2.5 transition-colors cursor-pointer rounded-b-lg focus:outline-none"
                              >
                                <Trash2 className="w-4 h-4" /> Delete Post
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => handleCopyPost(post)}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer rounded-t-lg focus:outline-none"
                              >
                                {copiedPostId === post.id ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 text-gray-400" />
                                    <span>Copy Text</span>
                                  </>
                                )}
                              </button>

                              <button 
                                onClick={() => handleCopyPostLink(post)}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none"
                              >
                                {copiedPostId === `link-${post.id}` ? (
                                  <>
                                    <Check className="w-4 h-4 text-emerald-500" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Link Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Link2 className="w-4 h-4 text-gray-400" />
                                    <span>Copy Link</span>
                                  </>
                                )}
                              </button>

                              <div className="w-full h-px bg-gray-100 dark:bg-[#2D2B3B] my-1"></div>

                              <button 
                                onClick={() => { setReportPostId(post.id); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none"
                              >
                                <Flag className="w-4 h-4" /> Report Post
                              </button>
                              <button 
                                onClick={() => { handleMuteUser(post.user_id); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors cursor-pointer focus:outline-none"
                              >
                                <BellOff className="w-4 h-4 text-gray-400" /> Mute User
                              </button>
                              <button 
                                onClick={() => { setBlockUser({ id: post.user_id, name: post.profiles?.full_name || 'User' }); setOpenMenuId(null); }}
                                className="w-full px-4 py-2 text-[13px] font-medium text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2.5 transition-colors cursor-pointer rounded-b-lg focus:outline-none"
                              >
                                <UserX className="w-4 h-4" /> Block User
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Embedded Hackathon / Opportunity Card */}
                {(post.content?.toLowerCase().includes('sih') || post.content?.toLowerCase().includes('smart india hackathon') || post.tags?.some((t: string) => t.toLowerCase().includes('sih') || t.toLowerCase().includes('hackathon'))) && (
                  <div className="mt-2.5 mb-3 rounded-2xl p-3.5 bg-gradient-to-r from-[#0C0A1D] via-[#1A1138] to-[#2E1854] text-white border border-violet-800/40 shadow-sm relative overflow-hidden group">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
                          <span className="text-lg select-none">💡</span>
                        </div>
                        <div>
                          <h4 className="font-bold text-[13.5px] text-white">Smart India Hackathon 2026</h4>
                          <p className="text-xs text-gray-300 flex items-center gap-1.5 mt-0.5">
                            <span>📅 Mar 1 – Apr 30, 2026</span>
                          </p>
                        </div>
                      </div>

                      <a
                        href="https://www.sih.gov.in/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-white text-gray-900 font-bold text-xs hover:bg-violet-50 transition-colors shadow-sm self-start sm:self-auto flex items-center gap-1 shrink-0"
                      >
                        <span>Register Now</span>
                        <span>→</span>
                      </a>
                    </div>
                  </div>
                )}
        
                {/* Content Section - 15-16px Typography */}
                <div className="mb-2">
                  {editingPostId === post.id ? (
                    <div className="flex flex-col gap-3">
                      <RichTextEditor 
                        value={editContent} 
                        onChange={setEditContent}
                        placeholder="Edit your progress..."
                        className="w-full p-4 text-[15px] bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2B3B] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] text-gray-900 dark:text-white feed-edit-rich-editor"
                      />
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditingPostId(null)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
                        <button onClick={() => handleEditSave(post.id)} className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[16px] leading-[1.5] text-[#0f1419] dark:text-[#e7e9ea] whitespace-pre-wrap font-normal max-w-2xl">
                      <RichTextRenderer content={post.content} />
                    </div>
                  )}
                </div>
                
                {/* Compact, Optimized Post Image Attachment (Twitter standard) */}
                {post.image_url && (
                  <div className="mt-2.5 mb-1.5 w-fit max-w-full sm:max-w-[504px]">
                    <div 
                      className="rounded-2xl overflow-hidden border border-[#eff3f4] dark:border-[#2f3336] bg-black/[0.02] dark:bg-white/[0.02] cursor-pointer hover:opacity-95 transition-all shadow-2xs group/img inline-block w-fit max-w-full" 
                      onClick={() => setPreviewImageUrl(post.image_url!)}
                    >
                      <img 
                        src={post.image_url} 
                        alt="Post attachment" 
                        className="block w-auto max-w-full h-auto max-h-[280px] sm:max-h-[320px] object-contain rounded-2xl transition-transform duration-150 group-hover/img:scale-[1.005]" 
                        loading="lazy" 
                        decoding="async" 
                      />
                    </div>
                  </div>
                )}

                {/* Embedded Quoted Post Card (if Quote Post) */}
                {(post.quoted_post || post.quoted_post_id) && (
                  <EmbeddedQuoteCard 
                    quotedPost={post.quoted_post} 
                    quotedPostId={post.quoted_post_id} 
                    onImageClick={setPreviewImageUrl} 
                  />
                )}
                  
                {/* Twitter Action Bar: Comment, Repost, Like, Bookmark, Share */}
                <div className="flex items-center justify-between pt-1.5 text-[#536471] dark:text-[#71767b] max-w-md -ml-2">
                  {/* Comment */}
                  <button 
                    onClick={() => toggleComments(post.id)} 
                    className="flex items-center gap-1.5 text-[14px] font-medium hover:text-violet-600 dark:hover:text-violet-400 group/btn transition-colors cursor-pointer"
                  >
                    <ActionTooltip label="Reply">
                      <div className="p-2 rounded-full group-hover/btn:bg-violet-50 dark:group-hover/btn:bg-violet-950/40 transition-colors">
                        <MessageCircle className="w-[19px] h-[19px]" />
                      </div>
                    </ActionTooltip>
                    <span className="text-[14px] font-medium leading-none">{(post as any).comments_count || 0}</span>
                  </button>

                  {/* Twitter/X Style Repost & Quote Button */}
                  <RepostButton
                    isReposted={Boolean(repostedPosts[post.id] || post.user_has_reposted)}
                    repostsCount={Math.max(
                      0,
                      (post.reposts_count || 0) + 
                      (repostedPosts[post.id] && !post.user_has_reposted ? 1 : 0) - 
                      (!repostedPosts[post.id] && post.user_has_reposted ? 1 : 0)
                    )}
                    isOwnPost={post.user_id === currentUserId}
                    onRepost={() => handleRepost(post)}
                    onUndoRepost={() => handleUndoRepost(post)}
                    onQuote={() => handleOpenQuote(post)}
                  />

                  {/* Like */}
                  <LikeButton
                    isLiked={Boolean(post.user_has_liked)}
                    likesCount={(post as any).likes_count || 0}
                    onToggle={() => toggleLike(post.id, post.user_has_liked || false)}
                  />

                  {/* Bookmark / Save */}
                  <button 
                    onClick={() => toggleBookmark(post.id, post.user_has_bookmarked || false)} 
                    className={`flex items-center gap-1.5 text-[14px] font-medium hover:text-violet-600 dark:hover:text-violet-400 group/btn transition-colors cursor-pointer ${
                      post.user_has_bookmarked ? 'text-violet-600 dark:text-violet-400' : ''
                    }`}
                  >
                    <ActionTooltip label={post.user_has_bookmarked ? 'Saved' : 'Save'}>
                      <div className="p-2 rounded-full group-hover/btn:bg-violet-50 dark:group-hover/btn:bg-violet-950/40 transition-colors">
                        <Bookmark className={`w-[19px] h-[19px] ${post.user_has_bookmarked ? 'fill-current' : ''}`} />
                      </div>
                    </ActionTooltip>
                  </button>

                  {/* Share */}
                  <button 
                    onClick={() => handleSharePost(post)} 
                    className="flex items-center gap-1.5 text-[14px] font-medium hover:text-violet-600 dark:hover:text-violet-400 group/btn transition-colors cursor-pointer"
                  >
                    <ActionTooltip label="Share">
                      <div className="p-2 rounded-full group-hover/btn:bg-violet-50 dark:group-hover/btn:bg-violet-950/40 transition-colors">
                        <Share2 className="w-[19px] h-[19px]" />
                      </div>
                    </ActionTooltip>
                  </button>

                  {/* Delete */}
                  {post.user_id === currentUserId && (
                    <button 
                      onClick={() => setPostToDelete(post.id)} 
                      className="flex items-center gap-1 text-[13px] hover:text-red-500 group/btn transition-colors cursor-pointer"
                    >
                      <ActionTooltip label="Delete">
                        <div className="p-2 rounded-full group-hover/btn:bg-red-50 dark:group-hover/btn:bg-red-950/40 transition-colors">
                          <Trash2 className="w-[18px] h-[18px]" />
                        </div>
                      </ActionTooltip>
                    </button>
                  )}
                </div>

          {/* Comments Section */}
            {expandedComments[post.id] && (
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-[#2D2B3B] flex flex-col gap-4 transition-colors">
                {/* Comment List */}
                <div className="flex flex-col gap-3">
                  {isLoadingComments[post.id] ? (
                    <div className="flex justify-center p-4">
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (postComments[post.id] || []).length === 0 ? (
                    <p className="text-[13px] text-[#536471] dark:text-[#71767b]">No comments yet. Start the conversation!</p>
                  ) : (
                    postComments[post.id].map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <img src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(comment.profiles?.full_name || 'User')}&background=7C3AED&color=fff&size=80`} className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5" alt="" width={32} height={32} loading="lazy" decoding="async" />
                        <div className="bg-gray-50 dark:bg-[#1A1A24] rounded-2xl rounded-tl-none px-4 py-2.5 flex-1 transition-colors">
                          <p className="text-[14px] font-bold text-[#0f1419] dark:text-[#e7e9ea] mb-0.5 flex items-center gap-1.5 flex-wrap">
                            <span>{comment.profiles?.full_name}</span>
                            <VerifiedBadge level={getBadgeLevel(comment.profiles?.consistency_score, comment.profiles?.full_name)} nameOrHandle={comment.profiles?.full_name} />
                            {(comment as any).created_at && (
                              <>
                                <span className="text-[#536471] dark:text-[#71767b] text-[12px] font-normal">·</span>
                                <span 
                                  className="text-[12px] text-[#536471] dark:text-[#71767b] font-normal hover:underline"
                                  title={formatFullDateTime((comment as any).created_at)}
                                  suppressHydrationWarning
                                >
                                  {formatTimeCompact((comment as any).created_at)}
                                </span>
                              </>
                            )}
                          </p>
                          <div className="text-[14.5px] font-normal leading-[1.5] text-[#0f1419] dark:text-[#e7e9ea]">
                            <RichTextRenderer content={comment.content} />
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment Input */}
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="text" 
                    value={commentTexts[post.id] || ""}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                    placeholder="Write a comment..." 
                    className="flex-1 bg-gray-50 dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] text-gray-900 dark:text-white dark:placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                  <button 
                    onClick={() => submitComment(post.id)}
                    disabled={!commentTexts[post.id]?.trim()}
                    className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center disabled:opacity-50 hover:bg-violet-200 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        </article>
        </div>
      )})}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-[360px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">Delete Post?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed relative z-10">
              This action cannot be undone. Are you sure you want to permanently delete this post?
            </p>
            <div className="flex gap-3 w-full relative z-10">
              <button 
                onClick={() => setPostToDelete(null)} 
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#2D2B3B] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#2D2B3B] transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={() => deletePost(postToDelete)} 
                className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-sm active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
            
            {/* Subtle red background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-red-500/5 blur-[80px] rounded-full pointer-events-none"></div>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportPostId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-[400px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-2">
              <Flag className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Report Post</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Please provide a reason for reporting this post. Our moderation team will review it shortly.
            </p>
            <textarea 
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g., Spam, Harassment, Inappropriate content..."
              className="w-full p-4 text-[15px] bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] resize-none mb-6 text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => { setReportPostId(null); setReportReason(""); }} 
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#2D2B3B] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#2D2B3B] transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleReportSubmit} 
                disabled={!reportReason.trim()}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white font-bold transition-colors shadow-sm active:scale-[0.98]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {blockUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-[360px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Block {blockUser.name}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              They will not be able to interact with you, and their posts will be completely hidden from your feed immediately.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setBlockUser(null)} 
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#2D2B3B] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#2D2B3B] transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockSubmit} 
                className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-sm active:scale-[0.98]"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-Screen Image Preview Modal */}
      <ImagePreviewModal
        imageUrl={previewImageUrl}
        isOpen={!!previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />

      {/* Quote Composer Modal */}
      <QuoteModal
        open={isQuoteModalOpen}
        onOpenChange={setIsQuoteModalOpen}
        targetPost={quoteTargetPost}
        user={{ id: currentUserId }}
        profile={{ id: currentUserId, full_name: 'You' }}
        onSuccess={() => {
          if (quoteTargetPost) {
            setPosts(prev => prev.map(p => {
              if (p.id === quoteTargetPost.id) {
                return {
                  ...p,
                  reposts_count: ((p as any).reposts_count || 0) + 1
                }
              }
              return p
            }))
          }
        }}
      />

      {/* Floating Copied Toast Notification */}
      {copiedToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#0f1419] dark:bg-white text-white dark:text-[#0f1419] px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{copiedToast}</span>
        </div>
      )}
    </div>
  )
}

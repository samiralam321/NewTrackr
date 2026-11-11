import { createClient } from "@/lib/supabase/client"
import { getCacheEntry, setCacheEntry, dedupeFetch } from "@/lib/cache/client-cache"

export type NotificationActor = {
  id: string
  full_name: string
  username?: string | null
  avatar_url: string | null
  consistency_score?: number
}

export type PostSnippet = {
  id: string
  content: string
  image_url: string | null
  user_id?: string
}

export type GroupedNotification = {
  id: string
  raw_ids: string[]
  type: 'like' | 'comment' | 'follow' | 'mention' | 'badge' | 'repost' | 'quote'
  user_id: string
  post_id?: string | null
  actors: NotificationActor[]
  total_actors_count: number
  latest_created_at: string
  is_read: boolean
  post?: PostSnippet | null
  badge_level?: number | null
}

// Backward-compatible alias
export type Notification = GroupedNotification

export const NOTIFS_CACHE_KEY = 'user_notifications_cache'
const NOTIFS_STORAGE_KEY_PREFIX = 'trackr_notifications_'

/**
 * Clean plain-text snippet from post content (stripping HTML tags like <b>, <div>, <br>, markdown code blocks, entities, and excess whitespace)
 */
export function cleanPostSnippet(content?: string | null): string {
  if (!content) return ''
  return content
    // 1. Remove markdown code blocks and inline backticks
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // 2. Remove CSS/JS comments if present
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    // 3. Convert HTML line breaks and closing block tags to spaces to prevent word merging
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(div|p|h[1-6]|li|blockquote|section|article)>/gi, ' ')
    // 4. Strip all remaining HTML tags (e.g. <b>, </b>, <div>, <span>, <strong>)
    .replace(/<[^>]+>/g, '')
    // 5. Decode common HTML entities
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&nbsp;/gi, ' ')
    // 6. Normalize multiple spaces and line breaks
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Safe avatar image fallback generator
 */
export function getFallbackAvatar(name?: string | null, seed?: string): string {
  const safeName = encodeURIComponent(name && name.trim() ? name.trim() : 'User')
  return `https://ui-avatars.com/api/?name=${safeName}&background=7C3AED&color=fff&size=80`
}

/**
 * Format human-readable grouped notification headline
 */
export function formatGroupedNotificationText(n: GroupedNotification): {
  headline: string
  primaryActorName: string
  secondaryActorName?: string
  othersCount: number
} {
  const count = n.total_actors_count || n.actors.length || 1
  const actor1 = n.actors[0]?.full_name || 'Someone'
  const actor2 = n.actors[1]?.full_name || 'Someone'
  const othersCount = Math.max(0, count - 2)
  const remainingNoun = othersCount === 1 ? 'other' : 'others'

  let headline = ''
  switch (n.type) {
    case 'like': {
      if (count === 1) headline = `${actor1} liked your post`
      else if (count === 2) headline = `${actor1} and ${actor2} liked your post`
      else headline = `${actor1}, ${actor2} and ${othersCount} ${remainingNoun} liked your post`
      break
    }
    case 'follow': {
      if (count === 1) headline = `${actor1} started following you`
      else if (count === 2) headline = `${actor1} and ${actor2} started following you`
      else headline = `${actor1}, ${actor2} and ${othersCount} ${remainingNoun} started following you`
      break
    }
    case 'repost': {
      if (count === 1) headline = `${actor1} reposted your post`
      else if (count === 2) headline = `${actor1} and ${actor2} reposted your post`
      else headline = `${actor1}, ${actor2} and ${othersCount} ${remainingNoun} reposted your post`
      break
    }
    case 'comment':
      headline = `${actor1} commented on your post`
      break
    case 'mention':
      headline = `${actor1} mentioned you`
      break
    case 'quote':
      headline = `${actor1} quoted your post`
      break
    case 'badge':
      headline = `You earned a verification badge!`
      break
    default:
      headline = `New notification from ${actor1}`
  }

  return {
    headline,
    primaryActorName: actor1,
    secondaryActorName: count >= 2 ? actor2 : undefined,
    othersCount
  }
}

/**
 * Pure aggregation function mapping raw database notification records into grouped notification models
 */
export function aggregateNotificationsFromRaw(
  rawList: any[],
  postMap?: Map<string, PostSnippet>,
  activeLikesMap?: Record<string, NotificationActor[]>,
  activeFollowers?: NotificationActor[]
): GroupedNotification[] {
  const groups: GroupedNotification[] = []
  const groupMap = new Map<string, GroupedNotification>()

  for (const item of rawList) {
    let groupKey: string
    if (item.type === 'like' && item.post_id) {
      groupKey = `like:${item.post_id}`
    } else if (item.type === 'follow') {
      groupKey = `follow:batch`
    } else if (item.type === 'repost' && item.post_id) {
      groupKey = `repost:${item.post_id}`
    } else {
      groupKey = `single:${item.id}`
    }

    const actor: NotificationActor = {
      id: item.actor_id,
      full_name: item.actor?.full_name || 'Someone',
      username: item.actor?.username || null,
      avatar_url: item.actor?.avatar_url || null,
      consistency_score: item.actor?.consistency_score || 0
    }

    const existing = groupMap.get(groupKey)
    if (!existing) {
      const postSnippet = item.post_id && postMap ? postMap.get(item.post_id) || null : null
      const newGroup: GroupedNotification = {
        id: groupKey.startsWith('single:') ? item.id : `group-${groupKey}`,
        raw_ids: [item.id],
        type: item.type,
        user_id: item.user_id,
        post_id: item.post_id || null,
        actors: [actor],
        total_actors_count: 1,
        latest_created_at: item.created_at,
        is_read: item.is_read,
        post: postSnippet,
        badge_level: item.badge_level
      }
      groupMap.set(groupKey, newGroup)
      groups.push(newGroup)
    } else {
      existing.raw_ids.push(item.id)
      if (!item.is_read) {
        existing.is_read = false
      }

      const alreadyHasActor = existing.actors.some(a => a.id === actor.id)
      if (!alreadyHasActor) {
        if (existing.actors.length < 10) {
          existing.actors.push(actor)
        }
        existing.total_actors_count += 1
      }

      if (new Date(item.created_at) > new Date(existing.latest_created_at)) {
        existing.latest_created_at = item.created_at
      }
    }
  }

  // Cross-reference with real active database records for exact liker counts and profile pictures
  for (const group of groups) {
    if (group.type === 'like' && group.post_id && activeLikesMap && activeLikesMap[group.post_id]) {
      const activeList = activeLikesMap[group.post_id]
      if (activeList.length > 0) {
        group.total_actors_count = activeList.length
        group.actors = activeList.slice(0, 10)
      }
    } else if (group.type === 'follow' && activeFollowers && activeFollowers.length > 0) {
      group.total_actors_count = activeFollowers.length
      group.actors = activeFollowers.slice(0, 10)
    }
  }

  return groups.sort(
    (a, b) => new Date(b.latest_created_at).getTime() - new Date(a.latest_created_at).getTime()
  )
}

/**
 * Instantly retrieves cached grouped notifications from memory or sessionStorage/localStorage (0ms latency).
 */
export function getCachedNotifications(userId?: string | null): GroupedNotification[] | null {
  if (typeof window === 'undefined') return null

  // 1. Check in-memory SWR cache (max 2 minutes fresh)
  const memory = getCacheEntry<GroupedNotification[]>(NOTIFS_CACHE_KEY, 120_000, userId)
  if (memory?.data && memory.data.length > 0) {
    return memory.data
  }

  // 2. Check persistent browser storage for instant recovery on page load
  try {
    const key = userId ? `${NOTIFS_STORAGE_KEY_PREFIX}${userId}` : NOTIFS_STORAGE_KEY_PREFIX
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length > 0) {
        setCacheEntry(NOTIFS_CACHE_KEY, parsed, userId)
        return parsed
      }
    }
  } catch {}

  return null
}

/**
 * Saves grouped notifications to both memory cache and persistent browser storage.
 */
export function saveCachedNotifications(data: GroupedNotification[], userId?: string | null): void {
  if (typeof window === 'undefined') return

  setCacheEntry(NOTIFS_CACHE_KEY, data, userId)

  try {
    const key = userId ? `${NOTIFS_STORAGE_KEY_PREFIX}${userId}` : NOTIFS_STORAGE_KEY_PREFIX
    const serialized = JSON.stringify(data.slice(0, 40))
    sessionStorage.setItem(key, serialized)
    localStorage.setItem(key, serialized)
  } catch {}
}

/**
 * High-performance fetcher with session caching and request deduplication.
 */
export async function fetchNotifications(
  userId?: string | null
): Promise<{ data: GroupedNotification[]; userId: string; unreadCount: number } | null> {
  const supabase = createClient()

  let targetUserId = userId
  if (!targetUserId) {
    const { data: sessionData } = await supabase.auth.getSession()
    targetUserId = sessionData.session?.user?.id
  }
  if (!targetUserId) {
    const { data: userData } = await supabase.auth.getUser()
    targetUserId = userData.user?.id
  }
  if (!targetUserId) return null

  const dedupeKey = `fetch_notifications_${targetUserId}`

  return dedupeFetch(dedupeKey, async () => {
    // 1. Try our dedicated server-side aggregation API route
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.ok) {
        const json = await res.json()
        if (json.success && Array.isArray(json.data)) {
          saveCachedNotifications(json.data, targetUserId)
          return {
            data: json.data as GroupedNotification[],
            userId: targetUserId,
            unreadCount: json.unreadCount ?? json.data.filter((n: any) => !n.is_read).length
          }
        }
      }
    } catch (apiErr) {
      console.warn('API /api/notifications error, falling back to direct client Supabase query:', apiErr)
    }

    // 2. Direct client fallback with local aggregation if offline or API unavailable
    const { data: rawData, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        actor_id,
        type,
        post_id,
        is_read,
        created_at,
        actor:profiles!notifications_actor_id_fkey(id, full_name, username, avatar_url, consistency_score)
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(60)

    if (error || !rawData) {
      return null
    }

    // Batch fetch referenced posts
    const postIds = Array.from(new Set(rawData.map((n: any) => n.post_id).filter(Boolean))) as string[]
    const postMap = new Map<string, PostSnippet>()
    if (postIds.length > 0) {
      try {
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, content, image_url, user_id')
          .in('id', postIds)
        if (postsData) postsData.forEach((p: any) => postMap.set(p.id, p))
      } catch (e) {}
    }

    const grouped = aggregateNotificationsFromRaw(rawData, postMap)
    saveCachedNotifications(grouped, targetUserId)
    return {
      data: grouped,
      userId: targetUserId,
      unreadCount: grouped.filter(g => !g.is_read).length
    }
  })
}

/**
 * Background prefetcher to warm up notifications before the user even clicks.
 */
export function prefetchNotifications(userId?: string | null): void {
  if (typeof window === 'undefined') return
  fetchNotifications(userId).catch(() => {})
}

/**
 * Non-blocking fire-and-forget update to mark notification IDs as read.
 */
export function markNotificationsAsRead(rawIds: string[]): void {
  if (!rawIds || rawIds.length === 0) return

  // 1. Call server API
  fetch('/api/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ notificationIds: rawIds })
  }).catch(() => {
    // Direct client fallback
    const supabase = createClient()
    supabase.from('notifications').update({ is_read: true }).in('id', rawIds).then(() => {}, () => {})
  })
}

/**
 * Mark all notifications as read for current user
 */
export async function markAllNotificationsAsRead(userId?: string | null): Promise<void> {
  try {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ all: true })
    })
  } catch {
    if (userId) {
      const supabase = createClient()
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId)
    }
  }
}

/**
 * Intelligently merges a live incoming real-time notification into the existing grouped list.
 * Zero layout stutter, instant visual response.
 */
export function mergeRealtimeNotification(
  current: GroupedNotification[],
  incoming: any,
  actorProfile?: NotificationActor,
  postSnippet?: PostSnippet
): GroupedNotification[] {
  if (!incoming) return current

  const actor: NotificationActor = actorProfile || {
    id: incoming.actor_id,
    full_name: 'Someone',
    username: null,
    avatar_url: null,
    consistency_score: 0
  }

  // 1. Group like notifications on the same post
  if (incoming.type === 'like' && incoming.post_id) {
    const existingIndex = current.findIndex(g => g.type === 'like' && g.post_id === incoming.post_id)
    if (existingIndex >= 0) {
      const existing = current[existingIndex]
      const nextRawIds = Array.from(new Set([incoming.id, ...existing.raw_ids]))
      const nextActors = [actor, ...existing.actors.filter(a => a.id !== actor.id)].slice(0, 10)
      const isNewActor = !existing.actors.some(a => a.id === actor.id)
      const nextCount = isNewActor ? existing.total_actors_count + 1 : existing.total_actors_count

      const updatedGroup: GroupedNotification = {
        ...existing,
        raw_ids: nextRawIds,
        actors: nextActors,
        total_actors_count: nextCount,
        latest_created_at: incoming.created_at || new Date().toISOString(),
        is_read: false,
        post: existing.post || postSnippet || null
      }

      // Move updated group to top
      const filtered = current.filter((_, idx) => idx !== existingIndex)
      return [updatedGroup, ...filtered]
    }
  }

  // 2. Group follow notifications
  if (incoming.type === 'follow') {
    const existingIndex = current.findIndex(g => g.type === 'follow')
    if (existingIndex >= 0) {
      const existing = current[existingIndex]
      const nextRawIds = Array.from(new Set([incoming.id, ...existing.raw_ids]))
      const nextActors = [actor, ...existing.actors.filter(a => a.id !== actor.id)].slice(0, 10)
      const isNewActor = !existing.actors.some(a => a.id === actor.id)

      const updatedGroup: GroupedNotification = {
        ...existing,
        raw_ids: nextRawIds,
        actors: nextActors,
        total_actors_count: isNewActor ? existing.total_actors_count + 1 : existing.total_actors_count,
        latest_created_at: incoming.created_at || new Date().toISOString(),
        is_read: false
      }

      const filtered = current.filter((_, idx) => idx !== existingIndex)
      return [updatedGroup, ...filtered]
    }
  }

  // 3. Standalone notification
  const newGroup: GroupedNotification = {
    id: incoming.id,
    raw_ids: [incoming.id],
    type: incoming.type,
    user_id: incoming.user_id,
    post_id: incoming.post_id || null,
    actors: [actor],
    total_actors_count: 1,
    latest_created_at: incoming.created_at || new Date().toISOString(),
    is_read: false,
    post: postSnippet || null
  }

  return [newGroup, ...current]
}

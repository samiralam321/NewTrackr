import { createClient } from "@/lib/supabase/client"
import { getCacheEntry, setCacheEntry, dedupeFetch } from "@/lib/cache/client-cache"

export type Notification = {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'badge' | 'repost' | 'quote'
  post_id?: string
  is_read: boolean
  created_at: string
  actor: {
    full_name: string
    avatar_url: string
    consistency_score?: number
  }
}

export const NOTIFS_CACHE_KEY = 'user_notifications_cache'
const NOTIFS_STORAGE_KEY_PREFIX = 'trackr_notifications_'

/**
 * Instantly retrieves cached notifications from memory or sessionStorage/localStorage.
 * Synchronous (0ms latency).
 */
export function getCachedNotifications(userId?: string | null): Notification[] | null {
  if (typeof window === 'undefined') return null

  // 1. Check in-memory SWR cache (max 2 minutes fresh)
  const memory = getCacheEntry<Notification[]>(NOTIFS_CACHE_KEY, 120_000, userId)
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
 * Saves notifications to both memory cache and persistent browser storage.
 */
export function saveCachedNotifications(data: Notification[], userId?: string | null): void {
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
 * Avoids the slow network round-trip of `supabase.auth.getUser()`.
 */
export async function fetchNotifications(userId?: string | null): Promise<{ data: Notification[]; userId: string } | null> {
  const supabase = createClient()

  // 1. Resolve userId quickly from local session storage
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
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        id,
        user_id,
        actor_id,
        type,
        post_id,
        is_read,
        created_at,
        actor:profiles!notifications_actor_id_fkey(full_name, avatar_url, consistency_score)
      `)
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(40)

    if (error || !data) {
      return null
    }

    const typedData = data as unknown as Notification[]
    saveCachedNotifications(typedData, targetUserId)
    return { data: typedData, userId: targetUserId }
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
 * Non-blocking fire-and-forget update to mark notifications as read.
 */
export function markNotificationsAsRead(unreadIds: string[]): void {
  if (!unreadIds || unreadIds.length === 0) return
  const supabase = createClient()
  supabase
    .from('notifications')
    .update({ is_read: true })
    .in('id', unreadIds)
    .then(
      () => {},
      () => {}
    )
}

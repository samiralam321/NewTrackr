/**
 * High-performance, user-isolated client-side memory cache with Stale-While-Revalidate (SWR) support.
 * Zero external dependencies.
 */

interface CacheRecord<T> {
  data: T
  timestamp: number
  userId?: string | null
}

const memoryStore = new Map<string, CacheRecord<any>>()
const inFlightPromises = new Map<string, Promise<any>>()

/**
 * Retrieves cached data with stale status check.
 * Strictly verifies userId matching to prevent data leakage between different accounts.
 */
export function getCacheEntry<T>(
  key: string,
  maxAgeMs: number = 60_000,
  currentUserId?: string | null
): { data: T; isStale: boolean } | null {
  const record = memoryStore.get(key)
  if (!record) return null

  // Ensure cache isolation by user ID when a userId is expected
  if (record.userId !== undefined && currentUserId !== undefined && record.userId !== currentUserId) {
    return null
  }

  const age = Date.now() - record.timestamp
  const isStale = age > maxAgeMs

  return {
    data: record.data as T,
    isStale
  }
}

/**
 * Stores data in the client-side memory cache.
 */
export function setCacheEntry<T>(
  key: string,
  data: T,
  currentUserId?: string | null
): void {
  memoryStore.set(key, {
    data,
    timestamp: Date.now(),
    userId: currentUserId ?? null
  })

  // Prevent memory leaks by capping store size
  if (memoryStore.size > 300) {
    const oldest = memoryStore.keys().next().value
    if (oldest) memoryStore.delete(oldest)
  }
}

/**
 * Mutates a specific cache entry (e.g. For optimistic updates)
 */
export function mutateCacheEntry<T>(key: string, mutator: (current: T) => T): void {
  const existing = memoryStore.get(key)
  if (!existing) return
  memoryStore.set(key, {
    ...existing,
    data: mutator(existing.data)
  })
}

/**
 * Mutates all cached feeds (for instance when a like, bookmark or repost is toggled)
 */
export function mutateAllFeedCaches(mutator: (posts: any[]) => any[]): void {
  for (const [key, record] of memoryStore.entries()) {
    if (key.startsWith('feed_') && Array.isArray(record.data)) {
      memoryStore.set(key, {
        ...record,
        data: mutator(record.data)
      })
    }
  }
}

/**
 * Request deduplicator: ensures concurrent identical network requests
 * reuse the single in-flight Promise instead of dispatching duplicate calls.
 */
export async function dedupeFetch<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inFlightPromises.get(key)
  if (existing) {
    return existing as Promise<T>
  }

  const promise = fetcher().finally(() => {
    inFlightPromises.delete(key)
  })

  inFlightPromises.set(key, promise)
  return promise
}

/**
 * Invalidate matching keys by prefix.
 */
export function invalidateCache(prefix: string): void {
  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key)
    }
  }
}

/**
 * Completely clears all client-side cached data on user logout or session switch.
 */
export function clearTrackrClientCaches(): void {
  memoryStore.clear()
  inFlightPromises.clear()
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.clear()
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i)
        if (k && k.startsWith('trackr_notifications_')) {
          keysToRemove.push(k)
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k))
    } catch {}
  }
}

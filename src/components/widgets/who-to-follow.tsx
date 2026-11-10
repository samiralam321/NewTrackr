'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getBadgeLevel } from "@/lib/utils/streak"
import { getUserHandle } from "@/lib/utils/user"
import { getCacheEntry, setCacheEntry, mutateCacheEntry } from "@/lib/cache/client-cache"

interface ProfileUser {
  id: string
  full_name: string | null
  avatar_url: string | null
  consistency_score?: number | null
  college?: string | null
}

interface WhoToFollowCacheData {
  users: ProfileUser[]
  followingMap: Record<string, boolean>
}

export const SAMIR_PINNED_USER_ID = '149304fc-ee0a-4980-83ed-9ed88cf48d6d'

const SAMIR_DEFAULT_PROFILE: ProfileUser = {
  id: SAMIR_PINNED_USER_ID,
  full_name: 'Samir Alam',
  avatar_url: 'https://bsqqdfkdycziocmgiani.supabase.co/storage/v1/object/public/avatars/149304fc-ee0a-4980-83ed-9ed88cf48d6d-0.8075707230184318.jpeg',
  consistency_score: 1,
  college: 'IKG PTU'
}

const CACHE_KEY_PREFIX = 'who_to_follow_v3_'
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export function WhoToFollow({ currentUserId }: { currentUserId?: string }) {
  const cacheKey = `${CACHE_KEY_PREFIX}${currentUserId || 'anon'}`

  // Initialize synchronously from in-memory cache if available (0ms render)
  const [users, setUsers] = useState<ProfileUser[]>(() => {
    const cached = getCacheEntry<WhoToFollowCacheData>(cacheKey, CACHE_TTL_MS, currentUserId)
    if (cached?.data?.users && cached.data.users.length > 0) {
      return cached.data.users
    }
    return [SAMIR_DEFAULT_PROFILE]
  })
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>(() => {
    const cached = getCacheEntry<WhoToFollowCacheData>(cacheKey, CACHE_TTL_MS, currentUserId)
    return cached?.data?.followingMap || {}
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCacheEntry<WhoToFollowCacheData>(cacheKey, CACHE_TTL_MS, currentUserId)
    return !cached
  })
  const supabase = createClient()

  useEffect(() => {
    async function loadWhoToFollow() {
      const cached = getCacheEntry<WhoToFollowCacheData>(cacheKey, CACHE_TTL_MS, currentUserId)
      if (cached && !cached.isStale && cached.data?.users?.[0]?.id === SAMIR_PINNED_USER_ID) {
        // Cache is fresh, avoid unnecessary network roundtrips
        return
      }

      try {
        if (!cached) {
          setLoading(true)
        }

        // 1. Fetch current user followings if logged in
        let followingIds: string[] = []
        const initialMap: Record<string, boolean> = {}

        if (currentUserId) {
          const { data: followRows } = await supabase
            .from('follows')
            .select('following_id')
            .eq('follower_id', currentUserId)
          followingIds = followRows?.map(r => r.following_id) || []
          
          followingIds.forEach(id => {
            initialMap[id] = true
          })
          setFollowingMap(initialMap)
        }

        // 2. Fetch Samir Alam's profile and top other active profiles concurrently
        const [samirRes, othersRes] = await Promise.all([
          supabase
            .from('profiles')
            .select('id, full_name, avatar_url, consistency_score, college')
            .eq('id', SAMIR_PINNED_USER_ID)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('id, full_name, avatar_url, consistency_score, college')
            .not('full_name', 'is', null)
            .neq('id', SAMIR_PINNED_USER_ID)
            .order('consistency_score', { ascending: false })
            .limit(10)
        ])

        const samirProfile: ProfileUser = samirRes.data || SAMIR_DEFAULT_PROFILE
        const otherProfiles: ProfileUser[] = othersRes.data || []

        // Prioritize users not yet followed among others, then take top active
        const notFollowed = otherProfiles.filter(p => !followingIds.includes(p.id))
        const alreadyFollowed = otherProfiles.filter(p => followingIds.includes(p.id))
        const sortedOthers = [...notFollowed, ...alreadyFollowed]

        // Samir Alam is always placed at the very TOP (#1)
        const finalList: ProfileUser[] = [samirProfile]
        for (const p of sortedOthers) {
          if (finalList.length >= 5) break
          if (p.id !== SAMIR_PINNED_USER_ID) {
            finalList.push(p)
          }
        }

        setUsers(finalList)

        // Save to client cache
        setCacheEntry<WhoToFollowCacheData>(
          cacheKey,
          { users: finalList, followingMap: initialMap },
          currentUserId
        )
      } catch (err) {
        console.error("Error loading who to follow:", err)
      } finally {
        setLoading(false)
      }
    }

    loadWhoToFollow()
  }, [currentUserId, cacheKey])

  const handleToggleFollow = async (targetUserId: string) => {
    if (!currentUserId) {
      window.location.href = '/login'
      return
    }

    if (targetUserId === currentUserId) return

    const isCurrentlyFollowing = !!followingMap[targetUserId]
    const nextFollowingState = !isCurrentlyFollowing

    // Optimistic UI update
    setFollowingMap(prev => {
      const next = { ...prev, [targetUserId]: nextFollowingState }
      mutateCacheEntry<WhoToFollowCacheData>(cacheKey, current => ({
        ...current,
        followingMap: next
      }))
      return next
    })

    try {
      if (isCurrentlyFollowing) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', currentUserId)
          .eq('following_id', targetUserId)
      } else {
        // Follow
        await supabase
          .from('follows')
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId
          })

        // Also create follow notification
        try {
          await supabase
            .from('notifications')
            .insert({
              user_id: targetUserId,
              actor_id: currentUserId,
              type: 'follow',
              is_read: false
            })
        } catch (notifErr) {
          // notification ignore if blocked
        }
      }
    } catch (err) {
      console.error("Failed to toggle follow:", err)
      // Rollback optimistic update
      setFollowingMap(prev => {
        const rollback = { ...prev, [targetUserId]: isCurrentlyFollowing }
        mutateCacheEntry<WhoToFollowCacheData>(cacheKey, current => ({
          ...current,
          followingMap: rollback
        }))
        return rollback
      })
    }
  }

  if (loading && users.length === 0) {
    return (
      <div className="bg-[#f7f9f9] dark:bg-[#16181c] border border-[#eff3f4] dark:border-[#2f3336] rounded-2xl p-4 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800"></div>
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
                <div className="h-2.5 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (users.length === 0) return null

  return (
    <div className="bg-[#f7f9f9] dark:bg-[#16181c] border border-[#eff3f4] dark:border-[#2f3336] rounded-2xl overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
        <h3 className="text-[17px] font-extrabold text-[#0f1419] dark:text-[#e7e9ea]">
          Who to follow
        </h3>
      </div>

      {/* Top 5 most active users list (Samir Alam pinned at #1) */}
      <div>
        {users.map((user) => {
          const isFollowing = !!followingMap[user.id]
          const isSelf = currentUserId === user.id
          const handle = getUserHandle(user.full_name)
          const badgeLevel = getBadgeLevel(user.consistency_score)
          const streak = user.consistency_score || 0

          return (
            <div
              key={user.id}
              className="px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors flex items-center justify-between group"
            >
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-3 min-w-0 flex-1 mr-2"
              >
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=7C3AED&color=fff&size=80`}
                  alt={user.full_name || "User"}
                  width={40}
                  height={40}
                  loading="lazy"
                  decoding="async"
                  className="w-10 h-10 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-[14.5px] font-bold text-[#0f1419] dark:text-[#e7e9ea] truncate group-hover:underline">
                      {user.full_name || "Student"}
                    </p>
                    <VerifiedBadge level={badgeLevel} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[13px] text-[#536471] dark:text-[#71767b] font-normal truncate">
                      {handle}
                    </p>
                    {streak > 0 && (
                      <span className="text-[11px] font-bold text-orange-500 dark:text-orange-400 flex items-center gap-0.5 shrink-0">
                        🔥{streak}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Follow Button or You Tag */}
              {isSelf ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200/60 dark:border-purple-800/40 select-none">
                  You
                </span>
              ) : (
                <button
                  onClick={() => handleToggleFollow(user.id)}
                  className={`px-4 py-1.5 text-[13px] font-bold rounded-full transition-all shrink-0 select-none ${
                    isFollowing
                      ? "bg-transparent text-[#0f1419] dark:text-[#e7e9ea] border border-[#cfd9de] dark:border-[#536471] hover:border-red-500 hover:text-red-600 hover:bg-red-500/10"
                      : "bg-[#0f1419] text-white dark:bg-[#eff3f4] dark:text-[#0f1419] hover:bg-[#272c30] dark:hover:bg-[#d7dbdc]"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer / Show more */}
      <Link
        href="/explore"
        className="px-4 py-3.5 text-[14px] font-medium text-[#7C3AED] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] block transition-colors border-t border-[#eff3f4] dark:border-[#2f3336]/60"
      >
        Show more
      </Link>
    </div>
  )
}

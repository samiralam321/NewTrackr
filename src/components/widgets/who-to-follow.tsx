'use client'

import { useState, useEffect } from "react"
import Link from "next/link"
import { Users } from "lucide-react"
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
      <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-sm animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-gray-800"></div>
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
    <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-sm transition-colors">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-600 dark:text-violet-400" />
          <h3 className="text-[14.5px] font-bold text-gray-900 dark:text-white">Most Active</h3>
        </div>
        <Link
          href="/explore"
          className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 transition-colors flex items-center gap-0.5"
        >
          See all →
        </Link>
      </div>

      {/* Top 5 most active users list */}
      <div className="space-y-3">
        {users.map((user) => {
          const isFollowing = !!followingMap[user.id]
          const isSelf = currentUserId === user.id
          const handle = getUserHandle(user.full_name)
          const badgeLevel = getBadgeLevel(user.consistency_score)
          const streak = user.consistency_score || 0

          return (
            <div
              key={user.id}
              className="flex items-center justify-between group p-1 -mx-1 rounded-xl hover:bg-gray-50/80 dark:hover:bg-[#1A1A24]/60 transition-colors"
            >
              <Link
                href={`/profile/${user.id}`}
                className="flex items-center gap-2.5 min-w-0 flex-1 mr-2"
              >
                <img
                  src={user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || 'User')}&background=7C3AED&color=fff&size=80`}
                  alt={user.full_name || "User"}
                  width={36}
                  height={36}
                  loading="lazy"
                  decoding="async"
                  className="w-9 h-9 rounded-full object-cover shrink-0 border border-gray-100 dark:border-gray-800"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="text-[13.5px] font-semibold text-gray-900 dark:text-gray-100 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors truncate">
                      {user.full_name || "Student"}
                    </p>
                    <VerifiedBadge level={badgeLevel} />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-[11.5px] text-gray-400 dark:text-gray-500 font-normal truncate">
                      {handle}
                    </p>
                    {streak > 0 && (
                      <span className="text-[10.5px] font-bold text-orange-500 dark:text-orange-400 flex items-center gap-0.5 shrink-0">
                        🔥{streak}
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              {/* Follow Button or You Tag */}
              {isSelf ? (
                <span className="px-3 py-1 text-xs font-semibold rounded-full bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border border-violet-200/60 dark:border-violet-800/40 select-none">
                  You
                </span>
              ) : (
                <button
                  onClick={() => handleToggleFollow(user.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all shrink-0 select-none ${
                    isFollowing
                      ? "bg-gray-100 dark:bg-[#1A1A24] text-gray-700 dark:text-gray-300 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400 border border-gray-200/60 dark:border-[#2D2B3B]"
                      : "bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-300 hover:bg-violet-600 hover:text-white dark:hover:bg-violet-600 dark:hover:text-white border border-violet-200/60 dark:border-violet-800/40"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

'use client'

import { useEffect, useState, useRef } from "react"
import { motion } from "framer-motion"
import { createClient } from "@/lib/supabase/client"
import { 
  Bell, 
  Heart, 
  MessageCircle, 
  UserPlus, 
  AtSign, 
  ChevronLeft, 
  Repeat2, 
  PenLine, 
  CheckCheck,
  Check
} from "lucide-react"
import Link from "next/link"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getBadgeLevel } from "@/lib/utils/streak"
import { formatTimeCompact } from "@/lib/utils/date"
import { 
  GroupedNotification, 
  getCachedNotifications, 
  fetchNotifications, 
  markNotificationsAsRead,
  markAllNotificationsAsRead,
  getFallbackAvatar,
  cleanPostSnippet,
  mergeRealtimeNotification
} from "@/lib/notifications/notifications-service"

type FilterTab = 'all' | 'likes' | 'mentions'

const TABS: { id: FilterTab; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'likes', label: 'Likes' },
  { id: 'mentions', label: 'Mentions & Replies' },
]

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<GroupedNotification[]>(() => {
    return getCachedNotifications() || []
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCachedNotifications()
    return !cached || cached.length === 0
  })
  const [activeTab, setActiveTab] = useState<FilterTab>('all')
  const [markedAllToast, setMarkedAllToast] = useState(false)
  const supabase = createClient()
  const activeUserIdRef = useRef<string | null>(null)

  useEffect(() => {
    let isMounted = true

    const load = async () => {
      const res = await fetchNotifications(activeUserIdRef.current)
      if (!isMounted) return

      if (res?.data) {
        activeUserIdRef.current = res.userId
        setNotifications(res.data)
        setLoading(false)
      } else {
        setLoading(false)
      }
    }

    load()

    // Realtime listener scoped specifically to the current user
    const setupRealtime = async () => {
      const { data: sessionData } = await supabase.auth.getSession()
      const currentUserId = sessionData.session?.user?.id || activeUserIdRef.current
      if (!currentUserId || !isMounted) return null

      const channel = supabase
        .channel(`notifications-user-${currentUserId}`)
        .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        }, async (payload) => {
          if (!isMounted) return
          const newNotif = payload.new as any

          // Fetch fresh aggregated notifications to ensure 100% active database likers and avatars
          fetchNotifications(currentUserId).then(res => {
            if (res?.data && isMounted) {
              setNotifications(res.data)
            }
          })
        })
        .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`
        }, () => {
          if (!isMounted) return
          fetchNotifications(currentUserId).then(res => {
            if (res?.data && isMounted) {
              setNotifications(res.data)
            }
          })
        })
        .subscribe()

      return channel
    }

    const channelPromise = setupRealtime()

    return () => {
      isMounted = false
      channelPromise.then(channel => {
        if (channel) supabase.removeChannel(channel)
      })
    }
  }, [])

  const handleMarkAllRead = async () => {
    if (!activeUserIdRef.current && notifications.length === 0) return
    const unreadRawIds = notifications.filter(n => !n.is_read).flatMap(n => n.raw_ids)
    
    // Instant optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    setMarkedAllToast(true)
    setTimeout(() => setMarkedAllToast(false), 2500)

    await markAllNotificationsAsRead(activeUserIdRef.current)
    if (unreadRawIds.length > 0) {
      markNotificationsAsRead(unreadRawIds)
    }
  }

  const handleNotificationClick = (n: GroupedNotification) => {
    // Only mark group as read if unread, never navigate away
    if (!n.is_read) {
      setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item))
      markNotificationsAsRead(n.raw_ids)
    }
  }

  const getIcon = (n: GroupedNotification) => {
    if (n.type === 'badge' as any) {
      const lvl = n.post_id === '00000000-0000-0000-0000-000000000003' ? 3 :
                  n.post_id === '00000000-0000-0000-0000-000000000002' ? 2 : 1
      return <VerifiedBadge level={lvl} size="md" />
    }
    switch (n.type) {
      case 'like': 
        return <Heart className="w-6 h-6 text-[#F91880] fill-[#F91880] shrink-0" />
      case 'comment': 
        return <MessageCircle className="w-6 h-6 text-sky-500 fill-sky-500 shrink-0" />
      case 'follow': 
        return <UserPlus className="w-6 h-6 text-emerald-500 shrink-0" />
      case 'mention': 
        return <AtSign className="w-6 h-6 text-violet-500 shrink-0" />
      case 'repost': 
        return <Repeat2 className="w-6 h-6 text-emerald-500 stroke-[2.2] shrink-0" />
      case 'quote': 
        return <PenLine className="w-6 h-6 text-violet-500 stroke-[2.2] shrink-0" />
      default: 
        return <Bell className="w-6 h-6 text-gray-500 shrink-0" />
    }
  }

  const renderNotificationMessage = (n: GroupedNotification) => {
    const count = n.total_actors_count || n.actors.length || 1
    const actor1 = n.actors[0] || { id: 'unknown', full_name: 'Someone' }
    const actor2 = n.actors[1] || { id: 'unknown', full_name: 'Someone' }
    const remainingCount = Math.max(0, count - 2)
    const remainingNoun = remainingCount === 1 ? 'other' : 'others'

    if (n.type === 'badge' as any) {
      if (n.post_id === '00000000-0000-0000-0000-000000000001') {
        return <span>🎉 You earned the <span className="font-extrabold text-blue-600 dark:text-blue-400">Blue Tick</span> Verification Badge!</span>
      }
      if (n.post_id === '00000000-0000-0000-0000-000000000002') {
        return <span>🏆 You earned the <span className="font-extrabold text-amber-500">Golden Tick</span> Verification Badge!</span>
      }
      if (n.post_id === '00000000-0000-0000-0000-000000000003') {
        return <span>💎 You earned the <span className="font-extrabold text-cyan-500">Diamond Tick</span> Verification Badge!</span>
      }
      return <span>You earned a verification badge!</span>
    }

    if (n.type === 'like') {
      if (count === 1) {
        return (
          <span>
            <span className="font-bold text-gray-900 dark:text-white">
              {actor1.full_name}
            </span> liked your post
          </span>
        )
      }
      if (count === 2) {
        return (
          <span>
            <span className="font-bold text-gray-900 dark:text-white">
              {actor1.full_name}
            </span> and <span className="font-bold text-gray-900 dark:text-white">
              {actor2.full_name}
            </span> liked your post
          </span>
        )
      }
      return (
        <span>
          <span className="font-bold text-gray-900 dark:text-white">
            {actor1.full_name}
          </span>, <span className="font-bold text-gray-900 dark:text-white">
            {actor2.full_name}
          </span> and {remainingCount} {remainingNoun} liked your post
        </span>
      )
    }

    if (n.type === 'follow') {
      if (count === 1) {
        return (
          <span>
            <span className="font-bold text-gray-900 dark:text-white">
              {actor1.full_name}
            </span> started following you
          </span>
        )
      }
      if (count === 2) {
        return (
          <span>
            <span className="font-bold text-gray-900 dark:text-white">
              {actor1.full_name}
            </span> and <span className="font-bold text-gray-900 dark:text-white">
              {actor2.full_name}
            </span> started following you
          </span>
        )
      }
      return (
        <span>
          <span className="font-bold text-gray-900 dark:text-white">
            {actor1.full_name}
          </span>, <span className="font-bold text-gray-900 dark:text-white">
            {actor2.full_name}
          </span> and {remainingCount} {remainingNoun} started following you
        </span>
      )
    }

    if (n.type === 'repost') {
      if (count === 1) {
        return (
          <span>
            <span className="font-bold text-gray-900 dark:text-white">
              {actor1.full_name}
            </span> reposted your post
          </span>
        )
      }
      return (
        <span>
          <span className="font-bold text-gray-900 dark:text-white">
            {actor1.full_name}
          </span> and {count - 1} {count - 1 === 1 ? 'other' : 'others'} reposted your post
        </span>
      )
    }

    if (n.type === 'comment') {
      return (
        <span>
          <span className="font-bold text-gray-900 dark:text-white">
            {actor1.full_name}
          </span> commented on your post
        </span>
      )
    }

    if (n.type === 'mention') {
      return (
        <span>
          <span className="font-bold text-gray-900 dark:text-white">
            {actor1.full_name}
          </span> mentioned you
        </span>
      )
    }

    if (n.type === 'quote') {
      return (
        <span>
          <span className="font-bold text-gray-900 dark:text-white">
            {actor1.full_name}
          </span> quoted your post
        </span>
      )
    }

    return <span>New notification from <span className="font-bold text-gray-900 dark:text-white">{actor1.full_name}</span></span>
  }

  // Filtered notifications
  const filteredNotifications = notifications.filter(n => {
    if (activeTab === 'likes') return n.type === 'like'
    if (activeTab === 'mentions') return ['mention', 'quote', 'comment', 'repost'].includes(n.type)
    return true
  })

  const unreadCount = notifications.filter(n => !n.is_read).length

  return (
    <div className="h-full w-full overflow-y-scroll [scrollbar-gutter:stable] px-0 sm:px-4 md:px-10 py-0 sm:py-6 md:py-8 bg-[#FCFBFF] dark:bg-[#000000] transition-colors duration-300">
      <div className="max-w-2xl mx-auto min-h-[500px]">
        {/* Sticky Header with Mark All Read */}
        <div className="sticky top-0 z-20 bg-white/90 dark:bg-black/90 backdrop-blur-md px-4 py-3 sm:rounded-t-2xl border-b border-gray-100 dark:border-[#2f3336] border-x-0 sm:border-x border-t-0 sm:border-t">
          <div className="flex items-center justify-between gap-3 min-h-[36px]">
            <div className="flex items-center gap-3">
              <Link 
                href="/dashboard" 
                prefetch={true} 
                className="md:hidden p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.1] transition-colors"
                title="Back to feed"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
                Notifications
              </h1>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors cursor-pointer select-none"
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}
          </div>

          {/* Filter Tabs with Animated Sliding Pill */}
          <div className="flex items-center gap-1.5 mt-3 pt-1">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer select-none focus:outline-hidden ${
                    isActive
                      ? 'text-white dark:text-black'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06]'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="notification-tab-pill"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      className="absolute inset-0 bg-gray-900 dark:bg-white rounded-full -z-10 shadow-xs"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Floating Toast when all marked as read */}
        {markedAllToast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] bg-[#0f1419] dark:bg-white text-white dark:text-[#0f1419] px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 duration-150">
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>All notifications marked as read</span>
          </div>
        )}

        {/* Notifications Body */}
        {loading && !notifications.length ? (
          <div className="space-y-2 p-3 sm:p-0">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-[#0B0A10] sm:rounded-2xl border border-gray-100 dark:border-[#2f3336] p-4 flex gap-4 animate-pulse">
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-[#1A1A24] shrink-0 mt-1" />
                <div className="flex-1 space-y-2.5">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#1A1A24]" />
                    ))}
                  </div>
                  <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white dark:bg-[#0B0A10] sm:rounded-b-2xl border-x-0 sm:border-x border-b border-gray-100 dark:border-[#2f3336] shadow-xs transition-colors duration-300 min-h-[460px] flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-gray-50 dark:bg-white/[0.04] rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
              {activeTab === 'likes' 
                ? 'No likes yet' 
                : activeTab === 'mentions' 
                ? 'No mentions or replies yet' 
                : 'All caught up!'}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mx-auto">
              {activeTab === 'likes'
                ? "When people like your posts, you'll see them grouped here."
                : activeTab === 'mentions'
                ? "When people reply, quote, or mention you, they will appear here."
                : "When students like your posts, follow you, or mention you, you'll see them grouped here."}
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0B0A10] sm:rounded-b-2xl border-x-0 sm:border-x border-b border-gray-100 dark:border-[#2f3336] shadow-xs overflow-hidden transition-colors duration-300 divide-y divide-gray-100 dark:divide-[#2f3336] min-h-[460px]">
            {filteredNotifications.map((notification) => {
              const hasPost = Boolean(notification.post_id)
              const postContent = notification.post?.content
              const postImage = notification.post?.image_url

              return (
                <article
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`p-4 sm:p-5 flex gap-3.5 transition-colors duration-150 select-text text-left cursor-default hover:bg-black/[0.03] dark:hover:bg-white/[0.04] ${
                    !notification.is_read ? 'bg-violet-50/30 dark:bg-violet-950/15' : ''
                  }`}
                >
                  {/* Left Column: Notification Icon (Pink Heart, UserPlus, etc.) */}
                  <div className="pt-0.5 shrink-0 flex flex-col items-center select-none">
                    {getIcon(notification)}
                    {!notification.is_read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-violet-600 dark:bg-violet-400 mt-2" title="Unread" />
                    )}
                  </div>

                  {/* Middle Column: Avatars Row + Headline + Post Text Preview */}
                  <div className="flex-1 min-w-0">
                    {/* Horizontal Avatar Row: Twitter/X Style (Non-navigable preview with hover effect) */}
                    {notification.actors && notification.actors.length > 0 && (
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap mb-2">
                        {notification.actors.map((actor) => (
                          <div
                            key={actor.id}
                            title={actor.full_name}
                            className="relative select-none"
                          >
                            <img
                              src={actor.avatar_url || getFallbackAvatar(actor.full_name)}
                              alt={actor.full_name}
                              className="w-8 h-8 rounded-full object-cover border border-white dark:border-[#0B0A10] shadow-2xs hover:scale-110 transition-transform duration-150 cursor-default"
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.src = getFallbackAvatar(actor.full_name)
                              }}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Grouped Headline + Timestamp */}
                    <div className="text-[14.5px] sm:text-[15px] leading-snug text-gray-900 dark:text-gray-100 font-normal select-text">
                      {renderNotificationMessage(notification)}
                      <span 
                        className="text-gray-400 dark:text-gray-500 text-xs font-normal ml-1.5 select-none"
                        title={notification.latest_created_at}
                      >
                        · {formatTimeCompact(notification.latest_created_at)}
                      </span>
                    </div>

                    {/* Post Content Text Snippet Preview (Muted Twitter Style) */}
                    {postContent && (
                      <p className="text-[13.5px] sm:text-[14px] text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 font-normal leading-snug select-text">
                        {cleanPostSnippet(postContent)}
                      </p>
                    )}
                  </div>

                  {/* Right Column: Compact Post Image Thumbnail Preview (only if post has an image) */}
                  {hasPost && postImage && (
                    <div className="shrink-0 self-center pl-2 select-none">
                      <img
                        src={postImage}
                        alt="Post thumbnail"
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-gray-100 dark:border-white/10 shadow-2xs hover:scale-105 transition-transform duration-150 cursor-default"
                        loading="lazy"
                      />
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

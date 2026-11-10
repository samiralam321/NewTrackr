'use client'

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, Heart, MessageCircle, UserPlus, AtSign, ChevronLeft, Repeat2, PenLine } from "lucide-react"
import Link from "next/link"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { getBadgeLevel } from "@/lib/utils/streak"
import { formatTimeCompact } from "@/lib/utils/date"
import { 
  Notification, 
  getCachedNotifications, 
  fetchNotifications, 
  markNotificationsAsRead 
} from "@/lib/notifications/notifications-service"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>(() => {
    return getCachedNotifications() || []
  })
  const [loading, setLoading] = useState(() => {
    const cached = getCachedNotifications()
    return !cached || cached.length === 0
  })
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

        // Mark unread as read asynchronously in background without blocking UI
        const unreadIds = res.data.filter(n => !n.is_read).map(n => n.id)
        if (unreadIds.length > 0) {
          markNotificationsAsRead(unreadIds)
        }
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
        }, () => {
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

  const getIcon = (n: Notification) => {
    if (n.type === 'badge' as any) {
      const lvl = n.post_id === '00000000-0000-0000-0000-000000000003' ? 3 :
                  n.post_id === '00000000-0000-0000-0000-000000000002' ? 2 : 1
      return <VerifiedBadge level={lvl} size="md" />
    }
    switch (n.type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-current" />
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500 fill-current" />
      case 'follow': return <UserPlus className="w-5 h-5 text-emerald-500" />
      case 'mention': return <AtSign className="w-5 h-5 text-violet-500" />
      case 'repost': return <Repeat2 className="w-5 h-5 text-emerald-500 stroke-[2.2]" />
      case 'quote': return <PenLine className="w-5 h-5 text-violet-500 stroke-[2.2]" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getMessage = (n: Notification) => {
    const actorName = n.actor?.full_name || 'Someone'
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
    switch (n.type) {
      case 'like':
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">{actorName}</span>
            <VerifiedBadge level={getBadgeLevel((n.actor as any)?.consistency_score, actorName)} nameOrHandle={actorName} />
            <span>liked your post</span>
          </span>
        )
      case 'comment':
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">{actorName}</span>
            <VerifiedBadge level={getBadgeLevel((n.actor as any)?.consistency_score, actorName)} nameOrHandle={actorName} />
            <span>commented on your post</span>
          </span>
        )
      case 'follow':
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">{actorName}</span>
            <VerifiedBadge level={getBadgeLevel((n.actor as any)?.consistency_score, actorName)} nameOrHandle={actorName} />
            <span>started following you</span>
          </span>
        )
      case 'mention':
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">{actorName}</span>
            <VerifiedBadge level={getBadgeLevel((n.actor as any)?.consistency_score, actorName)} nameOrHandle={actorName} />
            <span>mentioned you</span>
          </span>
        )
      case 'repost':
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">{actorName}</span>
            <VerifiedBadge level={getBadgeLevel((n.actor as any)?.consistency_score, actorName)} nameOrHandle={actorName} />
            <span>reposted your post</span>
          </span>
        )
      case 'quote':
        return (
          <span className="inline-flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-gray-900 dark:text-white">{actorName}</span>
            <VerifiedBadge level={getBadgeLevel((n.actor as any)?.consistency_score, actorName)} nameOrHandle={actorName} />
            <span>quoted your post</span>
          </span>
        )
      default: return <span>New notification from {actorName}</span>
    }
  }

  return (
    <div className="h-full w-full overflow-y-auto px-4 md:px-10 py-6 md:py-8 bg-gray-50/30 dark:bg-[#050505] transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" prefetch={true} className="md:hidden p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Notifications</h1>
        </div>

        {loading && !notifications.length ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white dark:bg-[#0B0A10] rounded-2xl border border-gray-100 dark:border-[#2D2B3B] p-4 flex gap-4 animate-pulse">
                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-[#1A1A24] shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/4" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-[#0B0A10] rounded-2xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm transition-colors duration-300">
            <div className="w-16 h-16 bg-gray-50 dark:bg-[#1A1A24] rounded-full flex items-center justify-center mx-auto mb-4 transition-colors">
              <Bell className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">All caught up!</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">When someone interacts with your posts, you'll see it here.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-[#0B0A10] rounded-2xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm overflow-hidden transition-colors duration-300">
            {notifications.map((notification, idx) => (
              <div 
                key={notification.id} 
                className={`p-5 border-b border-gray-50 dark:border-[#2D2B3B] flex gap-4 transition-colors hover:bg-gray-50 dark:hover:bg-[#1A1A24] ${!notification.is_read ? 'bg-[#FCFBFF] dark:bg-violet-900/10' : ''} ${idx === notifications.length - 1 ? 'border-b-0' : ''}`}
              >
                <div className="mt-1 flex-shrink-0">
                  {getIcon(notification)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <Link href={`/profile/${notification.actor_id}`} prefetch={true} className="shrink-0">
                      <img 
                        src={notification.actor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(notification.actor?.full_name || 'User')}&background=7C3AED&color=fff`} 
                        alt="" 
                        className="w-6 h-6 rounded-full object-cover hover:opacity-85 transition-opacity"
                      />
                    </Link>
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      {notification.post_id && !['badge', 'follow'].includes(notification.type) ? (
                        <Link href={`/post/${notification.post_id}`} prefetch={true} className="hover:underline">
                          {getMessage(notification)}
                        </Link>
                      ) : (
                        <Link href={`/profile/${notification.actor_id}`} prefetch={true} className="hover:underline">
                          {getMessage(notification)}
                        </Link>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {formatTimeCompact(notification.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

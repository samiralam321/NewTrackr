'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Bell, Heart, MessageCircle, UserPlus, AtSign, ChevronLeft } from "lucide-react"
import Link from "next/link"

type Notification = {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'mention'
  post_id?: string
  is_read: boolean
  created_at: string
  actor: {
    full_name: string
    avatar_url: string
  }
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchNotifications()

    const channel = supabase
      .channel('notifications-db')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, () => {
        fetchNotifications()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const fetchNotifications = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        actor:profiles!notifications_actor_id_fkey(full_name, avatar_url)
      `)
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })

    if (data && !error) {
      setNotifications(data as any)
      
      // Mark as read
      const unreadIds = data.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length > 0) {
        await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
      }
    }
    setLoading(false)
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-500 fill-current" />
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-500 fill-current" />
      case 'follow': return <UserPlus className="w-5 h-5 text-emerald-500" />
      case 'mention': return <AtSign className="w-5 h-5 text-violet-500" />
      default: return <Bell className="w-5 h-5 text-gray-500" />
    }
  }

  const getMessage = (type: string, actorName: string) => {
    switch (type) {
      case 'like': return <span><span className="font-semibold text-gray-900">{actorName}</span> liked your post</span>
      case 'comment': return <span><span className="font-semibold text-gray-900">{actorName}</span> commented on your post</span>
      case 'follow': return <span><span className="font-semibold text-gray-900">{actorName}</span> started following you</span>
      case 'mention': return <span><span className="font-semibold text-gray-900">{actorName}</span> mentioned you</span>
      default: return <span>New notification from {actorName}</span>
    }
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 bg-gray-50/30 dark:bg-[#050505] transition-colors duration-300">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/dashboard" className="md:hidden p-2 -ml-2 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors">Notifications</h1>
        </div>

        {loading ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading notifications...</div>
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
                  {getIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <Link href={`/profile/${notification.actor_id}`} className="flex items-center gap-2 mb-1.5">
                    <img 
                      src={notification.actor?.avatar_url || `https://ui-avatars.com/api/?name=${notification.actor?.full_name || 'User'}&background=7C3AED&color=fff`} 
                      alt="" 
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {getMessage(notification.type, notification.actor?.full_name || 'Someone')}
                    </p>
                  </Link>
                  <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                    {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
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

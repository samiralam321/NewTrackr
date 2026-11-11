import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { 
  aggregateNotificationsFromRaw, 
  NotificationActor, 
  PostSnippet 
} from '@/lib/notifications/notifications-service'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 1. Fetch raw notifications for the authenticated user
    const { data: rawNotifs, error: notifsError } = await supabase
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
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100)

    if (notifsError) {
      console.error('Error fetching notifications:', notifsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    if (!rawNotifs || rawNotifs.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        unreadCount: 0,
        userId: user.id
      })
    }

    // 2. Batched fetch of referenced posts for image thumbnails and text previews
    const postIds = Array.from(new Set(rawNotifs.map(n => n.post_id).filter(Boolean))) as string[]
    const postMap = new Map<string, PostSnippet>()

    if (postIds.length > 0) {
      try {
        const { data: postsData } = await supabase
          .from('posts')
          .select('id, content, image_url, user_id')
          .in('id', postIds)

        if (postsData) {
          postsData.forEach(p => postMap.set(p.id, p))
        }
      } catch (postErr) {
        console.warn('Could not batch fetch post previews:', postErr)
      }
    }

    // 3. Batched fetch of active database likes for exact liker counts and profile pictures
    const likePostIds = Array.from(
      new Set(rawNotifs.filter(n => n.type === 'like' && n.post_id).map(n => n.post_id!))
    )
    const activeLikesMap: Record<string, NotificationActor[]> = {}

    if (likePostIds.length > 0) {
      try {
        const { data: likesData } = await supabase
          .from('likes')
          .select(`
            post_id,
            user_id,
            created_at,
            profile:profiles!likes_user_id_fkey(id, full_name, username, avatar_url, consistency_score)
          `)
          .in('post_id', likePostIds)
          .order('created_at', { ascending: false })

        if (likesData) {
          likesData.forEach((l: any) => {
            if (!activeLikesMap[l.post_id]) activeLikesMap[l.post_id] = []
            activeLikesMap[l.post_id].push({
              id: l.user_id,
              full_name: l.profile?.full_name || 'Someone',
              username: l.profile?.username || null,
              avatar_url: l.profile?.avatar_url || null,
              consistency_score: l.profile?.consistency_score || 0
            })
          })
        }
      } catch (likeErr) {
        console.warn('Could not batch fetch active likers:', likeErr)
      }
    }

    // 4. Batched fetch of active followers for exact follow aggregation
    const hasFollows = rawNotifs.some(n => n.type === 'follow')
    let activeFollowers: NotificationActor[] = []

    if (hasFollows) {
      try {
        const { data: followsData } = await supabase
          .from('follows')
          .select(`
            follower_id,
            created_at,
            profile:profiles!follows_follower_id_fkey(id, full_name, username, avatar_url, consistency_score)
          `)
          .eq('following_id', user.id)
          .order('created_at', { ascending: false })
          .limit(30)

        if (followsData) {
          activeFollowers = followsData.map((f: any) => ({
            id: f.follower_id,
            full_name: f.profile?.full_name || 'Someone',
            username: f.profile?.username || null,
            avatar_url: f.profile?.avatar_url || null,
            consistency_score: f.profile?.consistency_score || 0
          }))
        }
      } catch (followErr) {
        console.warn('Could not batch fetch active followers:', followErr)
      }
    }

    // 5. Aggregate into Twitter/X-style grouped notifications
    const grouped = aggregateNotificationsFromRaw(
      rawNotifs,
      postMap,
      activeLikesMap,
      activeFollowers
    )

    const unreadCount = grouped.filter(g => !g.is_read).length

    return NextResponse.json({
      success: true,
      data: grouped,
      unreadCount,
      userId: user.id
    })
  } catch (error: any) {
    console.error('Unexpected error in GET /api/notifications:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

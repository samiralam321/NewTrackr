import { createClient } from "@/lib/supabase/server"
import { getAuthenticatedUserAndProfile } from "@/lib/auth/get-user-profile"
import { ProfileDashboard } from "@/components/profile/profile-dashboard"
import { redirect } from "next/navigation"

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const { user, profile } = await getAuthenticatedUserAndProfile()

  if (!user) {
    redirect('/auth')
  }

  const supabase = await createClient()

  // Parallelize secondary lightweight count & badge queries (0 row payloads over the wire)
  const [postsCountRes, followersRes, followingRes, problemSolvedRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id),
    supabase
      .from('posts')
      .select('id')
      .eq('user_id', user.id)
      .or('content.ilike.%dsa%,content.ilike.%algorithm%')
      .limit(1)
  ])

  const resolvedProfile = profile || {
    id: user.id,
    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student',
    username: user.user_metadata?.username || null,
    avatar_url: user.user_metadata?.avatar_url || null,
    bio: '',
    college: '',
    website: user.user_metadata?.website || user.user_metadata?.link || null,
    consistency_score: 0,
    streak: 0,
    last_post_date: null,
    challenge_rank: null,
    resume_url: null,
    resume_name: null,
    updated_at: new Date().toISOString()
  }

  return (
    <ProfileDashboard 
      profile={resolvedProfile}
      postsCount={postsCountRes.count || 0}
      hasProblemSolved={(problemSolvedRes.data && problemSolvedRes.data.length > 0) || false}
      followersCount={followersRes.count || 0}
      followingCount={followingRes.count || 0}
      isCurrentUser={true}
      currentUserId={user.id}
    />
  )
}

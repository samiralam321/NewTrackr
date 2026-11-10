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

  // Parallelize secondary queries
  const [postsRes, followersRes, followingRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', user.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id)
  ])

  return (
    <ProfileDashboard 
      profile={profile}
      posts={postsRes.data || []}
      followersCount={followersRes.count || 0}
      followingCount={followingRes.count || 0}
      isCurrentUser={true}
      currentUserId={user.id}
    />
  )
}

import { createClient } from "@/lib/supabase/server"
import { ProfileDashboard } from "@/components/profile/profile-dashboard"

export const dynamic = 'force-dynamic'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return <div>Please log in</div>

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  const { data: posts } = await supabase.from('posts').select('*').eq('user_id', user.id).order('created_at', { ascending: false })

  const { count: followersCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id)
  const { count: followingCount } = await supabase.from('follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id)

  return (
    <ProfileDashboard 
      profile={profile}
      posts={posts || []}
      followersCount={followersCount || 0}
      followingCount={followingCount || 0}
      isCurrentUser={true}
      currentUserId={user.id}
    />
  )
}

import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileDashboard } from "@/components/profile/profile-dashboard"

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', resolvedParams.id)
    .single()

  if (!profile) {
    notFound()
  }

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })

  const { count: followersCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', profile.id)

  const { count: followingCount } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', profile.id)

  return (
    <ProfileDashboard 
      profile={profile}
      posts={posts || []}
      followersCount={followersCount || 0}
      followingCount={followingCount || 0}
      isCurrentUser={user?.id === profile.id}
      currentUserId={user?.id || ''}
    />
  )
}

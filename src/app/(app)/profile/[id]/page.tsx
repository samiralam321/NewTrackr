import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileDashboard } from "@/components/profile/profile-dashboard"

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  let user = null; try { const { data } = await supabase.auth.getUser(); user = data?.user || null; } catch { user = null; }

  // Fetch the profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', resolvedParams.id)
    .maybeSingle()

  if (!profile) {
    notFound()
  }

  const [postsRes, followersRes, followingRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id)
  ])

  return (
    <ProfileDashboard 
      profile={profile}
      posts={postsRes.data || []}
      followersCount={followersRes.count || 0}
      followingCount={followingRes.count || 0}
      isCurrentUser={user?.id === profile.id}
      currentUserId={user?.id || ''}
    />
  )
}

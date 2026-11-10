import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileDashboard } from "@/components/profile/profile-dashboard"

export const dynamic = 'force-dynamic'

export default async function ProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const supabase = await createClient()
  
  let user = null; try { const { data } = await supabase.auth.getUser(); user = data?.user || null; } catch { user = null; }

  // Fetch the profile by UUID or handle/name
  const rawId = decodeURIComponent(resolvedParams.id).trim()
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawId)

  let profile = null
  if (isUuid) {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', rawId)
      .maybeSingle()
    profile = data
  } else {
    const cleanSearch = rawId.replace(/^@/, '').replace(/_/g, ' ')
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${cleanSearch}%`)
      .limit(1)
      .maybeSingle()
    profile = data
  }

  if (!profile) {
    notFound()
  }

  profile = {
    ...profile,
    website: profile.website || (user?.id === profile.id ? user?.user_metadata?.website || user?.user_metadata?.link : null),
    username: profile.username || (user?.id === profile.id ? user?.user_metadata?.username : null)
  }

  const [postsCountRes, followersRes, followingRes, problemSolvedRes] = await Promise.all([
    supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id),
    supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id),
    supabase
      .from('posts')
      .select('id')
      .eq('user_id', profile.id)
      .or('content.ilike.%dsa%,content.ilike.%algorithm%')
      .limit(1)
  ])

  return (
    <ProfileDashboard 
      profile={profile}
      postsCount={postsCountRes.count || 0}
      hasProblemSolved={(problemSolvedRes.data && problemSolvedRes.data.length > 0) || false}
      followersCount={followersRes.count || 0}
      followingCount={followingRes.count || 0}
      isCurrentUser={user?.id === profile.id}
      currentUserId={user?.id || ''}
    />
  )
}

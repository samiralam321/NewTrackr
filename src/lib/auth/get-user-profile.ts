import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface AuthenticatedUserSession {
  user: any | null
  profile: {
    id: string
    full_name: string | null
    username?: string | null
    avatar_url: string | null
    bio?: string | null
    college?: string | null
    website?: string | null
    consistency_score?: number | null
    streak?: number | null
    last_post_date?: string | null
    challenge_rank?: number | null
    resume_url?: string | null
    resume_name?: string | null
    updated_at?: string | null
  } | null
}

/**
 * Server-side request-scoped deduplication for user session and profile.
 * Wrapped in React `cache()`, so multiple calls within the same SSR request lifecycle
 * (e.g. in AppLayout, DashboardPage, and ProfilePage) will execute only ONCE against Supabase.
 */
export const getAuthenticatedUserAndProfile = cache(async (): Promise<AuthenticatedUserSession> => {
  const supabase = await createClient()

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (error || !data?.user) {
      return { user: null, profile: null }
    }
    user = data.user
  } catch (err) {
    console.warn("Could not retrieve user in getAuthenticatedUserAndProfile:", err)
    return { user: null, profile: null }
  }

  let profile = null
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (!error && data) {
      profile = {
        ...data,
        website: data.website || user.user_metadata?.website || user.user_metadata?.link || null,
        username: data.username || user.user_metadata?.username || null
      }
    } else if (error) {
      console.warn("Supabase profile load warning:", error.message)
    }
  } catch (err) {
    console.warn("Could not load user profile in getAuthenticatedUserAndProfile:", err)
  }

  // If no profile record exists in the database, attempt self-healing insert
  // so downstream foreign key relationships (posts, comments, likes) do not fail
  if (!profile && user) {
    const rawUsername = user.user_metadata?.username || user.email?.split('@')[0]?.replace(/[^a-zA-Z0-9_]/g, '') || `user_${user.id.slice(0, 6)}`
    const finalUsername = rawUsername.slice(0, 20)
    const initialName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Student'
    const initialAvatar = user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(finalUsername)}`

    try {
      const { data: insertedData } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          full_name: initialName,
          username: finalUsername,
          avatar_url: initialAvatar,
          consistency_score: 0,
          streak: 0,
        })
        .select('*')
        .maybeSingle()

      if (insertedData) {
        profile = {
          ...insertedData,
          website: insertedData.website || user.user_metadata?.website || user.user_metadata?.link || null,
          username: insertedData.username || user.user_metadata?.username || finalUsername
        }
      }
    } catch (insertErr) {
      console.warn("Profile self-healing insert notice:", insertErr)
    }

    if (!profile) {
      profile = {
        id: user.id,
        full_name: initialName,
        username: finalUsername,
        avatar_url: initialAvatar,
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
    }
  }

  return { user, profile }
})

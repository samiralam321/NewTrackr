import { cache } from 'react'
import { createClient } from '@/lib/supabase/server'

export interface AuthenticatedUserSession {
  user: any | null
  profile: {
    id: string
    full_name: string | null
    avatar_url: string | null
    bio?: string | null
    college?: string | null
    consistency_score?: number | null
    streak?: number | null
    handle?: string | null
    is_admin?: boolean | null
    role?: string | null
    updated_at?: string | null
  } | null
}

/**
 * Server-side request-scoped deduplication for user session and profile.
 * Wrapped in React `cache()`, so multiple calls within the same SSR request lifecycle
 * (e.g. in AppLayout and DashboardPage) will execute only ONCE against Supabase.
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
      .select('id, full_name, avatar_url, bio, college, consistency_score, streak, handle, is_admin, role, updated_at')
      .eq('id', user.id)
      .maybeSingle()

    if (!error && data) {
      profile = data
    }
  } catch (err) {
    console.warn("Could not load user profile in getAuthenticatedUserAndProfile:", err)
  }

  return { user, profile }
})

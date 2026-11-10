import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'bsqqdfkdycziocmgiani'
  const legacyTokenName = `sb-${projectRef}-auth-token`

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const raw = cookieStore.getAll()
          return raw.filter(c => {
            // Filter out any legacy malformed cookies that crash GoTrueClient
            if (c.name === legacyTokenName) {
              if (c.value.startsWith('%7B') || c.value.startsWith('{')) {
                return false
              }
            }
            return true
          })
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
              })
            )
          } catch {
            // The `setAll` method was called from a Server Component.
          }
        },
      },
      cookieOptions: {
        maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  )
}

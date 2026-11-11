import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { formatAuthError } from '@/lib/auth/auth-errors'

export const dynamic = 'force-dynamic'

/**
 * Sanitizes and validates internal redirect target to prevent open redirect attacks.
 * Rejects external URLs, protocol-relative '//', and backslash paths.
 */
function getSafeRedirectUrl(next: string | null, fallback = '/dashboard'): string {
  if (!next || typeof next !== 'string') return fallback
  const trimmed = next.trim()

  // Must begin with single forward slash, not '//' or '/\'
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('\\')
  ) {
    // Prevent redirect loops back to auth pages
    if (trimmed === '/auth' || trimmed.startsWith('/auth/callback')) {
      return fallback
    }
    return trimmed
  }

  return fallback
}

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const rawNext = searchParams.get('next')
  const safeNext = getSafeRedirectUrl(rawNext, '/dashboard')

  if (code) {
    try {
      const supabase = await createClient()
      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (!error) {
        const forwardedHost = request.headers.get('x-forwarded-host')
        const isLocalEnv = process.env.NODE_ENV === 'development'

        if (isLocalEnv) {
          return NextResponse.redirect(new URL(safeNext, origin))
        } else if (forwardedHost) {
          return NextResponse.redirect(`https://${forwardedHost}${safeNext}`)
        } else {
          return NextResponse.redirect(new URL(safeNext, origin))
        }
      }

      console.error('Auth callback session exchange error:', error)
      const friendlyErr = formatAuthError(error)
      return NextResponse.redirect(
        new URL(`/auth?error=${encodeURIComponent(friendlyErr)}`, origin)
      )
    } catch (err: any) {
      console.error('Auth callback unexpected error:', err)
      return NextResponse.redirect(
        new URL('/auth?error=Authentication%20failed.%20Please%20try%20again.', origin)
      )
    }
  }

  // Missing code or error param
  const urlError = searchParams.get('error_description') || searchParams.get('error')
  const errorMsg = urlError ? formatAuthError(urlError) : 'Could not authenticate user.'
  return NextResponse.redirect(
    new URL(`/auth?error=${encodeURIComponent(errorMsg)}`, origin)
  )
}

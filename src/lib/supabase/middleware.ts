import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'bsqqdfkdycziocmgiani'
  const legacyTokenName = `sb-${projectRef}-auth-token`

  // Check if browser sent a malformed URL-encoded JSON cookie
  const rawTokenCookie = request.cookies.get(legacyTokenName)
  const isCorrupted = rawTokenCookie && (rawTokenCookie.value.startsWith('%7B') || rawTokenCookie.value.startsWith('{'))

  if (isCorrupted) {
    supabaseResponse.cookies.delete(legacyTokenName)
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          const all = request.cookies.getAll()
          // Filter out legacy malformed cookie so GoTrueClient does not crash with TypeError
          return all.filter(c => {
            if (c.name === legacyTokenName) {
              return !(c.value.startsWith('%7B') || c.value.startsWith('{'))
            }
            return true
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
              sameSite: 'lax',
              path: '/',
              secure: process.env.NODE_ENV === 'production',
            })
          )
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

  let user = null
  try {
    const { data } = await supabase.auth.getUser()
    user = data?.user || null
  } catch (err) {
    console.warn("Middleware caught auth session error:", err)
    user = null
  }

  const pathname = request.nextUrl.pathname
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/sw.js' ||
    pathname === '/manifest.webmanifest' ||
    pathname === '/manifest.json' ||
    pathname === '/offline' ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icon-') ||
    pathname === '/apple-touch-icon.png' ||
    pathname === '/logo.png'

  // If already authenticated and visiting the root /auth page, redirect immediately to /dashboard
  if (user && (pathname === '/auth' || pathname === '/auth/')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users attempting to access protected routes
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/auth'
    // Preserve the intended destination so user lands there after authentication
    const returnTarget = pathname + (request.nextUrl.search || '')
    if (returnTarget && returnTarget !== '/') {
      url.searchParams.set('redirectTo', returnTarget)
    }
    const redirectResponse = NextResponse.redirect(url)
    if (isCorrupted) {
      redirectResponse.cookies.delete(legacyTokenName)
    }
    return redirectResponse
  }

  return supabaseResponse
}

import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - PWA files: sw.js, manifest.json, manifest.webmanifest, offline
     * - static image/font extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|manifest.webmanifest|offline|icon-.*|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2)$).*)',
  ],
}

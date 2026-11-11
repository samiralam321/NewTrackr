import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'bsqqdfkdycziocmgiani'
    const legacyTokenName = `sb-${projectRef}-auth-token`

    const response = NextResponse.json({ success: true, message: "Logged out successfully" })

    // Proactively clear cookie variations
    response.cookies.delete(legacyTokenName)
    response.cookies.delete(`${legacyTokenName}.0`)
    response.cookies.delete(`${legacyTokenName}.1`)

    return response
  } catch (err: any) {
    console.error("Signout API error:", err)
    return NextResponse.json({ success: false, error: "Failed to sign out cleanly" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()

    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'bsqqdfkdycziocmgiani'
    const legacyTokenName = `sb-${projectRef}-auth-token`

    const response = NextResponse.redirect(new URL('/auth', request.url))
    response.cookies.delete(legacyTokenName)
    response.cookies.delete(`${legacyTokenName}.0`)
    response.cookies.delete(`${legacyTokenName}.1`)

    return response
  } catch {
    return NextResponse.redirect(new URL('/auth', request.url))
  }
}

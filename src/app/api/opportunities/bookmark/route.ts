import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    } catch {
      user = null
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { opportunityId, action } = await request.json()
    if (!opportunityId) {
      return NextResponse.json({ error: "Missing opportunityId" }, { status: 400 })
    }

    // Try saving in Supabase if opportunity_bookmarks table exists
    try {
      if (action === 'remove') {
        await supabase
          .from('opportunity_bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('opportunity_id', opportunityId)
      } else {
        await supabase
          .from('opportunity_bookmarks')
          .insert({ user_id: user.id, opportunity_id: opportunityId })
      }
    } catch (dbErr) {
      console.warn("Database opportunity bookmark fallback:", dbErr)
    }

    return NextResponse.json({ success: true, opportunityId, action: action || 'add' })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    } catch {
      user = null
    }

    if (!user) {
      return NextResponse.json({ bookmarkedIds: [] })
    }

    try {
      const { data } = await supabase
        .from('opportunity_bookmarks')
        .select('opportunity_id')
        .eq('user_id', user.id)

      const ids = data?.map((b: any) => b.opportunity_id) || []
      return NextResponse.json({ bookmarkedIds: ids })
    } catch {
      return NextResponse.json({ bookmarkedIds: [] })
    }
  } catch {
    return NextResponse.json({ bookmarkedIds: [] })
  }
}

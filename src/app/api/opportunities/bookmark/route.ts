import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const BookmarkRequestSchema = z.object({
  opportunityId: z.string().min(1).max(120),
  action: z.enum(['add', 'remove']).default('add')
})

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

    const body = await request.json().catch(() => null)
    const parsed = BookmarkRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 })
    }

    const { opportunityId, action } = parsed.data

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

    return NextResponse.json({ success: true, opportunityId, action })
  } catch (err: any) {
    console.error("Bookmark API error:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function GET() {
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
        .limit(200)

      const ids = data?.map((b: any) => b.opportunity_id) || []
      return NextResponse.json({ bookmarkedIds: ids })
    } catch {
      return NextResponse.json({ bookmarkedIds: [] })
    }
  } catch {
    return NextResponse.json({ bookmarkedIds: [] })
  }
}

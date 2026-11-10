import { NextResponse } from "next/server"
import { runOpportunitySync } from "@/lib/opportunities/sync"

export const dynamic = 'force-dynamic'

export async function POST() {
  try {
    const result = await runOpportunitySync()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    return NextResponse.json({ error: "Failed to sync opportunities", details: err?.message }, { status: 500 })
  }
}

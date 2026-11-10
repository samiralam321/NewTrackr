import { NextRequest, NextResponse } from "next/server"
import { runOpportunitySync } from "@/lib/opportunities/sync"
import { validateAdminSecret } from "@/lib/security/api-security"

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // Require admin or cron authorization to run external data sync
    if (!validateAdminSecret(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const result = await runOpportunitySync()
    return NextResponse.json({ success: true, ...result })
  } catch (err: any) {
    console.error("Opportunities sync API error:", err)
    return NextResponse.json({ error: "Failed to sync opportunities" }, { status: 500 })
  }
}

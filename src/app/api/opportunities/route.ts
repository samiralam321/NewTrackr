import { NextRequest, NextResponse } from "next/server"
import { getOpportunities } from "@/lib/opportunities/queries"
import { OpportunityCategory, OpportunityLocation, OpportunityMode } from "@/lib/opportunities/types"

export const revalidate = 600

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const search = searchParams.get('q') || searchParams.get('search') || ''
    const category = (searchParams.get('category') || 'All') as OpportunityCategory | 'All'
    const mode = (searchParams.get('mode') || 'All') as OpportunityMode | 'All'
    const location = (searchParams.get('location') || 'All') as OpportunityLocation | 'All'
    const isPaidOnly = searchParams.get('paid') === 'true'
    const closingSoonOnly = searchParams.get('closingSoon') === 'true'
    const sort = (searchParams.get('sort') || 'latest') as 'latest' | 'closing-soon' | 'most-relevant'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '25', 10)

    const result = await getOpportunities({
      search,
      category,
      mode,
      location,
      isPaidOnly,
      closingSoonOnly,
      sort,
      page,
      limit
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=1800',
      }
    })
  } catch (err: any) {
    console.error("Opportunities API error:", err)
    return NextResponse.json(
      { error: "Failed to fetch opportunities", details: err?.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getOpportunities } from "@/lib/opportunities/queries"
import { OpportunityCategory, OpportunityLocation, OpportunityMode } from "@/lib/opportunities/types"
import { z } from "zod"

export const dynamic = 'force-dynamic'

const OpportunitiesQuerySchema = z.object({
  search: z.string().max(100).default(''),
  category: z.enum([
    'All',
    'Hackathons',
    'Internships',
    'Scholarships',
    'Competitions',
    'Fellowships',
    'Open Source'
  ]).default('All'),
  mode: z.enum(['All', 'Remote', 'In-Person', 'Hybrid']).default('All'),
  location: z.enum(['All', 'India', 'Global', 'USA', 'Europe']).default('All'),
  isPaidOnly: z.boolean().default(false),
  closingSoonOnly: z.boolean().default(false),
  sort: z.enum(['latest', 'closing-soon', 'most-relevant']).default('latest'),
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(50).default(25),
})

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const rawInput = {
      search: (searchParams.get('q') || searchParams.get('search') || '').trim(),
      category: searchParams.get('category') || 'All',
      mode: searchParams.get('mode') || 'All',
      location: searchParams.get('location') || 'All',
      isPaidOnly: searchParams.get('paid') === 'true',
      closingSoonOnly: searchParams.get('closingSoon') === 'true',
      sort: searchParams.get('sort') || 'latest',
      page: parseInt(searchParams.get('page') || '1', 10) || 1,
      limit: Math.min(Math.max(parseInt(searchParams.get('limit') || '25', 10) || 25, 1), 50),
    }

    const validated = OpportunitiesQuerySchema.safeParse(rawInput)

    const params = validated.success ? validated.data : {
      search: '',
      category: 'All' as const,
      mode: 'All' as const,
      location: 'All' as const,
      isPaidOnly: false,
      closingSoonOnly: false,
      sort: 'latest' as const,
      page: 1,
      limit: 25,
    }

    const result = await getOpportunities({
      search: params.search,
      category: params.category as OpportunityCategory | 'All',
      mode: params.mode as OpportunityMode | 'All',
      location: params.location as OpportunityLocation | 'All',
      isPaidOnly: params.isPaidOnly,
      closingSoonOnly: params.closingSoonOnly,
      sort: params.sort,
      page: params.page,
      limit: params.limit
    })

    return NextResponse.json(result, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      }
    })
  } catch (err: any) {
    console.error("Opportunities API error:", err)
    return NextResponse.json(
      { error: "Failed to fetch opportunities" },
      { status: 500 }
    )
  }
}

import { Opportunity, OpportunityFilterParams, OpportunityStats } from "../types"
import { VERIFIED_OPPORTUNITIES } from "../data/verified-opportunities"
import { computeDaysRemaining, computeDynamicStatus } from "../validators"
import { deduplicateOpportunities } from "../deduplication"

// In-memory query cache for instant responses across concurrent requests
const serverQueryCache = new Map<string, { data: any, timestamp: number }>()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

export async function getOpportunities(params: OpportunityFilterParams = {}): Promise<{
  opportunities: Opportunity[]
  total: number
  stats: OpportunityStats
  page: number
  limit: number
}> {
  const cacheKey = JSON.stringify(params)
  const cached = serverQueryCache.get(cacheKey)
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.data
  }

  const {
    search = '',
    category = 'All',
    mode = 'All',
    location = 'All',
    isPaidOnly = false,
    closingSoonOnly = false,
    sort = 'latest',
    page = 1,
    limit = 20
  } = params

  // 1. Start from normalized & deduplicated verified opportunity records
  let dataset: Opportunity[] = deduplicateOpportunities(VERIFIED_OPPORTUNITIES).map(opp => ({
    ...opp,
    status: computeDynamicStatus(opp.registration_deadline)
  }))

  // 2. Compute dynamic stats across all valid active opportunities before filtering
  const activeOnly = dataset.filter(o => o.status !== 'Expired')
  const stats: OpportunityStats = {
    totalActive: activeOnly.length,
    hackathonsCount: activeOnly.filter(o => o.category === 'Hackathons').length,
    internshipsCount: activeOnly.filter(o => o.category === 'Internships').length,
    scholarshipsCount: activeOnly.filter(o => o.category === 'Scholarships').length,
    codingCompetitionsCount: activeOnly.filter(o => o.category === 'Coding Competitions').length,
    openSourceCount: activeOnly.filter(o => o.category === 'Open Source').length,
  }

  // 3. Exclude expired opportunities by default from search results
  let filtered = dataset.filter(o => o.status !== 'Expired')

  // 4. Apply Category Filter
  if (category && category !== 'All') {
    filtered = filtered.filter(o => o.category.toLowerCase() === category.toLowerCase())
  }

  // 5. Apply Mode Filter (Online / Offline / Hybrid)
  if (mode && mode !== 'All') {
    filtered = filtered.filter(o => o.mode.toLowerCase() === mode.toLowerCase())
  }

  // 6. Apply Location Filter
  if (location && location !== 'All') {
    const loc = location.toLowerCase()
    filtered = filtered.filter(o => {
      const oppLoc = (o.location || '').toLowerCase()
      if (loc === 'remote') return o.mode === 'Online' || oppLoc.includes('remote')
      if (loc === 'india') return oppLoc.includes('india') || oppLoc.includes('bengaluru') || oppLoc.includes('hyderabad') || oppLoc.includes('pune') || oppLoc.includes('nationwide')
      if (loc === 'international') return oppLoc.includes('global') || oppLoc.includes('worldwide') || oppLoc.includes('us')
      return true
    })
  }

  // 7. Apply Paid Only Filter
  if (isPaidOnly) {
    filtered = filtered.filter(o => o.is_paid || !!o.stipend || !!o.prize_pool)
  }

  // 8. Apply Closing Soon Only Filter
  if (closingSoonOnly) {
    filtered = filtered.filter(o => o.status === 'Closing Soon' || computeDaysRemaining(o.registration_deadline) <= 7)
  }

  // 9. Apply Search across title, organizer, category, skills, eligibility, description
  if (search && search.trim()) {
    const q = search.trim().toLowerCase()
    filtered = filtered.filter(o => {
      const matchTitle = o.title.toLowerCase().includes(q)
      const matchOrg = o.organizer.toLowerCase().includes(q)
      const matchCategory = o.category.toLowerCase().includes(q)
      const matchDesc = o.description.toLowerCase().includes(q)
      const matchEligibility = o.eligibility.toLowerCase().includes(q)
      const matchSkills = o.skills.some(s => s.toLowerCase().includes(q))
      return matchTitle || matchOrg || matchCategory || matchDesc || matchEligibility || matchSkills
    })
  }

  // 10. Sorting
  if (sort === 'closing-soon') {
    filtered.sort((a, b) => {
      const daysA = computeDaysRemaining(a.registration_deadline)
      const daysB = computeDaysRemaining(b.registration_deadline)
      return daysA - daysB
    })
  } else if (sort === 'most-relevant') {
    filtered.sort((a, b) => {
      // Prioritize featured, then active
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  } else {
    // Default: latest
    filtered.sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1
      if (!a.is_featured && b.is_featured) return 1
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    })
  }

  // 11. Pagination
  const total = filtered.length
  const startIndex = (page - 1) * limit
  const paginated = filtered.slice(startIndex, startIndex + limit)

  const responseData = {
    opportunities: paginated,
    total,
    stats,
    page,
    limit
  }

  // Cache in server memory
  serverQueryCache.set(cacheKey, {
    data: responseData,
    timestamp: Date.now()
  })

  // Prevent memory unbounded growth
  if (serverQueryCache.size > 200) {
    const oldestKey = serverQueryCache.keys().next().value
    if (oldestKey) serverQueryCache.delete(oldestKey)
  }

  return responseData
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const opp = VERIFIED_OPPORTUNITIES.find(o => o.id === id || o.slug === id)
  if (!opp) return null
  return {
    ...opp,
    status: computeDynamicStatus(opp.registration_deadline)
  }
}

import { Opportunity } from "../types"

export function generateCanonicalKey(opp: Partial<Opportunity>): string {
  const normTitle = (opp.title || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const normOrg = (opp.organizer || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  return `${normOrg}::${normTitle}`
}

export function deduplicateOpportunities(opportunities: Opportunity[]): Opportunity[] {
  const map = new Map<string, Opportunity>()

  for (const opp of opportunities) {
    const key = opp.external_id || generateCanonicalKey(opp)
    if (!map.has(key)) {
      map.set(key, opp)
    } else {
      // Keep whichever has richer data or fresher verification
      const existing = map.get(key)!
      if (new Date(opp.updated_at) > new Date(existing.updated_at)) {
        map.set(key, opp)
      }
    }
  }

  return Array.from(map.values())
}

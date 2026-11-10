import { Opportunity } from "../types"
import { VERIFIED_OPPORTUNITIES } from "../data/verified-opportunities"
import { deduplicateOpportunities } from "../deduplication"
import { normalizeOpportunity } from "../normalizers"
import { validateOpportunity } from "../validators"

export async function runOpportunitySync(): Promise<{
  syncedCount: number
  validCount: number
  timestamp: string
}> {
  console.log("[Opportunities Ingestion] Starting scheduled synchronization...")
  
  // 1. Gather all raw records from adapters and verified feeds
  const rawPool: Partial<Opportunity>[] = [...VERIFIED_OPPORTUNITIES]

  // 2. Validate records
  const validPool = rawPool.filter(validateOpportunity)

  // 3. Normalize all items
  const normalized = validPool.map(normalizeOpportunity)

  // 4. Deduplicate across sources
  const deduplicated = deduplicateOpportunities(normalized)

  console.log(`[Opportunities Ingestion] Successfully synced ${deduplicated.length} verified opportunities.`)

  return {
    syncedCount: deduplicated.length,
    validCount: validPool.length,
    timestamp: new Date().toISOString()
  }
}

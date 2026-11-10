import { Opportunity, OpportunityStatus } from "../types"

export function computeDaysRemaining(deadlineStr: string): number {
  if (!deadlineStr) return 999
  const now = new Date()
  const deadline = new Date(deadlineStr)
  const diffTime = deadline.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function computeDynamicStatus(deadlineStr: string): OpportunityStatus {
  const days = computeDaysRemaining(deadlineStr)
  if (days < 0) return 'Expired'
  if (days <= 7) return 'Closing Soon'
  return 'Active'
}

export function isValidUrl(urlStr?: string): boolean {
  if (!urlStr) return false
  try {
    const url = new URL(urlStr)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

export function validateOpportunity(opp: Partial<Opportunity>): boolean {
  if (!opp.title || !opp.organizer || !opp.category) return false
  if (!isValidUrl(opp.official_url) && !isValidUrl(opp.application_url)) return false
  return true
}

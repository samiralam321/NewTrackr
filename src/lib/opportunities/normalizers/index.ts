import { Opportunity } from "../types"
import { computeDynamicStatus } from "../validators"

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeOpportunity(raw: Partial<Opportunity>): Opportunity {
  const title = (raw.title || '').trim()
  const slug = raw.slug || slugify(title)
  const deadline = raw.registration_deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  const status = computeDynamicStatus(deadline)

  return {
    id: raw.id || `opp-${slug}-${Math.random().toString(36).substring(7)}`,
    title,
    slug,
    description: (raw.description || '').trim(),
    full_description: raw.full_description || raw.description || '',
    category: raw.category || 'Hackathons',
    organizer: (raw.organizer || 'Official Community').trim(),
    organizer_logo: raw.organizer_logo,
    official_url: raw.official_url || raw.application_url || '#',
    application_url: raw.application_url || raw.official_url || '#',
    location: raw.location || 'India / Remote',
    mode: raw.mode || 'Online',
    eligibility: raw.eligibility || 'Open to all college students',
    skills: raw.skills || [],
    prize_pool: raw.prize_pool || null,
    stipend: raw.stipend || null,
    registration_deadline: deadline,
    start_date: raw.start_date,
    end_date: raw.end_date,
    status,
    source_name: raw.source_name || 'Verified Source',
    source_url: raw.source_url || raw.official_url || '',
    external_id: raw.external_id,
    is_featured: !!raw.is_featured,
    is_paid: !!raw.is_paid || !!raw.stipend,
    last_verified_at: raw.last_verified_at || new Date().toISOString(),
    created_at: raw.created_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
}

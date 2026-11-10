export type OpportunityCategory = 
  | 'Hackathons'
  | 'Internships'
  | 'Scholarships'
  | 'Coding Competitions'
  | 'Fellowships'
  | 'Research'
  | 'Open Source'
  | 'Student Programs'

export type OpportunityMode = 'Online' | 'Offline' | 'Hybrid'
export type OpportunityLocation = 'India' | 'International' | 'Remote'
export type OpportunityStatus = 'Active' | 'Closing Soon' | 'Expired' | 'Unverified'

export interface Opportunity {
  id: string
  title: string
  slug: string
  description: string
  full_description?: string
  category: OpportunityCategory
  organizer: string
  organizer_logo?: string
  official_url: string
  application_url: string
  location: string
  mode: OpportunityMode
  eligibility: string
  skills: string[]
  prize_pool?: string | null
  stipend?: string | null
  registration_deadline: string // ISO date string (YYYY-MM-DD or full ISO)
  start_date?: string
  end_date?: string
  status: OpportunityStatus
  source_name: string
  source_url: string
  external_id?: string
  is_featured?: boolean
  is_paid?: boolean
  last_verified_at: string
  created_at: string
  updated_at: string
}

export interface OpportunityStats {
  totalActive: number
  hackathonsCount: number
  internshipsCount: number
  scholarshipsCount: number
  codingCompetitionsCount: number
  openSourceCount: number
}

export interface OpportunityFilterParams {
  search?: string
  category?: OpportunityCategory | 'All'
  mode?: OpportunityMode | 'All'
  location?: OpportunityLocation | 'All'
  isPaidOnly?: boolean
  closingSoonOnly?: boolean
  sort?: 'latest' | 'closing-soon' | 'most-relevant'
  page?: number
  limit?: number
}

export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  college: string | null
  consistency_score: number
  last_post_date: string | null
  badge_level: number | null
  badge_earned_at: string | null
  updated_at: string
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  tags: string[]
  time_spent: number | null
  type: 'Learned' | 'Built' | 'Practiced' | 'Other' | 'Quote' | 'Repost' | null
  created_at: string
  // Joined fields for UI
  profiles?: Profile
  likes?: { count: number }[] | number
  comments?: { count: number }[] | number
  user_has_liked?: boolean
  user_has_bookmarked?: boolean
  // Repost & Quote fields
  user_has_reposted?: boolean
  reposts_count?: number
  repost_of_id?: string | null
  quoted_post_id?: string | null
  quoted_post?: Post | null
  is_repost?: boolean
  reposted_by?: Profile | null
  reposted_at?: string | null
  feed_item_id?: string
}

export type Repost = {
  id: string
  post_id: string
  user_id: string
  created_at: string
  profiles?: Profile
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  profiles?: Profile
}

export type Like = {
  post_id: string
  user_id: string
  created_at: string
}

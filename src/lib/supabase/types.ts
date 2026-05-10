export type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  college: string | null
  consistency_score: number
  updated_at: string
}

export type Post = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  tags: string[]
  time_spent: number | null
  type: 'Learned' | 'Built' | 'Practiced' | 'Other' | null
  created_at: string
  // Joined fields for UI
  profiles?: Profile
  likes?: { count: number }[] | number
  comments?: { count: number }[] | number
  user_has_liked?: boolean
  user_has_bookmarked?: boolean
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

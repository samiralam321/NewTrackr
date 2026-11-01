export interface Profile {
  id: string
  full_name: string | null
  avatar_url: string | null
  bio?: string | null
  college?: string | null
  resume_url?: string | null
  resume_name?: string | null
  consistency_score: number
  streak: number
  challenge_rank: string
  badge_level: number
  followers_count?: number
  following_count?: number
  posts_count?: number
  is_following?: boolean
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url?: string | null
  tags: string[]
  time_spent?: number | null
  type?: 'Learned' | 'Built' | 'Practiced' | 'Other' | null
  created_at: string
  user?: Profile
  likes_count: number
  comments_count: number
  user_has_liked: boolean
  user_has_bookmarked: boolean
}

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user?: Profile
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  is_read: boolean
  created_at: string
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error'
}

export interface ConversationPreview {
  user: Profile
  last_message?: Message | null
  unread_count: number
  is_online: boolean
}

export interface NotificationItem {
  id: string
  user_id: string
  actor_id: string
  type: 'like' | 'comment' | 'follow' | 'mention' | 'badge'
  post_id?: string | null
  is_read: boolean
  created_at: string
  actor?: {
    full_name: string
    avatar_url?: string | null
  }
}

export interface Question {
  id: string
  topic: string
  difficulty: string
  question: string
  options: string[]
}

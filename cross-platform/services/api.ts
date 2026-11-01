import { useAuthStore } from '../store/authStore'
import { Post, Comment, Message, ConversationPreview, Profile, Question } from '../types'

// Dynamic API base URL: adapts for local development, mobile emulator, and production
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || "https://trackr-ten-eta.vercel.app/api/v1"

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${API_BASE_URL}${endpoint}`
  const response = await fetch(url, { ...options, headers })

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ detail: 'Network request failed' }))
    throw new Error(errorBody.detail || `Request failed with status ${response.status}`)
  }

  return response.json()
}

export const api = {
  // Posts & Feeds
  getFeed: (type: 'for-you' | 'following' | 'college', page = 1) =>
    apiRequest<Post[]>(`/posts/feed/${type}?page=${page}`),

  createPost: (content: string, type: string, tags: string[] = [], imageUrl?: string) =>
    apiRequest<Post>('/posts', {
      method: 'POST',
      body: JSON.stringify({ content, type, tags, image_url: imageUrl })
    }),

  toggleLike: (postId: string) =>
    apiRequest<{ active: boolean }>(`/posts/${postId}/like`, { method: 'POST' }),

  toggleBookmark: (postId: string) =>
    apiRequest<{ active: boolean }>(`/posts/${postId}/bookmark`, { method: 'POST' }),

  addComment: (postId: string, content: string) =>
    apiRequest<Comment>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content })
    }),

  // Messaging
  getConversations: () =>
    apiRequest<ConversationPreview[]>('/messages/conversations'),

  getChatHistory: (otherUserId: string) =>
    apiRequest<Message[]>(`/messages/chat/${otherUserId}`),

  sendMessage: (receiverId: string, content: string) =>
    apiRequest<Message>('/messages', {
      method: 'POST',
      body: JSON.stringify({ receiver_id: receiverId, content })
    }),

  markChatRead: (otherUserId: string) =>
    apiRequest<{ status: string }>(`/messages/chat/${otherUserId}/read`, { method: 'POST' }),

  searchStudents: (query: string) =>
    apiRequest<Profile[]>(`/messages/directory/search?query=${encodeURIComponent(query)}`),

  // Users & Profiles
  getProfile: (userId: string) =>
    apiRequest<Profile>(`/users/profile/${userId}`),

  toggleFollow: (targetUserId: string) =>
    apiRequest<{ is_following: boolean }>(`/users/follow/${targetUserId}`, { method: 'POST' }),

  getLeaderboard: () =>
    apiRequest<Profile[]>('/users/leaderboard'),

  // Challenges Arena
  getTodayQuestions: () =>
    apiRequest<Question[]>('/challenges/today'),

  submitChallenge: (challengeDate: string, timeTaken: number, answers: string[]) =>
    apiRequest<{ score: number, accuracy: number, new_streak: number, new_rank: string }>(
      '/challenges/submit',
      {
        method: 'POST',
        body: JSON.stringify({ challenge_date: challengeDate, time_taken: timeTaken, answers })
      }
    ),
}

import { supabase } from './supabase'
import { useAuthStore } from '../store/authStore'
import { Post, Comment, Message, ConversationPreview, Profile, Question } from '../types'

// Default fallback student ID if not logged in
const DEFAULT_USER_ID = "149304fc-ee0a-4980-83ed-9ed88cf48d6d"

function getCurrentUserId(): string {
  const storeUser = useAuthStore.getState().user
  return storeUser?.id || DEFAULT_USER_ID
}

export const api = {
  // ==========================================
  // POSTS & FEEDS
  // ==========================================
  getFeed: async (type: 'for-you' | 'following' | 'college' = 'for-you', page = 1): Promise<Post[]> => {
    try {
      const currentUid = getCurrentUserId()
      let query = supabase
        .from('posts')
        .select(`
          id,
          user_id,
          content,
          image_url,
          tags,
          type,
          created_at,
          profiles!posts_user_id_fkey (
            id,
            full_name,
            avatar_url,
            college,
            streak,
            consistency_score,
            badge_level
          ),
          likes (user_id),
          comments (id, user_id),
          bookmarks (user_id)
        `)
        .order('created_at', { ascending: false })
        .limit(30)

      if (type === 'following') {
        const { data: followRows } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', currentUid)
        const followingIds = followRows?.map((f: any) => f.following_id) || []
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds)
        }
      } else if (type === 'college') {
        const { data: prof } = await supabase
          .from('profiles')
          .select('college')
          .eq('id', currentUid)
          .single()
        if (prof?.college) {
          const { data: collegeProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('college', prof.college)
          const collegeIds = collegeProfiles?.map((c: any) => c.id) || []
          if (collegeIds.length > 0) {
            query = query.in('user_id', collegeIds)
          }
        }
      }

      const { data, error } = await query
      if (error) {
        console.warn('Supabase feed query error:', error)
        throw new Error(error.message)
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        content: row.content || '',
        image_url: row.image_url,
        tags: row.tags || [],
        type: row.type || 'Learned',
        created_at: row.created_at,
        likes_count: row.likes?.length || 0,
        comments_count: row.comments?.length || 0,
        bookmarks_count: row.bookmarks?.length || 0,
        user_has_liked: row.likes?.some((l: any) => l.user_id === currentUid) || false,
        user_has_bookmarked: row.bookmarks?.some((b: any) => b.user_id === currentUid) || false,
        user: {
          id: row.profiles?.id || row.user_id,
          full_name: row.profiles?.full_name || 'Trackr Student',
          avatar_url: row.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(row.profiles?.full_name || 'User')}&background=7C3AED&color=fff`,
          college: row.profiles?.college || 'Student Community',
          streak: row.profiles?.streak || row.profiles?.consistency_score || 0,
          consistency_score: row.profiles?.consistency_score || 0,
          badge_level: row.profiles?.badge_level || 0,
        }
      }))
    } catch (err: any) {
      console.error('getFeed failed:', err)
      return []
    }
  },

  createPost: async (content: string, type: string, tags: string[] = [], imageUri?: string): Promise<Post> => {
    const currentUid = getCurrentUserId()
    let imageUrl: string | null = null

    // Upload image to Supabase storage if provided
    if (imageUri && (imageUri.startsWith('file://') || imageUri.startsWith('ph://') || imageUri.startsWith('content://'))) {
      try {
        const fileExt = imageUri.split('.').pop() || 'jpg'
        const fileName = `${currentUid}-${Date.now()}.${fileExt}`
        
        const response = await fetch(imageUri)
        const blob = await response.blob()

        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('post_images')
          .upload(fileName, blob, { contentType: `image/${fileExt}` })

        if (!uploadErr && uploadData) {
          const { data: urlData } = supabase.storage
            .from('post_images')
            .getPublicUrl(fileName)
          imageUrl = urlData?.publicUrl || null
        }
      } catch (uploadException) {
        console.warn('Image upload error, continuing post without image:', uploadException)
      }
    } else if (imageUri) {
      imageUrl = imageUri
    }

    const { data: newPost, error } = await supabase
      .from('posts')
      .insert({
        user_id: currentUid,
        content,
        type,
        tags,
        image_url: imageUrl
      })
      .select(`
        id,
        user_id,
        content,
        image_url,
        tags,
        type,
        created_at,
        profiles!posts_user_id_fkey (*)
      `)
      .single()

    if (error) {
      console.error('Supabase createPost error:', error)
      throw new Error(error.message)
    }

    // Update user streak & consistency score
    try {
      const todayStr = new Date().toISOString().split('T')[0]
      const { data: prof } = await supabase
        .from('profiles')
        .select('consistency_score, last_post_date')
        .eq('id', currentUid)
        .single()

      if (prof) {
        let newStreak = (prof.consistency_score || 0) + 1
        await supabase
          .from('profiles')
          .update({ consistency_score: newStreak, last_post_date: todayStr })
          .eq('id', currentUid)
      }
    } catch (streakErr) {
      console.warn('Streak update error:', streakErr)
    }

    return {
      id: newPost.id,
      user_id: newPost.user_id,
      content: newPost.content,
      image_url: newPost.image_url,
      tags: newPost.tags || [],
      type: newPost.type,
      created_at: newPost.created_at,
      likes_count: 0,
      comments_count: 0,
      bookmarks_count: 0,
      user_has_liked: false,
      user_has_bookmarked: false,
      user: {
        id: newPost.profiles?.id || currentUid,
        full_name: newPost.profiles?.full_name || 'Trackr Student',
        avatar_url: newPost.profiles?.avatar_url || `https://ui-avatars.com/api/?name=User&background=7C3AED&color=fff`,
        college: newPost.profiles?.college || 'Student Community',
        streak: newPost.profiles?.streak || 1,
        consistency_score: newPost.profiles?.consistency_score || 1,
        badge_level: newPost.profiles?.badge_level || 0,
      }
    }
  },

  toggleLike: async (postId: string): Promise<{ active: boolean }> => {
    const currentUid = getCurrentUserId()
    const { data: existing } = await supabase
      .from('likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', currentUid)
      .maybeSingle()

    if (existing) {
      await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', currentUid)
      return { active: false }
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUid })
      return { active: true }
    }
  },

  toggleBookmark: async (postId: string): Promise<{ active: boolean }> => {
    const currentUid = getCurrentUserId()
    const { data: existing } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', currentUid)
      .maybeSingle()

    if (existing) {
      await supabase.from('bookmarks').delete().eq('post_id', postId).eq('user_id', currentUid)
      return { active: false }
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: currentUid })
      return { active: true }
    }
  },

  addComment: async (postId: string, content: string): Promise<Comment> => {
    const currentUid = getCurrentUserId()
    const { data, error } = await supabase
      .from('comments')
      .insert({ post_id: postId, user_id: currentUid, content })
      .select('*, profiles!comments_user_id_fkey(*)')
      .single()

    if (error) throw new Error(error.message)

    return {
      id: data.id,
      post_id: data.post_id,
      user_id: data.user_id,
      content: data.content,
      created_at: data.created_at,
      user: {
        id: data.profiles?.id || currentUid,
        full_name: data.profiles?.full_name || 'Student',
        avatar_url: data.profiles?.avatar_url || 'https://ui-avatars.com/api/?name=User&background=7C3AED&color=fff',
        college: data.profiles?.college || 'Trackr Student',
        streak: data.profiles?.consistency_score || 0,
        consistency_score: data.profiles?.consistency_score || 0,
        badge_level: data.profiles?.badge_level || 0,
      }
    }
  },

  // ==========================================
  // DIRECT MESSAGING
  // ==========================================
  getConversations: async (): Promise<ConversationPreview[]> => {
    try {
      const currentUid = getCurrentUserId()
      // Fetch recent messages involving this user
      const { data: messages } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles!messages_sender_id_fkey(*),
          receiver:profiles!messages_receiver_id_fkey(*)
        `)
        .or(`sender_id.eq.${currentUid},receiver_id.eq.${currentUid}`)
        .order('created_at', { ascending: false })
        .limit(100)

      if (!messages || messages.length === 0) return []

      // Group by conversation partner
      const convMap = new Map<string, ConversationPreview>()
      for (const msg of messages) {
        const isMe = msg.sender_id === currentUid
        const otherUser = isMe ? msg.receiver : msg.sender
        if (!otherUser || convMap.has(otherUser.id)) continue

        convMap.set(otherUser.id, {
          user: {
            id: otherUser.id,
            full_name: otherUser.full_name || 'Student',
            avatar_url: otherUser.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(otherUser.full_name || 'User')}&background=7C3AED&color=fff`,
            college: otherUser.college || 'Trackr Member',
            streak: otherUser.consistency_score || 0,
            consistency_score: otherUser.consistency_score || 0,
            badge_level: otherUser.badge_level || 0,
          },
          last_message: {
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            is_read: msg.is_read,
            created_at: msg.created_at,
          },
          unread_count: !isMe && !msg.is_read ? 1 : 0
        })
      }

      return Array.from(convMap.values())
    } catch (err) {
      console.warn('getConversations error:', err)
      return []
    }
  },

  getChatHistory: async (otherUserId: string): Promise<Message[]> => {
    const currentUid = getCurrentUserId()
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${currentUid},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUid})`)
      .order('created_at', { ascending: true })

    if (error) {
      console.warn('getChatHistory error:', error)
      return []
    }

    return (data || []).map((m: any) => ({
      id: m.id,
      sender_id: m.sender_id,
      receiver_id: m.receiver_id,
      content: m.content,
      is_read: m.is_read,
      created_at: m.created_at,
      status: 'sent' as const
    }))
  },

  sendMessage: async (receiverId: string, content: string): Promise<Message> => {
    const currentUid = getCurrentUserId()
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: currentUid,
        receiver_id: receiverId,
        content
      })
      .select('*')
      .single()

    if (error) {
      console.error('sendMessage error:', error)
      throw new Error(error.message)
    }

    return {
      id: data.id,
      sender_id: data.sender_id,
      receiver_id: data.receiver_id,
      content: data.content,
      is_read: false,
      created_at: data.created_at,
      status: 'sent'
    }
  },

  markChatRead: async (otherUserId: string): Promise<{ status: string }> => {
    const currentUid = getCurrentUserId()
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('sender_id', otherUserId)
      .eq('receiver_id', currentUid)
    return { status: 'ok' }
  },

  searchStudents: async (query: string): Promise<Profile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('full_name', `%${query}%`)
      .limit(15)

    return (data || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || 'Student',
      avatar_url: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'User')}&background=7C3AED&color=fff`,
      college: p.college || 'Trackr Student',
      streak: p.consistency_score || 0,
      consistency_score: p.consistency_score || 0,
      badge_level: p.badge_level || 0,
      bio: p.bio,
    }))
  },

  // ==========================================
  // PROFILES & LEADERBOARD
  // ==========================================
  getProfile: async (userId: string): Promise<Profile> => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error || !data) throw new Error('Profile not found')

    return {
      id: data.id,
      full_name: data.full_name || 'Student',
      avatar_url: data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || 'User')}&background=7C3AED&color=fff`,
      college: data.college || 'Trackr Student',
      streak: data.consistency_score || 0,
      consistency_score: data.consistency_score || 0,
      badge_level: data.badge_level || 0,
      bio: data.bio,
    }
  },

  toggleFollow: async (targetUserId: string): Promise<{ is_following: boolean }> => {
    const currentUid = getCurrentUserId()
    const { data: existing } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', currentUid)
      .eq('following_id', targetUserId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', currentUid)
        .eq('following_id', targetUserId)
      return { is_following: false }
    } else {
      await supabase
        .from('follows')
        .insert({ follower_id: currentUid, following_id: targetUserId })
      return { is_following: true }
    }
  },

  getLeaderboard: async (): Promise<Profile[]> => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('consistency_score', { ascending: false })
      .limit(20)

    return (data || []).map((p: any) => ({
      id: p.id,
      full_name: p.full_name || 'Student',
      avatar_url: p.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(p.full_name || 'User')}&background=7C3AED&color=fff`,
      college: p.college || 'Trackr Student',
      streak: p.consistency_score || 0,
      consistency_score: p.consistency_score || 0,
      badge_level: p.badge_level || 0,
    }))
  },

  // ==========================================
  // ARENA CHALLENGES
  // ==========================================
  getTodayQuestions: async (): Promise<Question[]> => {
    const { data } = await supabase
      .from('questions')
      .select('*')
      .limit(5)

    return (data || []).map((q: any) => ({
      id: q.id,
      topic: q.topic,
      difficulty: q.difficulty,
      question: q.question,
      options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
      correct_answer: q.correct_answer,
    }))
  },

  submitChallenge: async (challengeDate: string, timeTaken: number, answers: string[]) => {
    return {
      score: 50,
      accuracy: 100,
      new_streak: 3,
      new_rank: 'Silver'
    }
  }
}

import React, { useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Platform, Share } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Post } from '../../types'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'

interface PostCardProps {
  post: Post
  onCommentPress?: () => void
}

function formatRelativeTime(dateString?: string): string {
  if (!dateString) return 'Just now'
  const now = Date.now()
  const date = new Date(dateString).getTime()
  if (isNaN(date)) return 'Just now'
  const diffSec = Math.floor((now - date) / 1000)

  if (diffSec < 60) return 'Just now'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHrs = Math.floor(diffMin / 60)
  if (diffHrs < 24) return `${diffHrs}h ago`
  const diffDays = Math.floor(diffHrs / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function PostCard({ post, onCommentPress }: PostCardProps) {
  const [hasLiked, setHasLiked] = useState(post.user_has_liked)
  const [likesCount, setLikesCount] = useState(post.likes_count)
  const [hasBookmarked, setHasBookmarked] = useState(post.user_has_bookmarked)

  const handleLike = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    const nextState = !hasLiked
    setHasLiked(nextState)
    setLikesCount((prev) => (nextState ? prev + 1 : Math.max(0, prev - 1)))

    try {
      await api.toggleLike(post.id)
    } catch {
      // Revert on error
      setHasLiked(!nextState)
      setLikesCount((prev) => (nextState ? prev - 1 : prev + 1))
    }
  }

  const handleBookmark = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    const nextState = !hasBookmarked
    setHasBookmarked(nextState)

    try {
      await api.toggleBookmark(post.id)
    } catch {
      setHasBookmarked(!nextState)
    }
  }

  const handleShare = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    try {
      await Share.share({
        message: `${post.user?.full_name || 'Trackr Student'}: "${post.content}"\n\nShared via Trackr`,
        url: post.image_url || undefined,
      })
    } catch (e) {
      console.warn('Share dismissed or failed:', e)
    }
  }

  const getCategoryBadge = (type?: string | null) => {
    switch (type) {
      case 'Learned':
        return { label: '💡 Learned', bg: 'rgba(139, 92, 246, 0.15)', text: '#A78BFA', border: 'rgba(139, 92, 246, 0.3)' }
      case 'Built':
        return { label: '🚀 Built', bg: 'rgba(16, 185, 129, 0.15)', text: '#34D399', border: 'rgba(16, 185, 129, 0.3)' }
      case 'Practiced':
        return { label: '🎯 Practiced', bg: 'rgba(249, 115, 22, 0.15)', text: '#FB923C', border: 'rgba(249, 115, 22, 0.3)' }
      default:
        return { label: '📝 Other', bg: 'rgba(59, 130, 246, 0.15)', text: '#60A5FA', border: 'rgba(59, 130, 246, 0.3)' }
    }
  }

  const category = getCategoryBadge(post.type)
  const timeFormatted = formatRelativeTime(post.created_at)

  return (
    <View style={styles.card}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Image
            source={{
              uri:
                post.user?.avatar_url ||
                `https://ui-avatars.com/api/?name=${encodeURIComponent(post.user?.full_name || 'User')}&background=7C3AED&color=fff`,
            }}
            style={styles.avatar}
          />
          <View style={styles.authorMeta}>
            <View style={styles.nameRow}>
              <Text style={styles.authorName} numberOfLines={1}>
                {post.user?.full_name || 'Trackr Student'}
              </Text>
              {post.user?.badge_level ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              ) : null}
            </View>
            <View style={styles.subMetaRow}>
              <Text style={styles.authorCollege} numberOfLines={1}>
                {post.user?.college || 'Community Member'}
              </Text>
              <Text style={styles.dotSeparator}>•</Text>
              <Text style={styles.timestamp}>{timeFormatted}</Text>
            </View>
          </View>
        </View>

        {/* Category Pill */}
        <View style={[styles.categoryPill, { backgroundColor: category.bg, borderColor: category.border }]}>
          <Text style={[styles.categoryText, { color: category.text }]}>{category.label}</Text>
        </View>
      </View>

      {/* Post Text Content */}
      <Text style={styles.content}>{post.content}</Text>

      {/* Attached Media */}
      {post.image_url ? (
        <View style={styles.imageContainer}>
          <Image source={{ uri: post.image_url }} style={styles.postImage} resizeMode="cover" />
        </View>
      ) : null}

      {/* Action Footer */}
      <View style={styles.footer}>
        <Pressable onPress={handleLike} style={styles.actionButton} hitSlop={8}>
          <Ionicons
            name={hasLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={hasLiked ? '#EF4444' : '#94A3B8'}
          />
          {likesCount > 0 ? (
            <Text style={[styles.actionCount, hasLiked && { color: '#EF4444' }]}>
              {likesCount}
            </Text>
          ) : null}
        </Pressable>

        <Pressable onPress={onCommentPress} style={styles.actionButton} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={19} color="#94A3B8" />
          {post.comments_count > 0 ? (
            <Text style={styles.actionCount}>{post.comments_count}</Text>
          ) : null}
        </Pressable>

        <Pressable onPress={handleBookmark} style={styles.actionButton} hitSlop={8}>
          <Ionicons
            name={hasBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={19}
            color={hasBookmarked ? '#8B5CF6' : '#94A3B8'}
          />
        </Pressable>

        <Pressable onPress={handleShare} style={styles.actionButton} hitSlop={8}>
          <Ionicons name="share-outline" size={19} color="#94A3B8" />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#14131E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1F1E2E',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  authorMeta: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  authorName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  authorCollege: {
    fontSize: 11.5,
    color: '#94A3B8',
    maxWidth: 130,
  },
  dotSeparator: {
    fontSize: 11,
    color: '#64748B',
  },
  timestamp: {
    fontSize: 11.5,
    color: '#94A3B8',
  },
  badgePill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 9,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginLeft: 8,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#E2E8F0',
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    maxHeight: 280,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  postImage: {
    width: '100%',
    height: 220,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 6,
    paddingHorizontal: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
})

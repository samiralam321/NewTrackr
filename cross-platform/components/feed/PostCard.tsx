import React, { useState } from 'react'
import { View, Text, Image, Pressable, StyleSheet, Platform } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Post } from '../../types'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'

interface PostCardProps {
  post: Post
  onCommentPress?: () => void
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

  const getCategoryBadge = (type?: string | null) => {
    switch (type) {
      case 'Learned': return { label: '💡 Learned', bg: 'rgba(124, 58, 237, 0.12)', text: '#A78BFA' }
      case 'Built': return { label: '🚀 Built', bg: 'rgba(16, 185, 129, 0.12)', text: '#34D399' }
      case 'Practiced': return { label: '🎯 Practiced', bg: 'rgba(234, 88, 12, 0.12)', text: '#FB923C' }
      default: return { label: '📝 Progress', bg: 'rgba(156, 163, 175, 0.12)', text: '#9CA3AF' }
    }
  }

  const category = getCategoryBadge(post.type)

  return (
    <View style={styles.card}>
      {/* Post Header */}
      <View style={styles.header}>
        <View style={styles.authorRow}>
          <Image
            source={{ uri: post.user?.avatar_url || `https://ui-avatars.com/api/?name=${post.user?.full_name || 'User'}&background=7C3AED&color=fff` }}
            style={styles.avatar}
          />
          <View>
            <View style={styles.nameRow}>
              <Text style={styles.authorName}>{post.user?.full_name || 'Student'}</Text>
              {post.user?.badge_level ? (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>✓</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.authorCollege}>{post.user?.college || 'Trackr Student'}</Text>
          </View>
        </View>

        {/* Category Pill */}
        <View style={[styles.categoryPill, { backgroundColor: category.bg }]}>
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
        <Pressable onPress={handleLike} style={styles.actionButton}>
          <Ionicons
            name={hasLiked ? 'heart' : 'heart-outline'}
            size={19}
            color={hasLiked ? Colors.dark.error : Colors.dark.textSecondary}
          />
          {likesCount > 0 ? (
            <Text style={[styles.actionCount, hasLiked && { color: Colors.dark.error }]}>
              {likesCount}
            </Text>
          ) : null}
        </Pressable>

        <Pressable onPress={onCommentPress} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={18} color={Colors.dark.textSecondary} />
          {post.comments_count > 0 ? (
            <Text style={styles.actionCount}>{post.comments_count}</Text>
          ) : null}
        </Pressable>

        <Pressable onPress={handleBookmark} style={styles.actionButton}>
          <Ionicons
            name={hasBookmarked ? 'bookmark' : 'bookmark-outline'}
            size={18}
            color={hasBookmarked ? Colors.dark.primary : Colors.dark.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    padding: 16,
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
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceSecondary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  authorCollege: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 1,
  },
  badgePill: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.dark.primary,
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
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    fontSize: 14.5,
    lineHeight: 22,
    color: Colors.dark.textPrimary,
    marginBottom: 12,
  },
  imageContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    maxHeight: 320,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  postImage: {
    width: '100%',
    height: 240,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    paddingTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  actionCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
})

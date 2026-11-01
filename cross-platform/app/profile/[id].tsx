import React from 'react'
import { View, Text, Image, Pressable, StyleSheet, FlatList, ActivityIndicator } from 'react-native'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function ProfileScreen() {
  const router = useRouter()
  const { id } = useLocalSearchParams<{ id: string }>()
  const currentUser = useAuthStore((state) => state.user)

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['profile', id],
    queryFn: () => (id ? api.getProfile(id) : Promise.reject('No ID')),
    enabled: !!id,
  })

  if (isLoading || !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    )
  }

  const isMe = currentUser?.id === profile.id

  const handleFollowToggle = async () => {
    if (isMe) return
    try {
      await api.toggleFollow(profile.id)
      refetch()
    } catch (e) {
      console.error('Follow error:', e)
    }
  }

  return (
    <ResponsiveContainer>
      <View style={styles.container}>
        {/* Profile Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>{profile.full_name}</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <Image
            source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.full_name}&background=7C3AED&color=fff` }}
            style={styles.avatarLarge}
          />
          <Text style={styles.name}>{profile.full_name}</Text>
          <Text style={styles.college}>{profile.college || 'Trackr Student'}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

          {/* Stats Counters */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>🔥 {profile.streak}</Text>
              <Text style={styles.statLabel}>Streak</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.consistency_score}</Text>
              <Text style={styles.statLabel}>Score</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.followers_count || 0}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </View>
          </View>

          {/* Follow / Edit Button */}
          {!isMe && (
            <Pressable
              onPress={handleFollowToggle}
              style={[styles.followBtn, profile.is_following && styles.followingBtn]}
            >
              <Text style={[styles.followBtnText, profile.is_following && styles.followingBtnText]}>
                {profile.is_following ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </ResponsiveContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  centerContainer: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileCard: {
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: Colors.dark.primary,
  },
  name: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  college: {
    fontSize: 13,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  bio: {
    fontSize: 13.5,
    color: Colors.dark.textPrimary,
    textAlign: 'center',
    marginTop: 10,
    maxWidth: 300,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    width: '100%',
    justifyContent: 'center',
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  followBtn: {
    marginTop: 20,
    backgroundColor: Colors.dark.primary,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followingBtn: {
    backgroundColor: Colors.dark.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  followBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  followingBtnText: {
    color: Colors.dark.textSecondary,
  },
})

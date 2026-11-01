import React, { useState } from 'react'
import { View, Text, FlatList, Pressable, StyleSheet, RefreshControl, Platform } from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { PostCard } from '../../components/feed/PostCard'
import { QuickShareCard } from '../../components/composer/QuickShareCard'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function HomeFeedScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'college'>('for-you')

  const { data: posts = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['feed', activeTab],
    queryFn: () => api.getFeed(activeTab),
  })

  const tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'following', label: 'Following' },
    { id: 'college', label: 'College' },
  ] as const

  const handleFabPress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
    router.push('/modal/compose')
  }

  return (
    <ResponsiveContainer
      rightSidebar={
        <QuickShareCard onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['feed'] })} />
      }
    >
      <View style={styles.feedWrapper}>
        {/* Header Bar */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greetingTitle}>
              {user ? `Hey, ${user.full_name?.split(' ')[0]}` : 'Welcome to Trackr'}
            </Text>
            <Text style={styles.greetingSubtitle}>Let's make today count.</Text>
          </View>

          {user && (
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>🔥 {user.streak}</Text>
            </View>
          )}
        </View>

        {/* Feed Tabs */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Posts Stream */}
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PostCard post={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={Colors.dark.primary}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Mobile Floating Action Button (FAB) */}
        <Pressable onPress={handleFabPress} style={styles.fab}>
          <Ionicons name="pencil" size={24} color="#FFFFFF" />
        </Pressable>
      </View>
    </ResponsiveContainer>
  )
}

const styles = StyleSheet.create({
  feedWrapper: {
    flex: 1,
    backgroundColor: Colors.dark.background,
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
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: Colors.dark.streakBg,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  streakText: {
    color: Colors.dark.streak,
    fontWeight: '800',
    fontSize: 12,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 8,
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 18,
  },
  tabBtnActive: {
    backgroundColor: Colors.dark.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContent: {
    paddingBottom: 90,
  },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'web' ? 24 : 80,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: Colors.dark.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
})

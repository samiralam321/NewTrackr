import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  RefreshControl,
  Platform,
  Image,
  ActivityIndicator,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { PostCard } from '../../components/feed/PostCard'
import { QuickShareCard } from '../../components/composer/QuickShareCard'
import { api } from '../../services/api'
import { useAuthStore } from '../../store/authStore'

export default function HomeFeedScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'college'>('for-you')

  const {
    data: posts = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
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

  const handleTabChange = (tabId: 'for-you' | 'following' | 'college') => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    setActiveTab(tabId)
  }

  // Calculate dynamic bottom spacing for FAB
  const fabBottom = 16 + Math.max(insets.bottom, 12)

  return (
    <ResponsiveContainer
      rightSidebar={
        <QuickShareCard onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['feed'] })} />
      }
    >
      <View style={styles.feedWrapper}>
        {/* Compact Mobile Header Bar */}
        <View style={styles.header}>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingTitle}>
              {user?.full_name ? `Hey, ${user.full_name.split(' ')[0]} 👋` : 'Welcome to Trackr 👋'}
            </Text>
            <Text style={styles.greetingSubtitle}>Let's make today count.</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakText}>
                🔥 {user?.streak || user?.consistency_score || 2}d
              </Text>
            </View>

            <Image
              source={{
                uri:
                  user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=7C3AED&color=fff`,
              }}
              style={styles.headerAvatar}
            />
          </View>
        </View>

        {/* Feed Tabs Pill Selector */}
        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleTabChange(tab.id)}
                style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                hitSlop={6}
              >
                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Feed Posts List */}
        {isLoading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#8B5CF6" />
            <Text style={styles.loadingText}>Loading community updates...</Text>
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <PostCard post={item} />}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#8B5CF6"
                colors={['#8B5CF6']}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="sparkles" size={32} color="#8B5CF6" />
                </View>
                <Text style={styles.emptyTitle}>Nothing here yet</Text>
                <Text style={styles.emptySubtitle}>
                  Your learning journey starts with your next update. Share what you learned, built, or practiced!
                </Text>
                <Pressable onPress={handleFabPress} style={styles.emptyActionBtn}>
                  <Ionicons name="add" size={18} color="#FFFFFF" />
                  <Text style={styles.emptyActionText}>Share your progress</Text>
                </Pressable>
              </View>
            }
          />
        )}

        {/* Mobile Floating Action Button (FAB) */}
        <Pressable
          onPress={handleFabPress}
          style={[styles.fab, { bottom: fabBottom }]}
          hitSlop={8}
        >
          <Ionicons name="pencil" size={22} color="#FFFFFF" />
        </Pressable>
      </View>
    </ResponsiveContainer>
  )
}

const styles = StyleSheet.create({
  feedWrapper: {
    flex: 1,
    backgroundColor: '#07060A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  greetingContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  streakText: {
    color: '#FB923C',
    fontWeight: '800',
    fontSize: 12,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 10,
    backgroundColor: '#0A0910',
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabBtnActive: {
    backgroundColor: '#8B5CF6',
  },
  tabLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    color: '#94A3B8',
  },
  listContent: {
    paddingTop: 10,
    paddingBottom: 96,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginHorizontal: 16,
    marginTop: 40,
    backgroundColor: '#111019',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
    color: '#94A3B8',
    textAlign: 'center',
    maxWidth: 280,
    marginBottom: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#8B5CF6',
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  fab: {
    position: 'absolute',
    right: 18,
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#8B5CF6',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
})

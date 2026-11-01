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
import { useAppTheme } from '../../store/themeStore'

export default function HomeFeedScreen() {
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const { colors, isDark, toggleTheme } = useAppTheme()
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

  const handleToggleTheme = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
    toggleTheme()
  }

  // Calculate dynamic bottom spacing for FAB
  const fabBottom = 16 + Math.max(insets.bottom, 12)

  return (
    <ResponsiveContainer
      rightSidebar={
        <QuickShareCard onPostCreated={() => queryClient.invalidateQueries({ queryKey: ['feed'] })} />
      }
    >
      <View style={[styles.feedWrapper, { backgroundColor: colors.background }]}>
        {/* Compact Mobile Header Bar */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingTitle, { color: colors.textPrimary }]}>
              {user?.full_name ? `Hey, ${user.full_name.split(' ')[0]} 👋` : 'Welcome to Trackr 👋'}
            </Text>
            <Text style={[styles.greetingSubtitle, { color: colors.textMuted }]}>Let's make today count.</Text>
          </View>

          <View style={styles.headerRight}>
            {/* Theme Toggle Button (Light / Dark Switch) */}
            <Pressable
              onPress={handleToggleTheme}
              style={[
                styles.themeToggleBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                },
              ]}
              hitSlop={6}
            >
              <Ionicons
                name={isDark ? 'sunny' : 'moon'}
                size={18}
                color={isDark ? '#FBBF24' : '#6366F1'}
              />
            </Pressable>

            {/* Streak Badge */}
            <View style={[styles.streakBadge, { backgroundColor: colors.streakBg, borderColor: colors.streakBorder }]}>
              <Text style={[styles.streakText, { color: colors.streak }]}>
                🔥 {user?.streak || user?.consistency_score || 2}d
              </Text>
            </View>

            {/* User Avatar */}
            <Image
              source={{
                uri:
                  user?.avatar_url ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.full_name || 'User')}&background=7C3AED&color=fff`,
              }}
              style={[styles.headerAvatar, { borderColor: colors.border }]}
            />
          </View>
        </View>

        {/* Feed Tabs Pill Selector */}
        <View style={[styles.tabRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleTabChange(tab.id)}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isActive
                      ? colors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.05)'
                      : '#F1F5F9',
                    borderColor: isActive
                      ? colors.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : '#E2E8F0',
                  },
                ]}
                hitSlop={6}
              >
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: isActive ? '#FFFFFF' : colors.textSecondary,
                      fontWeight: isActive ? '700' : '600',
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            )
          })}
        </View>

        {/* Feed Posts List */}
        {isLoading && posts.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading community updates...</Text>
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
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={[styles.emptyCard, { backgroundColor: colors.cardBg, borderColor: colors.cardBorder }]}>
                <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : '#F5F3FF' }]}>
                  <Ionicons name="sparkles" size={32} color={colors.primary} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Nothing here yet</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  Your learning journey starts with your next update. Share what you learned, built, or practiced!
                </Text>
                <Pressable onPress={handleFabPress} style={[styles.emptyActionBtn, { backgroundColor: colors.primary }]}>
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
          style={[styles.fab, { bottom: fabBottom, backgroundColor: colors.primary, shadowColor: colors.primary }]}
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  greetingContainer: {
    flex: 1,
  },
  greetingTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  greetingSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeToggleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
  },
  streakText: {
    fontWeight: '800',
    fontSize: 12,
  },
  headerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    gap: 8,
    paddingVertical: 10,
  },
  tabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  tabLabel: {
    fontSize: 12.5,
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
    borderRadius: 20,
    borderWidth: 1,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    lineHeight: 20,
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
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
})

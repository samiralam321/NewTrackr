import React, { useState } from 'react'
import {
  View,
  Text,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  RefreshControl,
  Platform,
} from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { api } from '../../services/api'
import { Profile } from '../../types'
import { useAppTheme } from '../../store/themeStore'

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('')
  const { colors, isDark } = useAppTheme()

  const {
    data: leaderboard = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['leaderboard'],
    queryFn: () => api.getLeaderboard(),
  })

  const { data: searchResults = [] } = useQuery({
    queryKey: ['studentSearch', searchQuery],
    queryFn: () => api.searchStudents(searchQuery),
    enabled: searchQuery.trim().length > 0,
  })

  const displayList: Profile[] = searchQuery.trim().length > 0 ? searchResults : leaderboard

  const getRankBadge = (index: number) => {
    if (index === 0) return { icon: '🥇', bg: isDark ? 'rgba(234, 179, 8, 0.15)' : '#FEF9C3', text: '#CA8A04' }
    if (index === 1) return { icon: '🥈', bg: isDark ? 'rgba(148, 163, 184, 0.15)' : '#F1F5F9', text: '#64748B' }
    if (index === 2) return { icon: '🥉', bg: isDark ? 'rgba(249, 115, 22, 0.15)' : '#FFEDD5', text: '#EA580C' }
    return { icon: `#${index + 1}`, bg: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC', text: colors.textMuted }
  }

  return (
    <ResponsiveContainer>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header Bar */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Explore Campus</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Discover top student builders and streaks</Text>

          {/* Search Box */}
          <View
            style={[
              styles.searchBox,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                borderColor: colors.border,
              },
            ]}
          >
            <Ionicons name="search" size={18} color={colors.textMuted} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search students by name or college..."
              placeholderTextColor={colors.textMuted}
              style={[styles.searchInput, { color: colors.textPrimary }]}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={6}
              >
                <Ionicons name="close-circle" size={18} color={colors.textMuted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Ionicons
            name={searchQuery.trim().length > 0 ? 'people' : 'trophy'}
            size={18}
            color={colors.primary}
          />
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            {searchQuery.trim().length > 0 ? 'Search Results' : 'Consistency Leaderboard'}
          </Text>
        </View>

        {/* List of Students */}
        <FlatList
          data={displayList}
          keyExtractor={(item) => item.id}
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
          renderItem={({ item, index }) => {
            const rank = getRankBadge(index)
            return (
              <View
                style={[
                  styles.studentCard,
                  {
                    backgroundColor: colors.cardBg,
                    borderColor: colors.cardBorder,
                  },
                ]}
              >
                {searchQuery.trim().length === 0 && (
                  <View style={[styles.rankPill, { backgroundColor: rank.bg }]}>
                    <Text style={[styles.rankText, { color: rank.text }]}>{rank.icon}</Text>
                  </View>
                )}

                <Image
                  source={{
                    uri:
                      item.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.full_name || 'User')}&background=7C3AED&color=fff`,
                  }}
                  style={[styles.studentAvatar, { borderColor: colors.border }]}
                />

                <View style={styles.studentInfo}>
                  <Text style={[styles.studentName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {item.full_name || 'Student'}
                  </Text>
                  <Text style={[styles.studentCollege, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.college || 'Trackr Campus'}
                  </Text>
                </View>

                <View style={[styles.streakBadge, { backgroundColor: colors.streakBg, borderColor: colors.streakBorder }]}>
                  <Text style={[styles.streakScore, { color: colors.streak }]}>
                    🔥 {item.consistency_score || item.streak || 0}
                  </Text>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={36} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No students found matching "{searchQuery}"
              </Text>
            </View>
          }
        />
      </View>
    </ResponsiveContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 90,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  rankPill: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankText: {
    fontSize: 13,
    fontWeight: '700',
  },
  studentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 10,
    borderWidth: 1,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
  },
  studentCollege: {
    fontSize: 11.5,
    marginTop: 2,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  streakScore: {
    fontSize: 12,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
  },
})

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

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('')

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
    if (index === 0) return { icon: '🥇', bg: 'rgba(234, 179, 8, 0.15)', text: '#FBBF24' }
    if (index === 1) return { icon: '🥈', bg: 'rgba(148, 163, 184, 0.15)', text: '#CBD5E1' }
    if (index === 2) return { icon: '🥉', bg: 'rgba(249, 115, 22, 0.15)', text: '#FB923C' }
    return { icon: `#${index + 1}`, bg: 'rgba(255, 255, 255, 0.05)', text: '#94A3B8' }
  }

  return (
    <ResponsiveContainer>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Explore Campus</Text>
          <Text style={styles.headerSubtitle}>Discover top student builders and streaks</Text>

          {/* Search Box */}
          <View style={styles.searchBox}>
            <Ionicons name="search" size={18} color="#94A3B8" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search students by name or college..."
              placeholderTextColor="#64748B"
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => setSearchQuery('')}
                hitSlop={6}
              >
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Section Heading */}
        <View style={styles.sectionHeader}>
          <Ionicons
            name={searchQuery.trim().length > 0 ? 'people' : 'trophy'}
            size={18}
            color="#8B5CF6"
          />
          <Text style={styles.sectionTitle}>
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
              tintColor="#8B5CF6"
              colors={['#8B5CF6']}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => {
            const rank = getRankBadge(index)
            return (
              <View style={styles.studentCard}>
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
                  style={styles.studentAvatar}
                />

                <View style={styles.studentInfo}>
                  <Text style={styles.studentName} numberOfLines={1}>
                    {item.full_name || 'Student'}
                  </Text>
                  <Text style={styles.studentCollege} numberOfLines={1}>
                    {item.college || 'Trackr Campus'}
                  </Text>
                </View>

                <View style={styles.streakBadge}>
                  <Text style={styles.streakScore}>🔥 {item.consistency_score || item.streak || 0}</Text>
                </View>
              </View>
            )
          }}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={36} color="#64748B" />
              <Text style={styles.emptyText}>No students found matching "{searchQuery}"</Text>
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
    backgroundColor: '#07060A',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    backgroundColor: '#0A0910',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    fontSize: 12.5,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#FFFFFF',
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
    color: '#E2E8F0',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingBottom: 90,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#12111A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
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
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  studentCollege: {
    fontSize: 11.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  streakBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(249, 115, 22, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.3)',
  },
  streakScore: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FB923C',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    gap: 10,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748B',
  },
})

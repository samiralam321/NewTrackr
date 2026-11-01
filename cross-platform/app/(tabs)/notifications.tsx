import React from 'react'
import { View, Text, FlatList, StyleSheet, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { useAppTheme } from '../../store/themeStore'
import { Colors } from '../../theme/colors'
import { NotificationItem } from '../../types'

export default function NotificationsScreen() {
  const { colors } = useAppTheme()
  const { data: notifications = [], refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      return [] as NotificationItem[]
    },
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Ionicons name="heart" size={16} color={colors.error} />
      case 'comment': return <Ionicons name="chatbubble" size={16} color="#3B82F6" />
      case 'follow': return <Ionicons name="person-add" size={16} color="#10B981" />
      case 'badge': return <Ionicons name="ribbon" size={16} color="#F59E0B" />
      default: return <Ionicons name="notifications" size={16} color={colors.primary} />
    }
  }

  return (
    <ResponsiveContainer>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={44} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>All caught up!</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
              You will be notified here when students like, comment, or follow you.
            </Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 90 }}
            renderItem={({ item }) => (
              <View style={[styles.notifItem, { borderBottomColor: colors.border }]}>
                <View style={[styles.iconCircle, { backgroundColor: colors.surfaceSecondary }]}>
                  {getNotificationIcon(item.type)}
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.actorName, { color: colors.textPrimary }]}>{item.actor?.full_name || 'Student'}</Text>
                  <Text style={[styles.notifText, { color: colors.textSecondary }]}>
                    {item.type === 'like' && 'liked your progress update.'}
                    {item.type === 'comment' && 'commented on your post.'}
                    {item.type === 'follow' && 'started following your consistency journey.'}
                    {item.type === 'badge' && 'You earned a new verification badge!'}
                  </Text>
                </View>
              </View>
            )}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor={colors.primary}
              />
            }
          />
        )}
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
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  actorName: {
    fontSize: 13,
    fontWeight: '700',
  },
  notifText: {
    fontSize: 12,
    marginTop: 2,
  },
})

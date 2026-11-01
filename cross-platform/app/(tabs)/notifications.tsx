import React from 'react'
import { View, Text, FlatList, Image, StyleSheet, RefreshControl } from 'react-native'
import { useQuery } from '@tanstack/react-query'
import { Ionicons } from '@expo/vector-icons'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'
import { NotificationItem } from '../../types'

export default function NotificationsScreen() {
  const { data: notifications = [], refetch, isRefetching } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      // Mock / API call
      return [] as NotificationItem[]
    },
  })

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like': return <Ionicons name="heart" size={16} color={Colors.dark.error} />
      case 'comment': return <Ionicons name="chatbubble" size={16} color="#3B82F6" />
      case 'follow': return <Ionicons name="person-add" size={16} color="#10B981" />
      case 'badge': return <Ionicons name="ribbon" size={16} color="#F59E0B" />
      default: return <Ionicons name="notifications" size={16} color={Colors.dark.primary} />
    }
  }

  return (
    <ResponsiveContainer>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={44} color={Colors.dark.textMuted} />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You will be notified here when students like, comment, or follow you.</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.notifItem}>
                <View style={styles.iconCircle}>
                  {getNotificationIcon(item.type)}
                </View>
                <View style={styles.notifContent}>
                  <Text style={styles.actorName}>{item.actor?.full_name || 'Student'}</Text>
                  <Text style={styles.notifText}>
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
                tintColor={Colors.dark.primary}
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
    backgroundColor: Colors.dark.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 12.5,
    color: Colors.dark.textMuted,
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
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifContent: {
    flex: 1,
  },
  actorName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  notifText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
})

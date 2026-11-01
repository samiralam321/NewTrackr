import React from 'react'
import { View, Text, Pressable, StyleSheet, Image } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Colors } from '../../theme/colors'
import { useAuthStore } from '../../store/authStore'

export function DesktopSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((state) => state.user)

  const navItems = [
    { name: 'Home', path: '/', icon: 'home', iconOutline: 'home-outline' },
    { name: 'Arena', path: '/challenges', icon: 'trophy', iconOutline: 'trophy-outline' },
    { name: 'Messages', path: '/messages', icon: 'chatbubbles', iconOutline: 'chatbubbles-outline' },
    { name: 'Notifications', path: '/notifications', icon: 'notifications', iconOutline: 'notifications-outline' },
    { name: 'Profile', path: user ? `/profile/${user.id}` : '/profile', icon: 'person', iconOutline: 'person-outline' },
  ] as const

  return (
    <View style={styles.sidebar}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>T</Text>
        </View>
        <Text style={styles.brandTitle}>Trackr</Text>
      </View>

      {/* Navigation Links */}
      <View style={styles.navLinks}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path))
          return (
            <Pressable
              key={item.name}
              onPress={() => router.push(item.path as any)}
              style={({ hovered }: any) => [
                styles.navItem,
                isActive && styles.navItemActive,
                hovered && !isActive && styles.navItemHovered,
              ]}
            >
              <Ionicons
                name={isActive ? item.icon : item.iconOutline}
                size={20}
                color={isActive ? '#FFFFFF' : Colors.dark.textSecondary}
              />
              <Text style={[styles.navText, isActive && styles.navTextActive]}>
                {item.name}
              </Text>
            </Pressable>
          )
        })}
      </View>

      {/* User Mini Profile Card */}
      {user && (
        <View style={styles.userCard}>
          <Image
            source={{ uri: user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=7C3AED&color=fff` }}
            style={styles.avatar}
          />
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {user.full_name}
            </Text>
            <Text style={styles.userStreak}>
              🔥 {user.streak} day streak
            </Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.surface,
    height: '100%',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.dark.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 18,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  navLinks: {
    flex: 1,
    gap: 6,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    transitionDuration: '150ms',
  },
  navItemActive: {
    backgroundColor: Colors.dark.primary,
  },
  navItemHovered: {
    backgroundColor: Colors.dark.surfaceSecondary,
  },
  navText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.dark.textSecondary,
  },
  navTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userStreak: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.dark.streak,
    marginTop: 2,
  },
})

import React from 'react'
import { Tabs } from 'expo-router'
import { useWindowDimensions, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useAppTheme } from '../../store/themeStore'

export default function TabLayout() {
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const { colors, isDark } = useAppTheme()
  const isDesktop = width >= 768

  // Calculate safe bottom padding so navigation never collides with Android 3-button bar or home gestures
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 22 : 10)
  const tabHeight = isDesktop ? 0 : 54 + bottomInset

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.tabBarBg,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: tabHeight,
          display: isDesktop ? 'none' : 'flex',
          paddingBottom: bottomInset,
          paddingTop: 6,
          elevation: isDark ? 12 : 6,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: isDark ? 0.35 : 0.08,
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          justifyContent: 'center',
          alignItems: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'compass' : 'compass-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'notifications' : 'notifications-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  )
}

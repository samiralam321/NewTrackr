import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { Colors } from '../../theme/colors'

export default function ExploreScreen() {
  return (
    <ResponsiveContainer>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="compass" size={48} color={Colors.dark.primary} />
        </View>
        <Text style={styles.title}>Discover More</Text>
        <Text style={styles.subtitle}>
          Explore trending student breakthroughs, community projects, and campus study streaks across colleges.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🚀 Expanding Soon</Text>
        </View>
      </View>
    </ResponsiveContainer>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    marginBottom: 24,
  },
  badge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
})

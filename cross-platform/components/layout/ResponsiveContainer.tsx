import React from 'react'
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { DesktopSidebar } from './DesktopSidebar'
import { useAppTheme } from '../../store/themeStore'

interface ResponsiveContainerProps {
  children: React.ReactNode
  rightSidebar?: React.ReactNode
  showDesktopSidebar?: boolean
}

export function ResponsiveContainer({ 
  children, 
  rightSidebar,
  showDesktopSidebar = true 
}: ResponsiveContainerProps) {
  const { width } = useWindowDimensions()
  const { colors } = useAppTheme()
  const isDesktop = width >= 768

  if (isDesktop && showDesktopSidebar) {
    return (
      <View style={[styles.desktopWrapper, { backgroundColor: colors.background }]}>
        {/* Left Column: Responsive Desktop Navigation */}
        <DesktopSidebar />

        {/* Center Column: Feed & Main Application Canvas */}
        <View style={[styles.desktopMainContent, { borderRightColor: colors.border }]}>
          {children}
        </View>

        {/* Right Column: Contextual Quick Share & Community Widgets */}
        {rightSidebar && (
          <View style={styles.desktopRightColumn}>
            {rightSidebar}
          </View>
        )}
      </View>
    )
  }

  // Mobile Native Layout: Edge-to-edge safe area
  return (
    <SafeAreaView edges={['top', 'left', 'right']} style={[styles.mobileWrapper, { backgroundColor: colors.background }]}>
      {children}
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  desktopWrapper: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    height: '100%',
    width: '100%',
  },
  desktopMainContent: {
    flex: 1,
    maxWidth: 720,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
    height: '100%',
  },
  desktopRightColumn: {
    width: 340,
    paddingHorizontal: 16,
    paddingTop: 24,
    height: '100%',
  },
  mobileWrapper: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  }
})

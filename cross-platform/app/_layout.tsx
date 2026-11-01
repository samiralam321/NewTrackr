import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { wsService } from '../services/websocket'
import { api } from '../services/api'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes
      retry: 2,
    },
  },
})

export default function RootLayout() {
  const token = useAuthStore((state) => state.token)

  // Initialize active user profile on app startup
  useEffect(() => {
    const initProfile = async () => {
      try {
        const profile = await api.getProfile('149304fc-ee0a-4980-83ed-9ed88cf48d6d')
        if (profile) {
          useAuthStore.getState().setAuth('session-active', profile)
        }
      } catch (e) {
        console.warn('Initial profile load notice:', e)
      }
    }
    initProfile()
  }, [])

  // Connect to FastAPI WebSocket Gateway when authenticated
  useEffect(() => {
    if (token) {
      wsService.connect()
    }
    return () => {
      wsService.disconnect()
    }
  }, [token])

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#07060A' },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="modal/call"
            options={{ presentation: 'fullScreenModal', animation: 'fade' }}
          />
          <Stack.Screen
            name="modal/compose"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  )
}

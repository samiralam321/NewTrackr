import { create } from 'zustand'
import { Colors } from '../theme/colors'

export type ThemeMode = 'light' | 'dark'

interface ThemeState {
  theme: ThemeMode
  toggleTheme: () => void
  setTheme: (mode: ThemeMode) => void
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light', // Default to light mode matching Trackr web!
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setTheme: (mode) => set({ theme: mode }),
}))

export function useAppTheme() {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'
  const colors = isDark ? Colors.dark : Colors.light

  return { theme, isDark, colors, toggleTheme }
}

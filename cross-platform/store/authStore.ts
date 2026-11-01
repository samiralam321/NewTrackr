import { create } from 'zustand'
import { Profile } from '../types'

interface AuthState {
  token: string | null
  user: Profile | null
  isAuthenticated: boolean
  setAuth: (token: string, user: Profile) => void
  updateProfile: (partial: Partial<Profile>) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,

  setAuth: (token, user) => set({ token, user, isAuthenticated: true }),

  updateProfile: (partial) => set((state) => ({
    user: state.user ? { ...state.user, ...partial } : null
  })),

  logout: () => set({ token: null, user: null, isAuthenticated: false }),
}))

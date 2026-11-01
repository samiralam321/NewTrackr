import { create } from 'zustand'

interface PresenceState {
  onlineUserIds: Set<string>
  typingUsers: Record<string, boolean> // user_id -> isTyping
  setOnline: (userId: string) => void
  setOffline: (userId: string) => void
  setBulkOnline: (userIds: string[]) => void
  setUserTyping: (userId: string, isTyping: boolean) => void
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUserIds: new Set<string>(),
  typingUsers: {},

  setOnline: (userId) => set((state) => {
    const next = new Set(state.onlineUserIds)
    next.add(userId)
    return { onlineUserIds: next }
  }),

  setOffline: (userId) => set((state) => {
    const next = new Set(state.onlineUserIds)
    next.delete(userId)
    return { onlineUserIds: next }
  }),

  setBulkOnline: (userIds) => set(() => ({
    onlineUserIds: new Set(userIds)
  })),

  setUserTyping: (userId, isTyping) => set((state) => ({
    typingUsers: { ...state.typingUsers, [userId]: isTyping }
  })),
}))

export interface CallSession {
  targetUserId: string
  targetUserName: string
  targetUserAvatar?: string | null
  isIncoming: boolean
  mediaType: 'audio' | 'video'
  status: 'calling' | 'ringing' | 'connected' | 'ended'
}

interface CallState {
  activeCall: CallSession | null
  isMuted: boolean
  isVideoEnabled: boolean
  startCall: (session: CallSession) => void
  setCallStatus: (status: CallSession['status']) => void
  toggleMute: () => void
  toggleVideo: () => void
  endCall: () => void
}

export const useCallStore = create<CallState>((set) => ({
  activeCall: null,
  isMuted: false,
  isVideoEnabled: true,

  startCall: (session) => set({ activeCall: session, isMuted: false, isVideoEnabled: session.mediaType === 'video' }),
  setCallStatus: (status) => set((state) => ({
    activeCall: state.activeCall ? { ...state.activeCall, status } : null
  })),
  toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
  toggleVideo: () => set((state) => ({ isVideoEnabled: !state.isVideoEnabled })),
  endCall: () => set({ activeCall: null }),
}))

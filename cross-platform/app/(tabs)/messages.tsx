import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  FlatList,
  Pressable,
  Image,
  StyleSheet,
  useWindowDimensions,
  TextInput,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { ResponsiveContainer } from '../../components/layout/ResponsiveContainer'
import { MessageBubble } from '../../components/messages/MessageBubble'
import { ChatInput } from '../../components/messages/ChatInput'
import { Colors } from '../../theme/colors'
import { api } from '../../services/api'
import { wsService } from '../../services/websocket'
import { useAuthStore } from '../../store/authStore'
import { usePresenceStore, useCallStore } from '../../store/presenceStore'
import { ConversationPreview, Message, Profile } from '../../types'

export default function MessagesScreen() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { width } = useWindowDimensions()
  const isDesktop = width >= 768

  const currentUser = useAuthStore((state) => state.user)
  const isUserTyping = usePresenceStore((state) => state.typingUsers)
  const startCall = useCallStore((state) => state.startCall)

  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchingDirectory, setIsSearchingDirectory] = useState(false)
  const flatListRef = useRef<FlatList>(null)

  // Fetch active conversations
  const { data: conversations = [], refetch: refetchConversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations(),
  })

  // Fetch directory search matches
  const { data: directoryResults = [] } = useQuery({
    queryKey: ['directorySearch', searchQuery],
    queryFn: () => api.searchStudents(searchQuery),
    enabled: searchQuery.trim().length > 0,
  })

  // Fetch chat history for selected user
  const { data: messages = [], refetch: refetchMessages } = useQuery({
    queryKey: ['messages', selectedUser?.id],
    queryFn: () => (selectedUser ? api.getChatHistory(selectedUser.id) : Promise.resolve([])),
    enabled: !!selectedUser,
  })

  // Listen to incoming WebSocket messages
  useEffect(() => {
    const unsubscribe = wsService.addListener((event) => {
      if (event.type === 'chat_message') {
        const newMsg: Message = event.data
        if (selectedUser && (newMsg.sender_id === selectedUser.id || newMsg.receiver_id === selectedUser.id)) {
          queryClient.setQueryData(['messages', selectedUser.id], (old: Message[] = []) => [...old, newMsg])
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        refetchConversations()
      }
    })
    return unsubscribe
  }, [selectedUser])

  // Auto-select first conversation on desktop
  useEffect(() => {
    if (isDesktop && !selectedUser && conversations.length > 0) {
      setSelectedUser(conversations[0].user)
    }
  }, [isDesktop, conversations])

  const handleSendMessage = async (text: string) => {
    if (!selectedUser) return
    const tempMsg: Message = {
      id: Math.random().toString(),
      sender_id: currentUser?.id || 'me',
      receiver_id: selectedUser.id,
      content: text,
      is_read: false,
      created_at: new Date().toISOString(),
      status: 'sending',
    }

    // Optimistic update
    queryClient.setQueryData(['messages', selectedUser.id], (old: Message[] = []) => [...old, tempMsg])
    flatListRef.current?.scrollToEnd({ animated: true })

    try {
      await api.sendMessage(selectedUser.id, text)
      refetchMessages()
      refetchConversations()
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleStartCall = (mediaType: 'audio' | 'video') => {
    if (!selectedUser) return
    startCall({
      targetUserId: selectedUser.id,
      targetUserName: selectedUser.full_name || 'Student',
      targetUserAvatar: selectedUser.avatar_url,
      isIncoming: false,
      mediaType,
      status: 'calling',
    })

    // Send call initiation signal over WebSocket
    wsService.send({
      type: 'call_request',
      target_user_id: selectedUser.id,
      media_type: mediaType,
      data: {
        caller_name: currentUser?.full_name,
        caller_avatar: currentUser?.avatar_url,
      },
    })

    router.push('/modal/call')
  }

  // Conversation List Sidebar
  const renderConversationList = () => (
    <View style={[styles.listPanel, isDesktop && styles.listPanelDesktop]}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color={Colors.dark.textMuted} style={styles.searchIcon} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search chats or find students..."
          placeholderTextColor={Colors.dark.textMuted}
          style={styles.searchInput}
        />
      </View>

      {/* Directory Search Results */}
      {searchQuery.trim().length > 0 ? (
        <FlatList
          data={directoryResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                setSelectedUser(item)
                setSearchQuery('')
              }}
              style={styles.directoryItem}
            >
              <Image
                source={{ uri: item.avatar_url || `https://ui-avatars.com/api/?name=${item.full_name}&background=7C3AED&color=fff` }}
                style={styles.avatar}
              />
              <View style={styles.convoInfo}>
                <Text style={styles.convoName}>{item.full_name}</Text>
                <Text style={styles.convoCollege}>{item.college || 'Trackr Student'}</Text>
              </View>
              <Text style={styles.msgBadgeText}>Message</Text>
            </Pressable>
          )}
        />
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.user.id}
          ListEmptyComponent={
            <View style={styles.emptyConversations}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="chatbubbles-outline" size={32} color="#8B5CF6" />
              </View>
              <Text style={styles.emptyConvoTitle}>No messages yet</Text>
              <Text style={styles.emptyConvoSubtitle}>
                Search for classmates or peers above to collaborate and track progress together.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = selectedUser?.id === item.user.id
            return (
              <Pressable
                onPress={() => setSelectedUser(item.user)}
                style={[styles.convoItem, isSelected && styles.convoItemActive]}
              >
                <View style={styles.avatarContainer}>
                  <Image
                    source={{ uri: item.user.avatar_url || `https://ui-avatars.com/api/?name=${item.user.full_name}&background=7C3AED&color=fff` }}
                    style={styles.avatar}
                  />
                  {item.is_online && <View style={styles.onlineDot} />}
                </View>

                <View style={styles.convoInfo}>
                  <Text style={[styles.convoName, isSelected && { color: '#FFFFFF' }]}>
                    {item.user.full_name}
                  </Text>
                  <Text style={styles.convoPreview} numberOfLines={1}>
                    {item.last_message?.content || 'Start conversation...'}
                  </Text>
                </View>

                {item.unread_count > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{item.unread_count}</Text>
                  </View>
                )}
              </Pressable>
            )
          }}
        />
      )}
    </View>
  )

  // Active Chat Panel
  const renderChatPanel = () => {
    if (!selectedUser) {
      return (
        <View style={styles.emptyChat}>
          <Ionicons name="chatbubbles-outline" size={48} color={Colors.dark.textMuted} />
          <Text style={styles.emptyTitle}>Your Messages</Text>
          <Text style={styles.emptyDesc}>Select a student or search to start collaborating.</Text>
        </View>
      )
    }

    const typingNow = isUserTyping[selectedUser.id]

    return (
      <View style={styles.chatPanel}>
        {/* Chat Header */}
        <View style={styles.chatHeader}>
          <View style={styles.chatHeaderUser}>
            {!isDesktop && (
              <Pressable onPress={() => setSelectedUser(null)} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
              </Pressable>
            )}
            <Image
              source={{ uri: selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.full_name}&background=7C3AED&color=fff` }}
              style={styles.avatarSmall}
            />
            <View>
              <Text style={styles.chatHeaderName}>{selectedUser.full_name}</Text>
              <Text style={styles.chatHeaderStatus}>
                {selectedUser.college || 'Trackr Student'}
              </Text>
            </View>
          </View>

          {/* WebRTC Audio / Video Call Actions */}
          <View style={styles.callActions}>
            <Pressable onPress={() => handleStartCall('audio')} style={styles.callBtn}>
              <Ionicons name="call-outline" size={20} color={Colors.dark.primary} />
            </Pressable>
            <Pressable onPress={() => handleStartCall('video')} style={styles.callBtn}>
              <Ionicons name="videocam-outline" size={22} color={Colors.dark.primary} />
            </Pressable>
          </View>
        </View>

        {/* Message Stream */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} isMe={item.sender_id === currentUser?.id} />
          )}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />

        {/* Typing indicator */}
        {typingNow && (
          <View style={styles.typingIndicator}>
            <Text style={styles.typingText}>{selectedUser.full_name} is typing...</Text>
          </View>
        )}

        {/* Input Composer */}
        <ChatInput
          onSendMessage={handleSendMessage}
          targetUserId={selectedUser.id}
          targetUserName={selectedUser.full_name || 'Student'}
        />
      </View>
    )
  }

  return (
    <ResponsiveContainer showDesktopSidebar={true}>
      <View style={styles.container}>
        {isDesktop ? (
          <View style={styles.splitView}>
            {renderConversationList()}
            {renderChatPanel()}
          </View>
        ) : selectedUser ? (
          renderChatPanel()
        ) : (
          renderConversationList()
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
  splitView: {
    flex: 1,
    flexDirection: 'row',
  },
  listPanel: {
    flex: 1,
    backgroundColor: Colors.dark.surface,
  },
  listPanelDesktop: {
    maxWidth: 320,
    borderRightWidth: 1,
    borderRightColor: Colors.dark.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: Colors.dark.surfaceSecondary,
    margin: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
  },
  convoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  convoItemActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.dark.primary,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: Colors.dark.surface,
  },
  convoInfo: {
    flex: 1,
  },
  convoName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: Colors.dark.textPrimary,
  },
  convoCollege: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    marginTop: 2,
  },
  convoPreview: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    marginTop: 3,
  },
  unreadBadge: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  directoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 12,
  },
  msgBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.dark.primary,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  chatPanel: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  chatHeaderUser: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 4,
    marginRight: 4,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  chatHeaderName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: Colors.dark.textMuted,
  },
  callActions: {
    flexDirection: 'row',
    gap: 12,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(124, 58, 237, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  typingIndicator: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  typingText: {
    fontSize: 11,
    color: Colors.dark.textMuted,
    fontStyle: 'italic',
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12.5,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 240,
  },
  emptyConversations: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    marginTop: 40,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyConvoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  emptyConvoSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    color: Colors.dark.textMuted,
    textAlign: 'center',
    maxWidth: 260,
  },
})

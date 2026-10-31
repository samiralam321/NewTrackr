'use client'

import { useEffect, useState, useRef, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Send, 
  Search, 
  MessageCircle, 
  ChevronLeft, 
  Plus, 
  Smile, 
  Info, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  CheckCheck, 
  X, 
  ShieldAlert, 
  Flame, 
  GraduationCap, 
  SlidersHorizontal,
  ExternalLink,
  ChevronRight
} from "lucide-react"
import { usePresence } from "@/components/providers/presence-provider"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

type Profile = {
  id: string
  full_name: string
  avatar_url: string
  college?: string
  consistency_score?: number
  badge_level?: number
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  is_read?: boolean
}

function MessagesContent() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState<"all" | "unread">("all")
  const [latestMessages, setLatestMessages] = useState<Record<string, Message>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  
  // Real-Time Typing Indicators & Details Panel
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showDetailsPanel, setShowDetailsPanel] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const supabase = createClient()
  const onlineUsers = usePresence()
  const searchParams = useSearchParams()
  const targetUserId = searchParams.get('userId')
  
  const selectUserAndUrl = (user: Profile | null) => {
    setSelectedUser(user)
    if (typeof window !== 'undefined') {
      if (user) {
        window.history.pushState(null, '', `/messages?userId=${user.id}`)
      } else {
        window.history.pushState(null, '', `/messages`)
      }
    }
  }

  const commonEmojis = ["👍", "❤️", "😂", "🔥", "🚀", "🎉", "💡", "🙌", "✨", "💯"]

  // Initialize Auth & Conversation List
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
        // Fetch all conversations involving current user
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
        
        const activeUserIds = new Set<string>()
        if (targetUserId) {
          activeUserIds.add(targetUserId)
        }

        const latest: Record<string, Message> = {}
        const unreads: Record<string, number> = {}
        const stored = typeof window !== 'undefined' ? localStorage.getItem('trackr_read_timestamps') : null
        const readTimestamps = stored ? JSON.parse(stored) : {}

        if (msgs) {
          msgs.forEach(m => {
            const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
            activeUserIds.add(otherId)
            if (!latest[otherId]) {
              latest[otherId] = m
            }
            if (m.sender_id !== user.id) {
              const lastRead = readTimestamps[otherId] || 0
              if (new Date(m.created_at).getTime() > new Date(lastRead).getTime() && !m.is_read) {
                unreads[otherId] = (unreads[otherId] || 0) + 1
              }
            }
          })
          setLatestMessages(latest)
          setUnreadCounts(unreads)
        }

        // Fetch user profiles for active conversations
        if (activeUserIds.size > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, college, consistency_score, badge_level')
            .in('id', Array.from(activeUserIds))
          
          if (profilesData) {
            setUsers(profilesData)
            if (targetUserId) {
              const foundUser = profilesData.find(u => u.id === targetUserId)
              if (foundUser) {
                setSelectedUser(foundUser)
              }
            }
          }
        } else {
          setUsers([])
        }
      }
    }

    init()
  }, [targetUserId])

  const markAsRead = (otherUserId: string) => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('trackr_read_timestamps') : null
    const readTimestamps = stored ? JSON.parse(stored) : {}
    readTimestamps[otherUserId] = new Date().toISOString()
    if (typeof window !== 'undefined') {
      localStorage.setItem('trackr_read_timestamps', JSON.stringify(readTimestamps))
    }
    setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }))

    // Sync database read receipt
    if (currentUser) {
      supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', currentUser.id)
        .eq('sender_id', otherUserId)
        .then(() => {})
    }
  }

  // Global Realtime Updates for Incoming Messages
  useEffect(() => {
    if (!currentUser) return

    const channel = supabase
      .channel(`global-messages:${currentUser.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages'
      }, async (payload) => {
        const newMsg = payload.new as Message
        
        if (newMsg.sender_id === currentUser.id || newMsg.receiver_id === currentUser.id) {
          const otherId = newMsg.sender_id === currentUser.id ? newMsg.receiver_id : newMsg.sender_id
          
          setLatestMessages(prev => ({ ...prev, [otherId]: newMsg }))
          
          setUsers(prev => {
            const exists = prev.some(u => u.id === otherId)
            if (!exists) {
              supabase
                .from('profiles')
                .select('id, full_name, avatar_url, college, consistency_score, badge_level')
                .eq('id', otherId)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setUsers(current => {
                      if (!current.some(u => u.id === otherId)) {
                        return [...current, data]
                      }
                      return current
                    })
                  }
                })
            }
            return prev
          })

          if (newMsg.sender_id !== currentUser.id && selectedUser?.id !== otherId) {
            setUnreadCounts(prev => ({ ...prev, [otherId]: (prev[otherId] || 0) + 1 }))
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [currentUser, selectedUser])

  // Active Conversation Realtime Subscription & Live Typing Channel
  useEffect(() => {
    if (!currentUser || !selectedUser) return

    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id})`)
        .order('created_at', { ascending: true })
      
      if (data) setMessages(data)
      scrollToBottom()
    }

    fetchMessages()

    // 1. Postgres Changes for direct messages
    const chatDbChannel = supabase
      .channel(`chat-db:${currentUser.id}-${selectedUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `receiver_id=eq.${currentUser.id}`
      }, (payload) => {
        const newMsg = payload.new as Message
        if (newMsg.sender_id === selectedUser.id) {
          setMessages(prev => {
            if (prev.some(m => m.id === newMsg.id)) return prev
            return [...prev, newMsg]
          })
          markAsRead(selectedUser.id)
          scrollToBottom()
        }
      })
      .subscribe()

    // 2. Realtime Broadcast Channel for Live Typing Indicators
    const typingRoom = [currentUser.id, selectedUser.id].sort().join('-')
    const typingChannel = supabase
      .channel(`typing:${typingRoom}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.senderId === selectedUser.id) {
          setIsOtherUserTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherUserTyping(false)
          }, 2500)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(chatDbChannel)
      supabase.removeChannel(typingChannel)
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    }
  }, [currentUser, selectedUser])

  useEffect(() => {
    if (selectedUser) {
      markAsRead(selectedUser.id)
    }
  }, [selectedUser, messages])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
      }
    }, 80)
  }

  // Broadcast typing event to partner
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value)

    if (currentUser && selectedUser) {
      const typingRoom = [currentUser.id, selectedUser.id].sort().join('-')
      supabase.channel(`typing:${typingRoom}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { senderId: currentUser.id }
      })
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return

    const messageText = newMessage
    setNewMessage("")

    // Optimistic UI update for instant feedback
    const optimisticMessage: Message = {
      id: Math.random().toString(),
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: messageText,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setLatestMessages(prev => ({ ...prev, [selectedUser.id]: optimisticMessage }))
    scrollToBottom()

    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: messageText
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !currentUser || !selectedUser) return
    
    setIsUploading(true)
    const tempUrl = URL.createObjectURL(file)

    const optimisticMessage: Message = {
      id: Math.random().toString(),
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: `[IMAGE]: ${tempUrl}`,
      created_at: new Date().toISOString()
    }
    
    setMessages(prev => [...prev, optimisticMessage])
    setLatestMessages(prev => ({ ...prev, [selectedUser.id]: optimisticMessage }))
    scrollToBottom()

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `chat-${currentUser.id}-${Math.random()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('post_images')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('post_images')
        .getPublicUrl(fileName)
      
      const publicUrl = data.publicUrl

      await supabase.from('messages').insert({
        sender_id: currentUser.id,
        receiver_id: selectedUser.id,
        content: `[IMAGE]: ${publicUrl}`
      })
    } catch (err) {
      console.error("Failed to upload image:", err)
      alert("Failed to send image.")
    } finally {
      setIsUploading(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false
    
    if (activeTab === 'unread') {
      return (unreadCounts[u.id] || 0) > 0
    }
    return true
  })

  const formatTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ""
    }
  }

  // Extract shared images from current conversation
  const sharedImages = messages
    .filter(m => m.content.startsWith('[IMAGE]: '))
    .map(m => m.content.replace('[IMAGE]: ', ''))

  return (
    <div className="flex h-screen bg-[#FDFCFE] dark:bg-[#07060A] text-gray-900 dark:text-white transition-colors">
      
      {/* ──────────────────────────────────────────────────────────────────
          PANEL 1: CONVERSATIONS LIST (320px - 380px)
          Hidden on mobile when chat is active
          ────────────────────────────────────────────────────────────────── */}
      <aside 
        className={`w-full md:w-[320px] lg:w-[360px] flex-col border-r border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] shrink-0 transition-all ${
          selectedUser ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-4 border-b border-gray-100 dark:border-[#2D2B3B] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link href="/dashboard" className="md:hidden p-1.5 -ml-1 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24]">
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Messages</h1>
            </div>
            <div className="text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2.5 py-1 rounded-full">
              {users.length} active
            </div>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search students..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 bg-gray-50/80 dark:bg-[#15141D] border border-gray-200/70 dark:border-[#2D2B3B] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-gray-400 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 p-0.5 bg-gray-100/70 dark:bg-[#15141D] rounded-lg">
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                activeTab === 'all' 
                  ? 'bg-white dark:bg-[#201F2C] text-gray-900 dark:text-white shadow-xs' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'unread' 
                  ? 'bg-white dark:bg-[#201F2C] text-gray-900 dark:text-white shadow-xs' 
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <span>Unread</span>
              {Object.values(unreadCounts).reduce((a, b) => a + b, 0) > 0 && (
                <span className="w-4 h-4 bg-violet-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {Object.values(unreadCounts).reduce((a, b) => a + b, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Conversation Items */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-hide pb-20 md:pb-2">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 px-4 text-center">
              <div className="w-12 h-12 bg-gray-50 dark:bg-[#15141D] rounded-full flex items-center justify-center mb-2 border border-gray-100 dark:border-[#2D2B3B]">
                <MessageCircle className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {activeTab === 'unread' ? "No unread conversations" : "No students found"}
              </p>
            </div>
          ) : (
            [...filteredUsers]
              .sort((a, b) => {
                const lastMsgA = latestMessages[a.id]
                const lastMsgB = latestMessages[b.id]
                const timeA = lastMsgA ? new Date(lastMsgA.created_at).getTime() : (a.id === targetUserId ? Date.now() : 0)
                const timeB = lastMsgB ? new Date(lastMsgB.created_at).getTime() : (b.id === targetUserId ? Date.now() : 0)
                return timeB - timeA
              })
              .map((user) => {
                const isSelected = selectedUser?.id === user.id
                const lastMsg = latestMessages[user.id]
                const unread = unreadCounts[user.id] || 0
                const isOnline = onlineUsers.includes(user.id)
                const timeText = lastMsg ? formatTime(lastMsg.created_at) : ""
                const previewText = lastMsg 
                  ? (lastMsg.content.startsWith('[IMAGE]:') ? '📷 Photo' : lastMsg.content) 
                  : "Start a conversation"

                return (
                  <button
                    key={user.id}
                    onClick={() => selectUserAndUrl(user)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left relative ${
                      isSelected 
                        ? 'bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-900/40 shadow-xs' 
                        : 'hover:bg-gray-50 dark:hover:bg-[#15141D] border border-transparent'
                    }`}
                  >
                    {/* User Avatar with Presence Dot */}
                    <div className="relative shrink-0">
                      <img 
                        src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=7C3AED&color=fff`} 
                        alt="" 
                        className="w-11 h-11 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                      />
                      {isOnline && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-[#0B0A10] rounded-full" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-bold truncate ${isSelected ? 'text-violet-900 dark:text-violet-200' : 'text-gray-900 dark:text-white'}`}>
                          {user.full_name}
                        </span>
                        <span className="text-[10.5px] font-medium text-gray-400 shrink-0">
                          {timeText}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={`text-[11.5px] truncate pr-2 ${
                          unread > 0 
                            ? 'text-gray-900 dark:text-white font-bold' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`}>
                          {previewText}
                        </p>
                        {unread > 0 && !isSelected && (
                          <span className="w-4.5 h-4.5 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
                            {unread}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                )
              })
          )}
        </div>
      </aside>

      {/* ──────────────────────────────────────────────────────────────────
          PANEL 2: ACTIVE CONVERSATION (Center)
          ────────────────────────────────────────────────────────────────── */}
      <main className={`flex-1 flex flex-col h-[100dvh] md:h-screen relative overflow-hidden bg-[#FCFBFE] dark:bg-[#07060A] ${
        selectedUser ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Top Bar Header */}
            <div className="px-4 py-3 border-b border-gray-100 dark:border-[#2D2B3B] bg-white/90 dark:bg-[#0B0A10]/90 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => selectUserAndUrl(null)}
                  className="md:hidden p-1.5 -ml-1 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A24] rounded-full"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="relative">
                  <img 
                    src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.full_name || 'User'}&background=7C3AED&color=fff`} 
                    alt="" 
                    className="w-9 h-9 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                  />
                  {onlineUsers.includes(selectedUser.id) && (
                    <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0B0A10] rounded-full" />
                  )}
                </div>

                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                    {selectedUser.full_name}
                  </h2>
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    {onlineUsers.includes(selectedUser.id) ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active now</span>
                    ) : (
                      selectedUser.college || "Trackr Student"
                    )}
                  </p>
                </div>
              </div>

              {/* Toggle Conversation Details Button */}
              <button 
                onClick={() => setShowDetailsPanel(!showDetailsPanel)}
                className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all ${
                  showDetailsPanel 
                    ? 'bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/60 dark:text-violet-300 dark:border-violet-800' 
                    : 'border-gray-200 dark:border-[#2D2B3B] text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title="View details"
              >
                <Info className="w-4 h-4" />
              </button>
            </div>

            {/* Chat Messages Body */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-3.5 scrollbar-hide">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6">
                  <div className="w-14 h-14 bg-violet-50 dark:bg-violet-950/30 rounded-full flex items-center justify-center mb-3">
                    <MessageCircle className="w-7 h-7 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">This is the beginning of your chat</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Share daily code achievements, ask technical interview questions, or collaborate.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser?.id
                  const isSameSenderAsPrev = idx > 0 && messages[idx - 1].sender_id === msg.sender_id

                  return (
                    <div 
                      key={msg.id || idx} 
                      className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameSenderAsPrev ? 'mt-1' : 'mt-3.5'}`}
                    >
                      <div className={`max-w-[78%] sm:max-w-[65%] px-4 py-2.5 text-[14px] leading-relaxed break-words rounded-2xl shadow-xs ${
                        isMe 
                          ? 'bg-violet-600 text-white rounded-br-xs' 
                          : 'bg-white dark:bg-[#15141D] text-gray-900 dark:text-white border border-gray-100 dark:border-[#2D2B3B] rounded-bl-xs'
                      }`}>
                        {msg.content.startsWith('[IMAGE]: ') ? (
                          <div className="rounded-xl overflow-hidden max-h-72 cursor-pointer" onClick={() => setSelectedImageModal(msg.content.replace('[IMAGE]: ', ''))}>
                            <img 
                              src={msg.content.replace('[IMAGE]: ', '')} 
                              alt="Shared attachment" 
                              className="w-full h-auto object-cover hover:opacity-95 transition-opacity" 
                            />
                          </div>
                        ) : (
                          msg.content
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 mt-1 px-1">
                        <span>{formatTime(msg.created_at)}</span>
                        {isMe && (
                          msg.is_read ? (
                            <CheckCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                          ) : (
                            <Check className="w-3 h-3 text-gray-400" />
                          )
                        )}
                      </div>
                    </div>
                  )
                })
              )}

              {/* Realtime Live Typing Indicator Bubble */}
              {isOtherUserTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-400 animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-[#15141D] border border-gray-100 dark:border-[#2D2B3B] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-medium">{selectedUser.full_name} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom-Anchored Composer (Android Safe & Desktop High-Density) */}
            <div className="p-3 md:p-4 border-t border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] shrink-0">
              {showEmojiPicker && (
                <div className="mb-2 p-2 bg-white dark:bg-[#15141D] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl shadow-xl flex gap-2 overflow-x-auto">
                  {commonEmojis.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => {
                        setNewMessage(prev => prev + emoji)
                        setShowEmojiPicker(false)
                      }}
                      className="text-xl p-1 hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 max-w-3xl mx-auto w-full">
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                  accept="image/*" 
                />
                
                {/* Media Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 active:scale-95 transition-all shrink-0"
                  title="Send photo"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin text-violet-600" /> : <ImageIcon className="w-5 h-5" />}
                </button>

                {/* Emoji Button */}
                <button
                  type="button"
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 active:scale-95 transition-all shrink-0"
                  title="Emoji"
                >
                  <Smile className="w-5 h-5" />
                </button>

                {/* Text Input */}
                <div className="flex-1 bg-gray-50/80 dark:bg-[#15141D] border border-gray-200/70 dark:border-[#2D2B3B] rounded-full px-4 py-2 flex items-center min-w-0 focus-within:ring-1 focus-within:ring-violet-500">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleInputChange}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                    placeholder={`Message ${selectedUser.full_name}...`}
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-10 h-10 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 text-white rounded-full flex items-center justify-center shadow-md shadow-violet-500/25 active:scale-95 transition-all shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#FCFBFE] dark:bg-[#07060A]">
            <div className="w-16 h-16 bg-white dark:bg-[#12111A] shadow-md border border-gray-100 dark:border-[#2D2B3B] rounded-3xl flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your Messages</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1">
              Select a student from the list to discuss projects, technical challenges, or daily study streaks.
            </p>
          </div>
        )}
      </main>

      {/* ──────────────────────────────────────────────────────────────────
          PANEL 3: CONVERSATION DETAILS (Collapsible Desktop Right Panel)
          ────────────────────────────────────────────────────────────────── */}
      {selectedUser && showDetailsPanel && (
        <aside className="hidden lg:flex w-[300px] border-l border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#0B0A10] flex-col p-5 overflow-y-auto shrink-0 animate-in slide-in-from-right duration-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Student Profile</h3>
            <button 
              onClick={() => setShowDetailsPanel(false)}
              className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A24]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="text-center pb-5 border-b border-gray-100 dark:border-[#2D2B3B]">
            <img 
              src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.full_name || 'User'}&background=7C3AED&color=fff`} 
              alt="" 
              className="w-18 h-18 rounded-full object-cover mx-auto mb-2 border-2 border-violet-500/20"
            />
            <h4 className="text-sm font-bold text-gray-900 dark:text-white">{selectedUser.full_name}</h4>
            <p className="text-xs text-gray-400">{selectedUser.college || "Trackr Member"}</p>

            <div className="flex items-center justify-center gap-3 mt-3">
              <div className="flex items-center gap-1 text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-500/10 px-2.5 py-1 rounded-full">
                <Flame className="w-3.5 h-3.5 fill-current" />
                <span>{selectedUser.consistency_score || 0} Streak</span>
              </div>
            </div>

            <Link 
              href={`/profile/${selectedUser.id}`}
              className="mt-3.5 inline-flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline"
            >
              <span>View Full Profile</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Shared Media Section */}
          <div className="py-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
              Shared Media ({sharedImages.length})
            </h4>
            {sharedImages.length === 0 ? (
              <p className="text-[11px] text-gray-400">No media shared yet.</p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {sharedImages.slice(0, 9).map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => setSelectedImageModal(img)}
                    className="w-full aspect-square rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity border border-gray-100 dark:border-gray-800"
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      )}

      {/* Lightbox Modal for Shared Images */}
      {selectedImageModal && (
        <div 
          onClick={() => setSelectedImageModal(null)}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh]">
            <img src={selectedImageModal} alt="Preview" className="max-w-full max-h-[85vh] rounded-2xl object-contain shadow-2xl" />
            <button 
              onClick={() => setSelectedImageModal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/70 text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-screen w-full flex items-center justify-center bg-[#FDFCFE] dark:bg-[#07060A]">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    }>
      <MessagesContent />
    </Suspense>
  )
}

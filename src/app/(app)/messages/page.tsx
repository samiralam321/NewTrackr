'use client'

import { useEffect, useState, useRef, Suspense } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  Send, 
  Search, 
  MessageCircle, 
  ChevronLeft, 
  Smile, 
  Image as ImageIcon, 
  Loader2, 
  Check, 
  CheckCheck, 
  X, 
  ExternalLink,
  User
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
  const [latestMessages, setLatestMessages] = useState<Record<string, Message>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  
  // Real-Time Typing Indicators & Modals
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedImageModal, setSelectedImageModal] = useState<string | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)
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

  const commonEmojis = ["👍", "❤️", "😂", "🔥", "🚀", "🎉", "💡", "🙌", "✨", "💯", "🎯", "💻"]

  // Close emoji popover on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false)
      }
    }
    if (showEmojiPicker) {
      document.addEventListener("mousedown", handleClickOutside)
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [showEmojiPicker])

  // Initialize Auth & Conversation List
  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      if (user) {
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

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    setTimeout(() => {
      if (messagesContainerRef.current) {
        messagesContainerRef.current.scrollTo({
          top: messagesContainerRef.current.scrollHeight,
          behavior
        })
      }
    }, 60)
  }

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNewMessage(e.target.value)

    // Auto-adjust height up to 120px
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }

    if (currentUser && selectedUser) {
      const typingRoom = [currentUser.id, selectedUser.id].sort().join('-')
      supabase.channel(`typing:${typingRoom}`).send({
        type: 'broadcast',
        event: 'typing',
        payload: { senderId: currentUser.id }
      })
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !selectedUser) return

    const messageText = newMessage.trim()
    setNewMessage("")

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

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
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // Helper date functions
  const isSameDay = (d1: Date, d2: Date) => {
    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    )
  }

  const formatDateDivider = (dateStr: string) => {
    const d = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (isSameDay(d, today)) return "Today"
    if (isSameDay(d, yesterday)) return "Yesterday"
    return d.toLocaleDateString(undefined, { 
      month: "short", 
      day: "numeric", 
      year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined 
    })
  }

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ""
    }
  }

  const formatListTimestamp = (dateStr?: string) => {
    if (!dateStr) return ""
    try {
      const d = new Date(dateStr)
      const now = new Date()
      if (isSameDay(d, now)) {
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      const yesterday = new Date(now)
      yesterday.setDate(yesterday.getDate() - 1)
      if (isSameDay(d, yesterday)) {
        return "Yesterday"
      }
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
    } catch {
      return ""
    }
  }

  const filteredUsers = users
    .filter(u => u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const timeA = latestMessages[a.id]?.created_at ? new Date(latestMessages[a.id].created_at).getTime() : 0
      const timeB = latestMessages[b.id]?.created_at ? new Date(latestMessages[b.id].created_at).getTime() : 0
      return timeB - timeA
    })

  return (
    <div className="flex h-screen bg-[#FDFCFE] dark:bg-[#07060A] text-gray-900 dark:text-white transition-colors overflow-hidden">
      
      {/* ──────────────────────────────────────────────────────────────────
          PANEL 1: CONVERSATION LIST (Continuous, Clean WhatsApp/Discord style)
          Hidden on mobile when chat is open
          ────────────────────────────────────────────────────────────────── */}
      <aside 
        className={`w-full md:w-[320px] lg:w-[350px] flex-col border-r border-gray-100 dark:border-[#22212E] bg-white dark:bg-[#0B0A10] shrink-0 transition-all ${
          selectedUser ? 'hidden md:flex' : 'flex'
        }`}
      >
        {/* Header & Search */}
        <div className="p-3.5 border-b border-gray-100 dark:border-[#22212E] space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link 
                href="/dashboard" 
                className="md:hidden p-1.5 -ml-1 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24]"
                aria-label="Back to dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white">Messages</h1>
            </div>
            {users.length > 0 && (
              <span className="text-[11px] font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40 px-2 py-0.5 rounded-full">
                {users.length}
              </span>
            )}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 bg-gray-50 dark:bg-[#15141D] border border-gray-200/60 dark:border-[#2D2B3B] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-500 placeholder:text-gray-400 transition-all"
            />
          </div>
        </div>

        {/* Continuous Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-gray-50 dark:divide-[#181724]">
          {filteredUsers.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-40 text-violet-600" />
              <p className="text-xs font-medium">No conversations found</p>
              <p className="text-[11px] text-gray-400 mt-1">Start messaging someone from their profile.</p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selectedUser?.id === user.id
              const isOnline = onlineUsers.includes(user.id)
              const latestMsg = latestMessages[user.id]
              const unread = unreadCounts[user.id] || 0
              
              let previewText = "Start chatting..."
              if (latestMsg) {
                previewText = latestMsg.content.startsWith('[IMAGE]: ') ? '📷 Photo' : latestMsg.content
              }

              const timeText = formatListTimestamp(latestMsg?.created_at)

              return (
                <button
                  key={user.id}
                  onClick={() => selectUserAndUrl(user)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 text-left transition-colors relative ${
                    isSelected 
                      ? 'bg-violet-50/70 dark:bg-violet-950/30 border-l-[3px] border-violet-600' 
                      : 'hover:bg-gray-50/80 dark:hover:bg-[#14131D]'
                  }`}
                >
                  {/* User Avatar with Online Dot */}
                  <div className="relative shrink-0">
                    <img 
                      src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=7C3AED&color=fff`} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-gray-800"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-[#0B0A10] rounded-full" />
                    )}
                  </div>

                  {/* Name, Preview, and Metadata */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h3 className={`text-xs font-semibold truncate ${
                        isSelected 
                          ? 'text-violet-950 dark:text-violet-200 font-bold' 
                          : 'text-gray-900 dark:text-white'
                      }`}>
                        {user.full_name}
                      </h3>
                      {timeText && (
                        <span className="text-[10px] text-gray-400 dark:text-gray-500 shrink-0">
                          {timeText}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p className={`text-[11.5px] truncate pr-1 ${
                        unread > 0 
                          ? 'text-gray-900 dark:text-white font-bold' 
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {previewText}
                      </p>
                      {unread > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-violet-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0">
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
          PANEL 2: ACTIVE CONVERSATION PANEL
          Takes remaining space on desktop; full screen on mobile
          ────────────────────────────────────────────────────────────────── */}
      <main className={`flex-1 flex flex-col h-[100dvh] md:h-screen relative overflow-hidden bg-[#FCFBFE] dark:bg-[#07060A] ${
        selectedUser ? 'flex' : 'hidden md:flex'
      }`}>
        {selectedUser ? (
          <>
            {/* Conversation Header */}
            <div className="px-4 py-2.5 border-b border-gray-100 dark:border-[#22212E] bg-white/95 dark:bg-[#0B0A10]/95 backdrop-blur-md flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => selectUserAndUrl(null)}
                  className="md:hidden p-1.5 -ml-1 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1A1A24] rounded-full"
                  aria-label="Back to conversations"
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
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Active now
                      </span>
                    ) : (
                      selectedUser.college || "Trackr Student"
                    )}
                  </p>
                </div>
              </div>

              {/* View Profile Link */}
              <Link
                href={`/profile/${selectedUser.id}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/40 transition-colors"
                title="View student profile"
              >
                <User className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            </div>

            {/* Message Stream */}
            <div 
              ref={messagesContainerRef} 
              className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-2.5"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
                  <div className="w-12 h-12 bg-violet-50 dark:bg-violet-950/30 rounded-full flex items-center justify-center mb-2.5">
                    <MessageCircle className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white">Start the conversation</h3>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    Discuss progress, share daily breakthroughs, or collaborate on code.
                  </p>
                </div>
              ) : (
                messages.map((msg, idx) => {
                  const isMe = msg.sender_id === currentUser?.id
                  const isSameSenderAsPrev = idx > 0 && messages[idx - 1].sender_id === msg.sender_id
                  
                  // Date separator calculation
                  const currentDate = new Date(msg.created_at)
                  const prevDate = idx > 0 ? new Date(messages[idx - 1].created_at) : null
                  const showDateDivider = !prevDate || !isSameDay(currentDate, prevDate)

                  return (
                    <div key={msg.id || idx}>
                      {/* Date Divider */}
                      {showDateDivider && (
                        <div className="flex items-center justify-center my-3">
                          <span className="px-3 py-0.5 rounded-full bg-gray-100 dark:bg-[#161520] text-gray-500 dark:text-gray-400 text-[10.5px] font-medium border border-gray-200/50 dark:border-[#272635]">
                            {formatDateDivider(msg.created_at)}
                          </span>
                        </div>
                      )}

                      {/* Message Bubble Row */}
                      <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} ${isSameSenderAsPrev ? 'mt-1' : 'mt-2.5'}`}>
                        <div className={`max-w-[82%] sm:max-w-[70%] px-3.5 py-2 text-[13.5px] leading-relaxed break-words rounded-2xl shadow-2xs ${
                          isMe 
                            ? 'bg-violet-600 text-white rounded-tr-xs' 
                            : 'bg-white dark:bg-[#161520] text-gray-900 dark:text-gray-100 border border-gray-100 dark:border-[#262534] rounded-tl-xs'
                        }`}>
                          {msg.content.startsWith('[IMAGE]: ') ? (
                            <div 
                              className="rounded-xl overflow-hidden max-h-72 cursor-pointer" 
                              onClick={() => setSelectedImageModal(msg.content.replace('[IMAGE]: ', ''))}
                            >
                              <img 
                                src={msg.content.replace('[IMAGE]: ', '')} 
                                alt="Shared attachment" 
                                className="w-full h-auto object-cover hover:opacity-95 transition-opacity" 
                              />
                            </div>
                          ) : (
                            <span className="whitespace-pre-wrap">{msg.content}</span>
                          )}
                        </div>

                        {/* Timestamp & Status */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1">
                          <span>{formatMessageTime(msg.created_at)}</span>
                          {isMe && (
                            msg.is_read ? (
                              <CheckCheck className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                            ) : (
                              <Check className="w-3 h-3 text-gray-400" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}

              {/* Realtime Live Typing Indicator Bubble */}
              {isOtherUserTyping && (
                <div className="flex items-center gap-2 text-xs text-gray-400 animate-in fade-in duration-200">
                  <div className="bg-white dark:bg-[#161520] border border-gray-100 dark:border-[#262534] px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xs">
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-violet-600 rounded-full animate-bounce" />
                  </div>
                  <span className="text-[11px] font-medium text-gray-400">{selectedUser.full_name} is typing...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Bottom Message Composer (Android Safe & Auto-expanding) */}
            <div className="p-2.5 sm:p-3 border-t border-gray-100 dark:border-[#22212E] bg-white dark:bg-[#0B0A10] shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              
              <div className="flex items-end gap-1.5 max-w-4xl mx-auto w-full relative">
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 active:scale-95 transition-all shrink-0 mb-0.5"
                  title="Attach photo"
                  aria-label="Attach photo"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin text-violet-600" /> : <ImageIcon className="w-4.5 h-4.5" />}
                </button>

                {/* Emoji Button with Popover */}
                <div className="relative mb-0.5" ref={emojiPickerRef}>
                  <button
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950/40 active:scale-95 transition-all shrink-0 ${
                      showEmojiPicker ? 'text-violet-600 bg-violet-50 dark:bg-violet-950/40' : ''
                    }`}
                    title="Insert emoji"
                    aria-label="Insert emoji"
                  >
                    <Smile className="w-4.5 h-4.5" />
                  </button>

                  {/* Popover */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full mb-2 left-0 z-50 bg-white dark:bg-[#161520] border border-gray-200 dark:border-[#2D2B3B] p-2 rounded-2xl shadow-xl grid grid-cols-4 gap-1.5 w-44 animate-in fade-in zoom-in-95 duration-150">
                      {commonEmojis.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => {
                            setNewMessage(prev => prev + emoji)
                            setShowEmojiPicker(false)
                            textareaRef.current?.focus()
                          }}
                          className="w-8 h-8 hover:bg-gray-100 dark:hover:bg-[#252436] rounded-lg transition-transform active:scale-90 flex items-center justify-center text-base"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Multiline Auto-expanding Textarea Input */}
                <div className="flex-1 bg-gray-50 dark:bg-[#15141D] border border-gray-200/70 dark:border-[#282736] rounded-2xl px-3.5 py-2 flex items-center min-w-0 focus-within:ring-1 focus-within:ring-violet-500 focus-within:border-violet-500 transition-all">
                  <textarea
                    ref={textareaRef}
                    rows={1}
                    value={newMessage}
                    onChange={handleTextareaInput}
                    onKeyDown={handleKeyDown}
                    placeholder={`Message ${selectedUser.full_name}...`}
                    className="w-full bg-transparent text-xs sm:text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400 resize-none max-h-28 overflow-y-auto leading-normal"
                  />
                </div>

                {/* Send Button */}
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="w-9 h-9 bg-violet-600 hover:bg-violet-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center shadow-xs active:scale-95 transition-all shrink-0 mb-0.5"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-[#FCFBFE] dark:bg-[#07060A]">
            <div className="w-14 h-14 bg-white dark:bg-[#12111A] shadow-xs border border-gray-200/60 dark:border-[#22212E] rounded-2xl flex items-center justify-center mb-3">
              <MessageCircle className="w-7 h-7 text-violet-600 dark:text-violet-400" />
            </div>
            <h3 className="text-base font-bold text-gray-900 dark:text-white">Your Messages</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mt-1 leading-relaxed">
              Select a conversation from the list to discuss achievements, challenges, or daily study streaks.
            </p>
          </div>
        )}
      </main>

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
              aria-label="Close image preview"
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

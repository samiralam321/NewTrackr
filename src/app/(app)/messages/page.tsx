'use client'

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Send, Search, MessageCircle, ChevronLeft, Plus, Smile, Info, Image as ImageIcon } from "lucide-react"
import { usePresence } from "@/components/providers/presence-provider"
import Link from "next/link"

type Profile = {
  id: string
  full_name: string
  avatar_url: string
}

type Message = {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
}

export default function MessagesPage() {
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [users, setUsers] = useState<Profile[]>([])
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all") // 'all' | 'unread' | 'groups'
  const [latestMessages, setLatestMessages] = useState<Record<string, Message>>({})
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const onlineUsers = usePresence()
  
  const commonEmojis = ["👍", "❤️", "😂", "🔥", "😊", "🎉", "👀", "🙌"]

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUser(user)

      // Fetch all users to chat with (excluding self)
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .neq('id', user.id)
        
        if (data) setUsers(data)

        // Fetch all messages involving the current user to get latest message per conversation
        const { data: msgs } = await supabase
          .from('messages')
          .select('*')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
        
        if (msgs) {
          const latest: Record<string, Message> = {}
          const unreads: Record<string, number> = {}
          const stored = localStorage.getItem('trackr_read_timestamps')
          const readTimestamps = stored ? JSON.parse(stored) : {}

          msgs.forEach(m => {
            const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
            if (!latest[otherId]) {
              latest[otherId] = m
            }
            if (m.sender_id !== user.id) {
              const lastRead = readTimestamps[otherId] || 0
              if (new Date(m.created_at).getTime() > new Date(lastRead).getTime()) {
                unreads[otherId] = (unreads[otherId] || 0) + 1
              }
            }
          })
          setLatestMessages(latest)
          setUnreadCounts(unreads)
        }
      }
    }
    init()
  }, [])

  const markAsRead = (otherUserId: string) => {
    const stored = localStorage.getItem('trackr_read_timestamps')
    const readTimestamps = stored ? JSON.parse(stored) : {}
    readTimestamps[otherUserId] = new Date().toISOString()
    localStorage.setItem('trackr_read_timestamps', JSON.stringify(readTimestamps))
    
    setUnreadCounts(prev => ({ ...prev, [otherUserId]: 0 }))
  }

  useEffect(() => {
    if (!currentUser || !selectedUser) return

    // Fetch message history between current user and selected user
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

    // Realtime subscription
    const channel = supabase
      .channel(`messages:${currentUser.id}-${selectedUser.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages',
        filter: `or(and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedUser.id}),and(sender_id.eq.${selectedUser.id},receiver_id.eq.${currentUser.id}))`
      }, (payload) => {
        const newMsg = payload.new as Message
        // Only append messages from the other user, since we optimistically add our own
        if (newMsg.sender_id !== currentUser.id) {
          setMessages(prev => [...prev, newMsg])
          setLatestMessages(prev => ({ ...prev, [newMsg.sender_id]: newMsg }))
          
          if (selectedUser.id === newMsg.sender_id) {
            // Automatically mark as read if we are looking at the chat
            markAsRead(newMsg.sender_id)
            scrollToBottom()
          } else {
            // Increment unread count if we are not looking at the chat
            setUnreadCounts(prev => ({ ...prev, [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1 }))
          }
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
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
    }, 100)
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

    await supabase.from('messages').insert({
      sender_id: currentUser.id,
      receiver_id: selectedUser.id,
      content: `[IMAGE]: ${tempUrl}`
    })
    
    setIsUploading(false)
  }

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
    if (!matchesSearch) return false;
    
    if (activeTab === 'unread') {
      return unreadCounts[u.id] > 0;
    }
    if (activeTab === 'groups') {
      return false; // Groups not implemented yet
    }
    return true; // 'all' tab
  })

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* LEFT PANEL - 30% Width */}
      <div className={`md:flex w-full lg:w-[320px] xl:w-[30%] flex-col bg-white border-r border-gray-100 ${selectedUser ? 'hidden' : 'flex'}`}>
        
        {/* Sidebar Header */}
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-5">
            <Link href="/dashboard" className="md:hidden p-2 -ml-2 text-gray-900 rounded-full hover:bg-gray-100 transition-colors">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-2xl font-black text-gray-900">Messages</h1>
          </div>
          
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search users..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50/80 border border-gray-100 rounded-2xl text-[15px] focus:outline-none focus:ring-2 focus:ring-violet-100 transition-all shadow-sm shadow-gray-100/50"
            />
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 bg-gray-50/80 border border-gray-100 rounded-full mx-1 mb-2">
            <button 
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-2 text-[13px] font-bold rounded-full transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-gray-900 border border-gray-100/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveTab('unread')}
              className={`flex-1 py-2 text-[13px] font-bold rounded-full transition-all ${activeTab === 'unread' ? 'bg-white shadow-sm text-gray-900 border border-gray-100/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Unread
            </button>
            <button 
              onClick={() => setActiveTab('groups')}
              className={`flex-1 py-2 text-[13px] font-bold rounded-full transition-all ${activeTab === 'groups' ? 'bg-white shadow-sm text-gray-900 border border-gray-100/50' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Groups
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[200px] px-4 text-center">
               <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                 <MessageCircle className="w-6 h-6 text-gray-300" />
               </div>
               <p className="text-[14px] font-bold text-gray-500">
                 {activeTab === 'unread' ? "No unread messages" : activeTab === 'groups' ? "No groups created" : "No users found"}
               </p>
            </div>
          ) : (
            filteredUsers.map((user, idx) => {
            const isSelected = selectedUser?.id === user.id;
            
            const lastMsg = latestMessages[user.id]
            const unreadCount = unreadCounts[user.id] || 0;
            
            const timeText = lastMsg ? formatTime(lastMsg.created_at) : "";
            const previewText = lastMsg ? lastMsg.content : "Tap to chat";

            return (
              <button
                key={user.id}
                onClick={() => setSelectedUser(user)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 relative group text-left ${
                  isSelected 
                    ? 'bg-gradient-to-r from-violet-50 to-fuchsia-50/50 shadow-sm shadow-violet-100/50' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="relative shrink-0">
                   <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=7C3AED&color=fff`} 
                    alt="" 
                    className="w-12 h-12 rounded-full object-cover"
                   />
                   {onlineUsers.includes(user.id) && <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></div>}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between mb-1">
                    <p className={`text-[15px] font-bold truncate ${isSelected ? 'text-violet-900' : 'text-gray-900'}`}>
                      {user.full_name}
                    </p>
                    <span className={`text-xs font-semibold ${isSelected ? 'text-violet-500' : 'text-gray-400'}`}>
                      {timeText}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className={`text-[13px] truncate pr-2 ${isSelected ? 'text-violet-600 font-medium' : unreadCount > 0 ? 'text-gray-900 font-semibold' : 'text-gray-500'}`}>
                      {previewText}
                    </p>
                    {unreadCount > 0 && !isSelected && (
                      <div className="w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                        {unreadCount}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })
          )}
        </div>
      </div>

      {/* RIGHT PANEL - 70% Width */}
      <div className={`flex-1 flex flex-col bg-[#FCFBFF] h-[100dvh] md:h-screen relative overflow-hidden ${selectedUser ? 'flex' : 'hidden md:flex'}`}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="px-4 md:px-8 py-4 md:py-5 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setSelectedUser(null)}
                  className="md:hidden p-2 -ml-2 text-violet-600 hover:bg-violet-50 rounded-full"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div className="relative">
                  <img 
                    src={selectedUser.avatar_url || `https://ui-avatars.com/api/?name=${selectedUser.full_name || 'User'}&background=7C3AED&color=fff`} 
                    alt="" 
                    className="w-11 h-11 rounded-full object-cover shadow-sm"
                  />
                  <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full opacity-0 transition-opacity" style={{ opacity: onlineUsers.includes(selectedUser.id) ? 1 : 0 }}></div>
                </div>
                <div>
                  <h2 className="text-[17px] font-bold text-gray-900 leading-none mb-1.5">{selectedUser.full_name}</h2>
                  <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5">
                    {onlineUsers.includes(selectedUser.id) ? 'Online' : 'Offline'}
                  </p>
                </div>
              </div>

              {/* Header Actions */}
              <button className="w-10 h-10 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                <Info className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 md:px-8 py-8 space-y-6">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <MessageCircle className="w-8 h-8 text-gray-300" />
                  </div>
                  <p className="text-sm font-medium">Say hello to {selectedUser.full_name}!</p>
                </div>
              ) : (
                <>
                  {/* Mock Date Divider */}
                  <div className="flex justify-center my-6">
                    <span className="px-4 py-1.5 bg-gray-100/80 rounded-full text-[11px] font-bold text-gray-500 uppercase tracking-wider">Today</span>
                  </div>

                  {messages.map((msg, i) => {
                    const isMe = msg.sender_id === currentUser?.id
                    return (
                      <div key={msg.id || i} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                        <div className={`max-w-[70%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm overflow-hidden ${
                          isMe 
                            ? 'bg-gradient-to-r from-[#7B61FF] to-[#9F7AEA] text-white rounded-[20px] rounded-br-sm shadow-violet-500/20' 
                            : 'bg-white border border-gray-100 text-gray-800 rounded-[20px] rounded-bl-sm'
                        }`}>
                          {msg.content.startsWith('[IMAGE]: ') ? (
                            <img src={msg.content.replace('[IMAGE]: ', '')} alt="attachment" className="rounded-xl max-h-64 object-cover" />
                          ) : (
                            msg.content
                          )}
                        </div>
                        <span className="text-[11px] font-semibold text-gray-400 mt-1.5 px-1">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                    )
                  })}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 md:p-6 bg-transparent relative shrink-0">
              {showEmojiPicker && (
                <div className="absolute bottom-full mb-2 right-8 bg-white border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3 flex gap-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                  {commonEmojis.map(emoji => (
                    <button key={emoji} onClick={() => { setNewMessage(prev => prev + emoji); setShowEmojiPicker(false); }} className="text-2xl hover:scale-110 transition-transform">
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3 max-w-4xl mx-auto bg-white p-2 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 relative">
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-violet-500 transition-colors shrink-0"
                >
                  {isUploading ? <Plus className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                </button>
                
                <input
                  type="text"
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-transparent px-2 py-2 text-[15px] focus:outline-none placeholder:text-gray-400 text-gray-800"
                />
                
                <div className="flex items-center gap-2 shrink-0 pr-1">
                  <button 
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="w-10 h-10 bg-violet-600 text-white rounded-full flex items-center justify-center hover:bg-violet-700 disabled:opacity-50 disabled:hover:bg-violet-600 transition-colors shadow-md shadow-violet-500/20"
                  >
                    <Send className="w-4 h-4 ml-0.5" />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center bg-[#FCFBFF]">
            <div className="w-24 h-24 bg-white shadow-sm border border-gray-100 rounded-full flex items-center justify-center mb-6">
              <MessageCircle className="w-10 h-10 text-violet-300" />
            </div>
            <h3 className="text-2xl font-black text-gray-900 mb-2">Your Messages</h3>
            <p className="text-gray-500 font-medium">Select a conversation from the sidebar to start chatting</p>
          </div>
        )}
      </div>
    </div>
  )
}

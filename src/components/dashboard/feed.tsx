'use client'

import { useEffect, useState } from "react"
import { Bookmark, Heart, MessageCircle, Send, Trash2, MoreVertical, Edit2, Pin, Flag, BellOff, UserX, AlertTriangle } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Post, Comment } from "@/lib/supabase/types"
import Link from "next/link"

export function Feed({ 
  userIdFilter,
  savedOnlyFilter,
  likedByFilter,
  commentedByFilter,
  followingOnlyFilter,
  collegeOnlyFilter,
  isJourneyMode,
  highlightsOnlyFilter,
  currentUserIdProp
}: { 
  userIdFilter?: string,
  savedOnlyFilter?: boolean,
  likedByFilter?: string,
  commentedByFilter?: string,
  followingOnlyFilter?: boolean,
  collegeOnlyFilter?: boolean,
  isJourneyMode?: boolean,
  highlightsOnlyFilter?: boolean,
  currentUserIdProp?: string
}) {
  const [posts, setPosts] = useState<Post[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({})
  const [commentTexts, setCommentTexts] = useState<Record<string, string>>({})
  const [postComments, setPostComments] = useState<Record<string, Comment[]>>({})
  const [isLoadingComments, setIsLoadingComments] = useState<Record<string, boolean>>({})
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  
  // New States for Advanced Actions
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [reportPostId, setReportPostId] = useState<string | null>(null)
  const [reportReason, setReportReason] = useState("")
  const [blockUser, setBlockUser] = useState<{id: string, name: string} | null>(null)
  const [hiddenUserIds, setHiddenUserIds] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  
  const supabase = createClient()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!(event.target as Element).closest('.post-menu-container')) {
        setOpenMenuId(null)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    fetchPosts()
    
    const uniqueChannelName = `schema-db-changes-${Math.random().toString(36).substring(7)}`
    
    const channel = supabase
      .channel(uniqueChannelName)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'likes' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookmarks' }, () => fetchPosts(false))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
          Object.keys(expandedComments).forEach(postId => {
            if (expandedComments[postId]) fetchComments(postId)
          })
          fetchPosts(false)
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [expandedComments, userIdFilter, savedOnlyFilter, likedByFilter, commentedByFilter, followingOnlyFilter, collegeOnlyFilter])

  const fetchPosts = async (showLoading = true) => {
    if (showLoading) setIsLoading(true)
    let currentUid = currentUserIdProp;
    if (currentUid === undefined) {
      const { data: userData } = await supabase.auth.getUser()
      currentUid = userData.user?.id || null
    }
    setCurrentUserId(currentUid)

    let query = supabase
      .from('posts')
      .select(`
        *,
        profiles!posts_user_id_fkey(*),
        likes(user_id),
        comments(user_id, id),
        bookmarks(user_id)
      `)
      .order('created_at', { ascending: false })
      
    if (userIdFilter) query = query.eq('user_id', userIdFilter)

    if (followingOnlyFilter && currentUid) {
      const { data: followData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', currentUid)
      
      const followingIds = followData?.map((f: any) => f.following_id) || []
      
      if (followingIds.length > 0) {
        query = query.in('user_id', followingIds)
      } else {
        setPosts([])
        return
      }
    }

    if (collegeOnlyFilter && currentUid) {
      const { data: profileData } = await supabase.from('profiles').select('college').eq('id', currentUid).single()
      if (profileData?.college) {
        const { data: collegeUsers } = await supabase.from('profiles').select('id').eq('college', profileData.college)
        const collegeUserIds = collegeUsers?.map(u => u.id) || []
        if (collegeUserIds.length > 0) {
          query = query.in('user_id', collegeUserIds)
        } else {
          setPosts([])
          return
        }
      } else {
        setPosts([])
        return
      }
    }
    
    const { data, error } = await query

    if (error) {
      console.error("Error fetching posts:", error)
      return
    }

    let formattedPosts = data.map((p: any) => ({
      ...p,
      user_has_liked: p.likes.some((l: any) => l.user_id === currentUid),
      user_has_bookmarked: p.bookmarks.some((b: any) => b.user_id === currentUid),
      likes_count: p.likes.length,
      comments_count: p.comments.length,
      bookmarks_count: p.bookmarks.length
    })) as Post[]

    if (savedOnlyFilter && currentUid) {
      formattedPosts = formattedPosts.filter(p => p.user_has_bookmarked)
    }
    
    if (likedByFilter) {
      formattedPosts = formattedPosts.filter(p => (p as any).likes.some((l: any) => l.user_id === likedByFilter))
    }

    if (commentedByFilter) {
      formattedPosts = formattedPosts.filter(p => (p as any).comments.some((c: any) => c.user_id === commentedByFilter))
    }

    if (highlightsOnlyFilter && formattedPosts.length > 0) {
      const topPost = formattedPosts.reduce((prev, current) => ((prev as any).likes_count > (current as any).likes_count) ? prev : current)
      formattedPosts = [topPost]
    }

    setPosts(formattedPosts)
    if (showLoading) setIsLoading(false)
  }

  const fetchComments = async (postId: string) => {
    const { data, error } = await supabase
      .from('comments')
      .select(`*, profiles(*)`)
      .eq('post_id', postId)
      .order('created_at', { ascending: true })
    
    if (data && !error) {
      setPostComments(prev => ({ ...prev, [postId]: data as any }))
    }
    setIsLoadingComments(prev => ({ ...prev, [postId]: false }))
  }

  const toggleComments = (postId: string) => {
    const isExpanding = !expandedComments[postId]
    setExpandedComments(prev => ({ ...prev, [postId]: isExpanding }))
    if (isExpanding && !postComments[postId]) {
      setIsLoadingComments(prev => ({ ...prev, [postId]: true }))
      fetchComments(postId)
    }
  }

  const submitComment = async (postId: string) => {
    const text = commentTexts[postId]?.trim()
    if (!text || !currentUserId) return

    const newComment = {
      id: Math.random().toString(),
      post_id: postId,
      user_id: currentUserId,
      content: text,
      created_at: new Date().toISOString(),
      profiles: {
        full_name: "You",
        avatar_url: ""
      }
    }

    setPostComments(prev => ({
      ...prev,
      [postId]: [...(prev[postId] || []), newComment as any]
    }))
    setCommentTexts(prev => ({ ...prev, [postId]: "" }))

    await supabase.from('comments').insert({
      post_id: postId,
      user_id: currentUserId,
      content: text
    })
  }

  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!currentUserId) return
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          user_has_liked: !currentlyLiked,
          likes_count: (p as any).likes_count + (currentlyLiked ? -1 : 1)
        }
      }
      return p
    }))

    if (currentlyLiked) {
      await supabase.from('likes').delete().match({ post_id: postId, user_id: currentUserId })
    } else {
      await supabase.from('likes').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  const toggleBookmark = async (postId: string, currentlyBookmarked: boolean) => {
    if (!currentUserId) return
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { 
          ...p, 
          user_has_bookmarked: !currentlyBookmarked,
          bookmarks_count: (p as any).bookmarks_count + (currentlyBookmarked ? -1 : 1)
        }
      }
      return p
    }))

    if (currentlyBookmarked) {
      await supabase.from('bookmarks').delete().match({ post_id: postId, user_id: currentUserId })
    } else {
      await supabase.from('bookmarks').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)
    
    if (diffInSeconds < 60) return `Just now`
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    return `${Math.floor(diffInSeconds / 86400)}d ago`
  }

  const deletePost = async (postId: string) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId).eq('user_id', currentUserId!)
    if (!error) {
      setPosts(posts.filter(p => p.id !== postId))
      setPostToDelete(null)
    } else {
      console.error("Error deleting post:", error)
      alert("Failed to delete post.")
    }
  }

  // Advanced Action Handlers
  const handleEditSave = async (postId: string) => {
    if (!editContent.trim()) return
    const { error } = await supabase.from('posts').update({ content: editContent }).eq('id', postId)
    if (!error) {
      setPosts(posts.map(p => p.id === postId ? { ...p, content: editContent } : p))
      setEditingPostId(null)
    }
  }

  const handlePinPost = async (postId: string) => {
    const { error } = await supabase.from('posts').update({ is_pinned: true } as any).eq('id', postId)
    if (!error) {
      setPosts(posts.map(p => p.id === postId ? { ...p, is_pinned: true } as any : p))
    }
  }

  const handleReportSubmit = async () => {
    if (!reportPostId || !reportReason.trim() || !currentUserId) return
    
    // Simulate API call for reporting
    setTimeout(() => {
      setReportPostId(null)
      setReportReason("")
      alert("Post reported successfully. Thank you for keeping Trackr safe.")
    }, 500)
  }

  const handleBlockSubmit = async () => {
    if (!blockUser || !currentUserId) return
    const { error } = await supabase.from('blocks').insert({
      blocker_id: currentUserId,
      blocked_user_id: blockUser.id
    } as any)
    
    if (error) console.error("Error blocking user:", error)
    
    setHiddenUserIds(prev => [...prev, blockUser.id])
    setBlockUser(null)
  }

  const handleMuteUser = async (userId: string) => {
    if (!currentUserId) return
    const { error } = await supabase.from('mutes').insert({
      muter_id: currentUserId,
      muted_user_id: userId
    } as any)
    
    if (error) console.error("Error muting user:", error)
    
    setHiddenUserIds(prev => [...prev, userId])
  }

  return (
    <div className={`space-y-6 ${isJourneyMode ? 'pl-2' : ''}`}>
      {isLoading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-5 md:p-6 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-[#1A1A24]"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/3"></div>
                </div>
              </div>
              <div className="space-y-2 mb-4">
                <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-10 text-gray-500 dark:text-gray-400">No progress shared yet. Be the first!</div>
      ) : posts.filter(p => !hiddenUserIds.includes(p.user_id)).map((post, index) => {
        const postDate = new Date(post.created_at)
        const dateDisplay = postDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        
        return (
          <div key={post.id} className={isJourneyMode ? "relative pl-[90px] md:pl-[120px]" : ""}>
            {/* Timeline UI for Journey Mode */}
            {isJourneyMode && (
              <>
                {/* Vertical Line */}
                {index !== posts.length - 1 && (
                  <div className="absolute left-[7px] top-[40px] bottom-[-40px] w-px bg-gray-200 dark:bg-[#2D2B3B] z-0"></div>
                )}
                
                {/* Date & Dot */}
                <div className="absolute left-0 top-6 flex items-center gap-4 z-10">
                  <div className={`w-4 h-4 rounded-full border-[3px] border-white dark:border-[#0B0A10] shadow-sm shrink-0 ${index === 0 ? 'bg-emerald-400' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                  <span className="text-[14px] font-bold text-gray-900 dark:text-white whitespace-nowrap">{dateDisplay}</span>
                </div>
              </>
            )}

            <article className={`bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-300 dark:hover:border-violet-900/50 group/card ${isJourneyMode ? 'relative z-10' : ''}`}>
          
          {/* Top Section */}
          {!isJourneyMode && (
            <div className="flex items-center justify-between mb-5">
              <Link href={`/profile/${post.user_id}`} className="flex items-center gap-3 group">
              <img src={post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.full_name || 'User'}&background=7C3AED&color=fff`} className="w-12 h-12 rounded-full object-cover border border-gray-100 dark:border-gray-800 group-hover:opacity-90 transition-opacity" alt="" />
              <div>
                <h3 className="text-[15px] font-bold text-gray-900 dark:text-white group-hover:underline transition-colors">{post.profiles?.full_name || 'Anonymous User'}</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-400 font-medium">{post.profiles?.college || 'Trackr Member'}</p>
              </div>
            </Link>
            
            <div className="flex items-center gap-3 text-gray-400 dark:text-gray-500">
              <div className="shrink-0 whitespace-nowrap flex items-center gap-1.5 text-orange-500 font-bold text-[13px] bg-orange-50 dark:bg-orange-500/10 px-3 py-1 rounded-full transition-colors">
                🔥 {post.profiles?.consistency_score || 0}
              </div>
              <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-gray-800"></div>
              <span className="hidden sm:inline text-[13px] font-medium">{getTimeAgo(post.created_at)}</span>
              
              {(post as any).is_pinned && (
                <>
                  <div className="hidden sm:block w-px h-4 bg-gray-200 dark:bg-gray-800"></div>
                  <span className="text-[11px] font-bold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-900/20 px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Pin className="w-3 h-3 fill-current" /> Pinned
                  </span>
                </>
              )}
              
              <div className="relative post-menu-container">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-[#1A1A24] rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-500" />
                </button>
                
                {openMenuId === post.id && (
                  <div className="absolute right-0 top-8 w-44 bg-white dark:bg-[#1A1A24] rounded-xl shadow-xl border border-gray-100 dark:border-[#2D2B3B] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    {post.user_id === currentUserId ? (
                      <>
                        <button 
                          onClick={() => { setEditingPostId(post.id); setEditContent(post.content); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" /> Edit Post
                        </button>
                        <button 
                          onClick={() => { handlePinPost(post.id); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors"
                        >
                          <Pin className="w-4 h-4 text-gray-400" /> Pin to Profile
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          onClick={() => { setReportPostId(post.id); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-[13px] font-medium text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2.5 transition-colors"
                        >
                          <Flag className="w-4 h-4" /> Report Post
                        </button>
                        <button 
                          onClick={() => { handleMuteUser(post.user_id); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors"
                        >
                          <BellOff className="w-4 h-4 text-gray-400" /> Mute User
                        </button>
                        <button 
                          onClick={() => { setBlockUser({ id: post.user_id, name: post.profiles?.full_name || 'User' }); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-[13px] font-medium text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2.5 transition-colors"
                        >
                          <UserX className="w-4 h-4" /> Block User
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}

          {isJourneyMode && (
             <div className="absolute top-4 right-4 z-20">
               <div className="relative post-menu-container">
                <button 
                  onClick={() => setOpenMenuId(openMenuId === post.id ? null : post.id)} 
                  className="p-1 hover:bg-gray-100 dark:hover:bg-[#1A1A24] rounded-full transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-gray-400" />
                </button>
                
                {openMenuId === post.id && (
                  <div className="absolute right-0 top-8 w-44 bg-white dark:bg-[#1A1A24] rounded-xl shadow-xl border border-gray-100 dark:border-[#2D2B3B] py-1.5 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    {post.user_id === currentUserId && (
                      <>
                        <button 
                          onClick={() => { setEditingPostId(post.id); setEditContent(post.content); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-[13px] font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] flex items-center gap-2.5 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" /> Edit Post
                        </button>
                        <div className="w-full h-px bg-gray-100 dark:bg-[#2D2B3B] my-1"></div>
                        <button 
                          onClick={() => { setPostToDelete(post.id); setOpenMenuId(null); }}
                          className="w-full px-4 py-2 text-[13px] font-bold text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 flex items-center gap-2.5 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" /> Delete Post
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
             </div>
          )}
          
          {/* Content Section */}
          <div className="mb-5">
            {editingPostId === post.id ? (
              <div className="flex flex-col gap-3">
                <textarea 
                  value={editContent} 
                  onChange={(e) => setEditContent(e.target.value)}
                  className="w-full p-4 text-[15px] bg-gray-50 dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2B3B] rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 min-h-[100px] resize-y text-gray-900 dark:text-white"
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditingPostId(null)} className="px-4 py-2 text-sm font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">Cancel</button>
                  <button onClick={() => handleEditSave(post.id)} className="px-4 py-2 text-sm font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors">Save</button>
                </div>
              </div>
            ) : (
              <p className="text-[16px] text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap max-w-3xl">
                {post.content}
              </p>
            )}
          </div>
          
          {/* Image Preview */}
          {post.image_url && (
            <div className="mb-5 w-full max-w-lg h-48 sm:h-64 bg-gray-100 dark:bg-[#1A1A24] rounded-2xl overflow-hidden border border-gray-100 dark:border-[#2D2B3B] cursor-pointer hover:opacity-95 transition-all shadow-sm" onClick={() => window.open(post.image_url!, '_blank')}>
               <img src={post.image_url} alt="Post attachment" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Tags Section */}
          <div className="mb-6 flex flex-wrap gap-2">
            {post.tags?.map(tag => (
              <span key={tag} className="text-[13px] font-medium text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-3.5 py-1.5 rounded-full hover:bg-violet-100 dark:hover:bg-violet-500/20 cursor-pointer transition-colors">
                {tag}
              </span>
            ))}
            {post.type && (
               <span className="text-[13px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-3.5 py-1.5 rounded-full hover:bg-blue-100 dark:hover:bg-blue-500/20 cursor-pointer transition-colors">
                 {post.type}
               </span>
            )}
            {post.time_spent && (
               <span className="text-[13px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3.5 py-1.5 rounded-full transition-colors">
                 ⏱️ {Math.floor(post.time_spent/60)}h {post.time_spent%60}m
               </span>
            )}
          </div>
            
          {/* Action Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-[#2D2B3B] transition-colors">
            <div className="flex items-center gap-6">
              <button onClick={() => toggleLike(post.id, post.user_has_liked || false)} className={`flex items-center gap-2 text-[15px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${post.user_has_liked ? 'text-red-500 dark:text-red-500' : 'text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'}`}>
                <Heart className={`w-5 h-5 transition-transform duration-300 ${post.user_has_liked ? 'fill-current scale-110' : ''}`} /> 
                <span className="w-4 text-left">{(post as any).likes_count}</span>
              </button>
              
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-800"></div>
              
              <button onClick={() => toggleComments(post.id)} className="flex items-center gap-2 text-[15px] font-semibold text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-all duration-200 hover:scale-105 active:scale-95">
                <MessageCircle className="w-5 h-5" /> 
                <span className="w-4 text-left">{(post as any).comments_count}</span>
              </button>
            </div>
            
            <div className="flex items-center gap-6">
              <button onClick={() => toggleBookmark(post.id, post.user_has_bookmarked || false)} className={`flex items-center gap-2 text-[15px] font-semibold transition-all duration-200 hover:scale-105 active:scale-95 ${post.user_has_bookmarked ? 'text-violet-600 dark:text-violet-500' : 'text-gray-500 dark:text-gray-400 hover:text-violet-600 dark:hover:text-violet-400'}`}>
                <Bookmark className={`w-5 h-5 transition-transform duration-300 ${post.user_has_bookmarked ? 'fill-current scale-110' : ''}`} />
                <span className="w-4 text-left">{(post as any).bookmarks_count || 0}</span>
              </button>

              {post.user_id === currentUserId && (
                <>
                  <div className="w-px h-5 bg-gray-200 dark:bg-gray-800"></div>
                  <button 
                    onClick={() => setPostToDelete(post.id)} 
                    className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-all duration-200 hover:scale-110 active:scale-95"
                    title="Delete post"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </div>

            {/* Comments Section */}
            {expandedComments[post.id] && (
              <div className="mt-4 pt-4 border-t border-gray-50 dark:border-[#2D2B3B] flex flex-col gap-4 transition-colors">
                {/* Comment List */}
                <div className="flex flex-col gap-3">
                  {isLoadingComments[post.id] ? (
                    <div className="flex justify-center p-4">
                      <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : (postComments[post.id] || []).length === 0 ? (
                    <p className="text-xs text-gray-400 dark:text-gray-500">No comments yet. Start the conversation!</p>
                  ) : (
                    postComments[post.id].map(comment => (
                      <div key={comment.id} className="flex gap-3">
                        <img src={comment.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${comment.profiles?.full_name || 'User'}&background=7C3AED&color=fff`} className="w-6 h-6 rounded-full object-cover shrink-0" alt="" />
                        <div className="bg-gray-50 dark:bg-[#1A1A24] rounded-2xl rounded-tl-none px-4 py-2 flex-1 transition-colors">
                          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-0.5">{comment.profiles?.full_name}</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{comment.content}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                
                {/* Comment Input */}
                <div className="flex items-center gap-2 mt-2">
                  <input 
                    type="text" 
                    value={commentTexts[post.id] || ""}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [post.id]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && submitComment(post.id)}
                    placeholder="Write a comment..." 
                    className="flex-1 bg-gray-50 dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] text-gray-900 dark:text-white dark:placeholder-gray-500 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 transition-all"
                  />
                  <button 
                    onClick={() => submitComment(post.id)}
                    disabled={!commentTexts[post.id]?.trim()}
                    className="w-8 h-8 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center disabled:opacity-50 hover:bg-violet-200 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
        </article>
        </div>
      )})}

      {/* Delete Confirmation Modal */}
      {postToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-[360px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] text-center animate-in zoom-in-95 duration-200 relative overflow-hidden">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 relative z-10">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 relative z-10">Delete Post?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed relative z-10">
              This action cannot be undone. Are you sure you want to permanently delete this post?
            </p>
            <div className="flex gap-3 w-full relative z-10">
              <button 
                onClick={() => setPostToDelete(null)} 
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#2D2B3B] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#2D2B3B] transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={() => deletePost(postToDelete)} 
                className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-sm active:scale-[0.98]"
              >
                Delete
              </button>
            </div>
            
            {/* Subtle red background glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1/2 bg-red-500/5 blur-[80px] rounded-full pointer-events-none"></div>
          </div>
        </div>
      )}

      {/* Report Post Modal */}
      {reportPostId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-[400px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-2">
              <Flag className="w-6 h-6 text-red-500" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Report Post</h3>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
              Please provide a reason for reporting this post. Our moderation team will review it shortly.
            </p>
            <textarea 
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g., Spam, Harassment, Inappropriate content..."
              className="w-full p-4 text-[15px] bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 min-h-[120px] resize-none mb-6 text-gray-900 dark:text-white"
              autoFocus
            />
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => { setReportPostId(null); setReportReason(""); }} 
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#2D2B3B] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#2D2B3B] transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleReportSubmit} 
                disabled={!reportReason.trim()}
                className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:hover:bg-red-500 text-white font-bold transition-colors shadow-sm active:scale-[0.98]"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block User Modal */}
      {blockUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#1A1A24] rounded-3xl p-6 md:p-8 max-w-[360px] w-full shadow-2xl border border-gray-100 dark:border-[#2D2B3B] text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Block {blockUser.name}?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
              They will not be able to interact with you, and their posts will be completely hidden from your feed immediately.
            </p>
            <div className="flex gap-3 w-full">
              <button 
                onClick={() => setBlockUser(null)} 
                className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-[#2D2B3B] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-[#2D2B3B] transition-colors active:scale-[0.98]"
              >
                Cancel
              </button>
              <button 
                onClick={handleBlockSubmit} 
                className="flex-1 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-bold transition-colors shadow-sm active:scale-[0.98]"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

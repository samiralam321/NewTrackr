"use client"

import { useState, useEffect } from "react"
import { Flame, Star, BookOpen, Share2, Puzzle, Trophy, MapPin, Calendar, Edit2, Users, Compass, FileText, MessageCircle, Bookmark, Heart, Award, ChevronLeft } from "lucide-react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import Link from "next/link"
import { FollowButton } from "@/components/profile/follow-button"
import { Feed } from "@/components/dashboard/feed"
import { FollowListDialog } from "@/components/profile/follow-list-dialog"
import { ProfileMenu } from "@/components/profile/profile-menu"
import { createClient } from "@/lib/supabase/client"

export function ProfileDashboard({ 
  profile, 
  posts, 
  followersCount, 
  followingCount, 
  isCurrentUser,
  currentUserId
}: { 
  profile: any, 
  posts: any[], 
  followersCount: number, 
  followingCount: number, 
  isCurrentUser: boolean,
  currentUserId: string
}) {
  const [profileState, setProfileState] = useState(profile)
  const [postsCountState, setPostsCountState] = useState(posts?.length || 0)
  const [followersCountState, setFollowersCountState] = useState(followersCount || 0)
  const [followingCountState, setFollowingCountState] = useState(followingCount || 0)
  const [activeTab, setActiveTab] = useState("posts")
  
  const supabase = createClient()

  // Sync state if initial props change
  useEffect(() => {
    setProfileState(profile)
    setPostsCountState(posts?.length || 0)
    setFollowersCountState(followersCount || 0)
    setFollowingCountState(followingCount || 0)
  }, [profile, posts, followersCount, followingCount])

  // Real-time Postgres subscriptions for Streaks, Posts Count, and Followers/Following Count
  useEffect(() => {
    const channel = supabase
      .channel(`profile-dashboard-realtime:${profile.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'posts',
        filter: `user_id=eq.${profile.id}`
      }, async () => {
        // Re-fetch profile to get updated streak & last post date
        const { data: updatedProfile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', profile.id)
          .single()
        if (updatedProfile) {
          setProfileState(updatedProfile)
        }
        
        // Re-fetch total posts count
        const { count } = await supabase
          .from('posts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
        if (count !== null) {
          setPostsCountState(count)
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `following_id=eq.${profile.id}`
      }, async () => {
        // Re-fetch followers count
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id)
        if (count !== null) {
          setFollowersCountState(count)
        }
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'follows',
        filter: `follower_id=eq.${profile.id}`
      }, async () => {
        // Re-fetch following count
        const { count } = await supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id)
        if (count !== null) {
          setFollowingCountState(count)
        }
      })
      .subscribe()
       
    return () => {
      supabase.removeChannel(channel)
    }
  }, [profile.id])

  // Main Streak Logic (Synchronized with sidebar)
  let displayStreak = profileState?.consistency_score || 0
  if (profileState?.last_post_date) {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    const lastPost = new Date(profileState.last_post_date)
    lastPost.setHours(0, 0, 0, 0)
    
    if (lastPost < yesterday) {
      displayStreak = 0
    }
  }

  // Badges Logic
  const badges = [
    { id: 'first_post', name: 'First Post', active: postsCountState > 0, icon: Star, color: 'text-violet-500 bg-violet-50 font-bold' },
    { id: 'streak_starter', name: 'Streak Starter', active: displayStreak > 0, icon: Flame, color: 'text-orange-500 bg-orange-50' },
    { id: 'active_learner', name: 'Active Learner', active: postsCountState >= 10, icon: BookOpen, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'sharer', name: 'Sharer', active: (followersCountState || 0) > 0, icon: Share2, color: 'text-blue-500 bg-blue-50' },
    { id: 'problem_solver', name: 'Problem Solver', active: (posts || []).some(p => p.tags?.includes('#DSA') || p.tags?.includes('#Algorithms') || p.tags?.includes('DSA')), icon: Puzzle, color: 'text-fuchsia-500 bg-fuchsia-50' },
    { id: 'top_contributor', name: 'Top Contributor', active: postsCountState >= 50, icon: Trophy, color: 'text-amber-500 bg-amber-50' }
  ]

  // Format Joined Date
  const joinedDate = new Date(profileState?.created_at || profileState?.updated_at || new Date()).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })

  // Current Streak Widget Logic
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const todayIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1 // 0-6 where 0 is Monday
  
  return (
    <div className="flex min-h-screen w-full bg-[#FAFAFA] dark:bg-[#050505] transition-colors duration-300 pb-20">
      <main className="flex-1 px-4 md:px-8 py-6 md:py-10 max-w-6xl mx-auto w-full flex flex-col gap-6 md:gap-8">
        
        {/* HERO SECTION */}
        <div className="bg-white dark:bg-[#0B0A10] rounded-3xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm overflow-hidden relative">
          <div className="h-40 md:h-48 bg-gradient-to-r from-violet-300 via-fuchsia-200 to-pink-200 dark:from-violet-900/60 dark:via-fuchsia-900/40 dark:to-pink-900/40 w-full relative">
            <Link href="/dashboard" className="absolute top-4 left-4 z-10 md:hidden bg-white/20 hover:bg-white/40 backdrop-blur-md p-2 rounded-full text-gray-900 transition-colors shadow-sm">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            
            {/* Top-Right Menu Button */}
            {isCurrentUser && (
              <ProfileMenu />
            )}

            <svg className="absolute bottom-0 w-full h-16 text-white dark:text-[#0B0A10] preserve-3d" viewBox="0 0 1440 100" fill="currentColor" preserveAspectRatio="none">
              <path d="M0,50 C320,150 420,-50 1440,50 L1440,100 L0,100 Z"></path>
            </svg>
          </div>
          
          <div className="px-6 md:px-10 pb-8 relative">
            <div className="flex justify-between items-start">
              <div className="relative -mt-16 md:-mt-20 flex flex-col">
                <div className="relative inline-block">
                  <img 
                    src={profileState?.avatar_url || `https://ui-avatars.com/api/?name=${profileState?.full_name || 'User'}&background=EA580C&color=fff`} 
                    alt="Avatar" 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white dark:border-[#0B0A10] shadow-md bg-white"
                  />
                  <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-2 border-white dark:border-[#0B0A10] rounded-full"></div>
                </div>
              </div>
              
              <div className="mt-4 flex gap-3 items-center">
                {isCurrentUser ? (
                  <EditProfileDialog profile={profileState} />
                ) : (
                  <>
                    <FollowButton 
                      targetUserId={profileState.id} 
                      onFollowChange={(isFollowing) => {
                        setFollowersCountState(prev => prev + (isFollowing ? 1 : -1))
                      }}
                    />
                    <Link 
                      href={`/messages?userId=${profileState.id}`}
                      className="flex items-center justify-center w-11 h-11 bg-white dark:bg-[#1A1A24] border border-gray-200 dark:border-[#2D2B3B] text-gray-700 dark:text-gray-200 hover:text-violet-600 dark:hover:text-violet-400 rounded-xl transition-all duration-200 shadow-sm active:scale-95 shrink-0"
                      title="Send Message"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Link>
                  </>
                )}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                {profileState?.full_name || 'Anonymous User'}
              </h1>
              
              <p className="text-[15px] text-gray-600 dark:text-gray-300 font-medium mt-1.5 flex items-center gap-2">
                {profileState?.college || 'Trackr Member'} 🎓
              </p>
              
              <p className="text-[15px] text-gray-700 dark:text-gray-200 mt-4 max-w-2xl leading-relaxed">
                {profileState?.bio || 'Learning. Building. Sharing. 🚀'}
              </p>
              
              <div className="flex items-center gap-6 mt-4 text-sm text-gray-500 dark:text-gray-400 font-medium">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  India
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Joined {joinedDate}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* STATS BAR */}
        <div className="bg-white dark:bg-[#0B0A10] rounded-2xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm p-2 grid grid-cols-4 divide-x divide-gray-100 dark:divide-[#2D2B3B]">
          <div className="flex items-center justify-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1A1A24] rounded-xl transition-colors cursor-default">
            <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{displayStreak}</span>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Day Streak</span>
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1A1A24] rounded-xl transition-colors cursor-default">
            <div className="w-10 h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{postsCountState}</span>
              <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Posts</span>
            </div>
          </div>

          <FollowListDialog userId={profileState.id} type="followers" count={followersCountState || 0}>
            <div className="flex items-center justify-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1A1A24] rounded-xl transition-colors cursor-pointer w-full text-left">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{followersCountState || 0}</span>
                <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Followers</span>
              </div>
            </div>
          </FollowListDialog>

          <FollowListDialog userId={profileState.id} type="following" count={followingCountState || 0}>
            <div className="flex items-center justify-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-[#1A1A24] rounded-xl transition-colors cursor-pointer w-full text-left">
              <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{followingCountState || 0}</span>
                <span className="text-[12px] text-gray-500 dark:text-gray-400 font-medium">Following</span>
              </div>
            </div>
          </FollowListDialog>
        </div>

        {/* 2-COLUMN LAYOUT */}
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          
          {/* LEFT COLUMN */}
          <div className="flex-1 flex flex-col gap-6 w-full min-w-0">
            
            {/* Badges */}
            <div className="bg-white dark:bg-[#0B0A10] rounded-3xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Badges</h2>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-4">
                {badges.map(b => (
                  <div key={b.id} className="flex flex-col items-center gap-3">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${b.active ? b.color + ' shadow-sm ring-4 ring-white dark:ring-[#0B0A10]' : 'bg-gray-50 dark:bg-[#1A1A24] text-gray-300 dark:text-gray-600 opacity-50 grayscale'}`}>
                      <b.icon className="w-6 h-6" />
                    </div>
                    <span className={`text-[11px] font-semibold text-center leading-tight ${b.active ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{b.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Tabs & Feed */}
            <div className="w-full">
              <div className="flex items-center justify-center lg:justify-start mb-8 w-full max-w-full">
                <div className="h-14 bg-gray-50/80 dark:bg-[#1A1A24]/80 p-1.5 rounded-2xl flex items-center shadow-inner gap-2 sm:gap-3 overflow-x-auto border border-gray-100 dark:border-[#2D2B3B] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <button 
                    onClick={() => setActiveTab('posts')}
                    className={`flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 h-full text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'posts' ? 'bg-white dark:bg-[#2D2B3B] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <FileText className="w-4 h-4" /> Posts
                  </button>
                  <button 
                    onClick={() => setActiveTab('likes')}
                    className={`flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 h-full text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'likes' ? 'bg-white dark:bg-[#2D2B3B] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <Heart className="w-4 h-4" /> Likes
                  </button>
                  <button 
                    onClick={() => setActiveTab('replies')}
                    className={`flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 h-full text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'replies' ? 'bg-white dark:bg-[#2D2B3B] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <MessageCircle className="w-4 h-4" /> Replies
                  </button>
                  <button 
                    onClick={() => setActiveTab('highlights')}
                    className={`flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 h-full text-sm font-bold rounded-xl transition-all whitespace-nowrap ${activeTab === 'highlights' ? 'bg-white dark:bg-[#2D2B3B] text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  >
                    <Award className="w-4 h-4" /> Highlights
                  </button>
                </div>
              </div>
              
              <div className={`space-y-0 mt-0 ${activeTab === 'posts' ? 'block' : 'hidden'}`}>
                <Feed userIdFilter={profileState.id} currentUserIdProp={currentUserId} />
              </div>
              <div className={`space-y-0 mt-0 ${activeTab === 'likes' ? 'block' : 'hidden'}`}>
                <Feed likedByFilter={profileState.id} currentUserIdProp={currentUserId} />
              </div>
              <div className={`space-y-0 mt-0 ${activeTab === 'replies' ? 'block' : 'hidden'}`}>
                <Feed commentedByFilter={profileState.id} currentUserIdProp={currentUserId} />
              </div>
              <div className={`space-y-0 mt-0 ${activeTab === 'highlights' ? 'block' : 'hidden'}`}>
                <Feed userIdFilter={profileState.id} highlightsOnlyFilter={true} currentUserIdProp={currentUserId} />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN */}
          <div className="w-full lg:w-[340px] shrink-0 flex flex-col gap-6">
            
            {/* Current Streak */}
            <div className="bg-white dark:bg-[#0B0A10] rounded-3xl border border-gray-100 dark:border-[#2D2B3B] shadow-sm p-6">
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Flame className="w-4 h-4 text-orange-500" /> Current Streak
              </h2>
              <div className="mb-6">
                <span className="text-3xl font-black text-gray-900 dark:text-white mr-2">{displayStreak}</span>
                <span className="text-lg font-bold text-gray-500">Day{displayStreak !== 1 ? 's' : ''}</span>
                <p className="text-[13px] font-medium text-gray-400 mt-1">Keep going! 🔥</p>
              </div>
              
              <div className="flex justify-between items-center relative">
                <div className="absolute top-[9px] left-0 right-0 h-0.5 bg-gray-100 dark:bg-[#2D2B3B] -z-10"></div>
                {days.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${i <= todayIndex && displayStreak > 0 ? 'bg-violet-500 shadow-md shadow-violet-500/20' : 'bg-gray-100 dark:bg-[#2D2B3B]'}`}>
                      {i <= todayIndex && displayStreak > 0 && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                    </div>
                    <span className={`text-[11px] font-bold ${i === todayIndex ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>{day}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Skills & Achievements removed as per user request */}

          </div>
        </div>
      </main>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { Flame, Star, BookOpen, Share2, Puzzle, Trophy, MapPin, Calendar, Edit2, Users, Compass, FileText, MessageCircle, Bookmark, Heart, Award, ChevronLeft, Lock } from "lucide-react"
import { EditProfileDialog } from "@/components/profile/edit-profile-dialog"
import Link from "next/link"
import { FollowButton } from "@/components/profile/follow-button"
import { Feed } from "@/components/dashboard/feed"
import { FollowListDialog } from "@/components/profile/follow-list-dialog"
import { ProfileMenu } from "@/components/profile/profile-menu"
import { createClient } from "@/lib/supabase/client"
import { usePresence } from "@/components/providers/presence-provider"
import { VerifiedBadge } from "@/components/ui/verified-badge"
import { motion } from "framer-motion"
import { getBadgeLevel } from "@/lib/utils/streak"

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
  const onlineUsers = usePresence()
  const isOnline = onlineUsers.includes(profileState.id)
  
  const supabase = createClient()

  // Sync state if initial props change (prevent stale server refreshes from overwriting local state)
  useEffect(() => {
    setProfileState((prev: any) => {
      if (prev && prev.id === profile?.id) {
        const serverScore = profile?.consistency_score || 0
        const localScore = prev.consistency_score || 0
        if (serverScore >= localScore) {
          return profile
        }
        return {
          ...profile,
          consistency_score: prev.consistency_score,
          last_post_date: prev.last_post_date,
          badge_level: prev.badge_level
        }
      }
      return profile
    })
    setPostsCountState(posts?.length || 0)
    setFollowersCountState(followersCount || 0)
    setFollowingCountState(followingCount || 0)
  }, [profile, posts, followersCount, followingCount])

  // Listen for custom profile-updated event (handles local updates from posts & profile edits)
  useEffect(() => {
    const handleProfileUpdate = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail) {
        setProfileState((prev: any) => ({
          ...prev,
          ...customEvent.detail
        }))
      }
    }

    window.addEventListener('profile-updated', handleProfileUpdate)
    return () => {
      window.removeEventListener('profile-updated', handleProfileUpdate)
    }
  }, [])

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
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${profile.id}`
      }, (payload) => {
        if (payload.new) {
          setProfileState(payload.new)
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

  // Main Streak Logic (Synchronized with sidebar & LeetCode DCC UTC logic)
  let displayStreak = profileState?.consistency_score || 0
  if (profileState?.last_post_date) {
    const todayStr = new Date().toISOString().split('T')[0]
    const [currY, currM, currD] = todayStr.split('-').map(Number)
    const [lastY, lastM, lastD] = String(profileState.last_post_date).split('-').map(Number)
    const current = Date.UTC(currY, currM - 1, currD)
    const last = Date.UTC(lastY, lastM - 1, lastD)
    const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24))
    
    if (diffDays > 1) {
      displayStreak = 0
    }
  }

  // Verification Progress calculation
  const currentBadgeLevel = getBadgeLevel(profileState?.consistency_score)
  let nextTierName = ""
  let nextTierTarget = 0
  let nextTierBadgeLevel = 0
  let progressPercentage = 0
  let progressText = ""

  if (currentBadgeLevel === 0) {
    nextTierName = "Blue Tick"
    nextTierTarget = 5
    nextTierBadgeLevel = 1
    progressPercentage = Math.min(100, Math.max(0, (displayStreak / 5) * 100))
    progressText = `${displayStreak} / 5 Days`
  } else if (currentBadgeLevel === 1) {
    nextTierName = "Golden Tick"
    nextTierTarget = 30
    nextTierBadgeLevel = 2
    progressPercentage = Math.min(100, Math.max(0, (displayStreak / 30) * 100))
    progressText = `${displayStreak} / 30 Days`
  } else if (currentBadgeLevel === 2) {
    nextTierName = "Diamond Tick"
    nextTierTarget = 100
    nextTierBadgeLevel = 3
    progressPercentage = Math.min(100, Math.max(0, (displayStreak / 100) * 100))
    progressText = `${displayStreak} / 100 Days`
  } else {
    nextTierName = "Max Tier Achieved!"
    nextTierTarget = 100
    nextTierBadgeLevel = 3
    progressPercentage = 100
    progressText = `${displayStreak} Days`
  }

  // Badges Logic
  const badges = [
    { id: 'first_post', name: 'First Post', active: postsCountState > 0, icon: Star, color: 'text-violet-500 bg-violet-50 font-bold' },
    { id: 'streak_starter', name: 'Streak Starter', active: displayStreak > 0, icon: Flame, color: 'text-orange-500 bg-orange-50' },
    { id: 'active_learner', name: 'Active Learner', active: postsCountState >= 10, icon: BookOpen, color: 'text-emerald-500 bg-emerald-50' },
    { id: 'sharer', name: 'Sharer', active: (followersCountState || 0) > 0, icon: Share2, color: 'text-blue-500 bg-blue-50' },
    { id: 'problem_solver', name: 'Problem Solver', active: (posts || []).some(p => p.tags?.includes('#DSA') || p.tags?.includes('#Algorithms') || p.tags?.includes('DSA') || p.content?.toLowerCase().includes('dsa') || p.content?.toLowerCase().includes('algorithm')), icon: Puzzle, color: 'text-fuchsia-500 bg-fuchsia-50' },
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
                  {isOnline && (
                    <div className="absolute bottom-2 right-2 w-6 h-6 bg-emerald-500 border-2 border-white dark:border-[#0B0A10] rounded-full"></div>
                  )}
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
                {getBadgeLevel(profileState?.consistency_score) > 0 && (
                  <VerifiedBadge level={getBadgeLevel(profileState?.consistency_score)} size="md" />
                )}
              </h1>
              
              <p className="text-[15px] text-gray-600 dark:text-gray-300 font-medium mt-1.5 flex items-center gap-2">
                {profileState?.college || 'Trackr Member'} 🎓
              </p>
              
              <p className="text-[15px] text-gray-700 dark:text-gray-200 mt-4 max-w-2xl leading-relaxed">
                {profileState?.bio || 'Learning. Building. Sharing. 🚀'}
              </p>
              
              {profileState?.resume_url && (
                <div className="mt-4 flex items-center gap-2">
                  <a 
                    href={profileState.resume_url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-[13px] font-bold bg-violet-50 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-100 dark:border-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-950/40 transition-all duration-200 shadow-sm"
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>{profileState.resume_name || "View Resume"}</span>
                  </a>
                </div>
              )}
              
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
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-0 bg-transparent md:bg-white dark:md:bg-[#0B0A10] md:rounded-2xl md:border md:border-gray-100 dark:md:border-[#2D2B3B] md:shadow-sm md:p-2 md:divide-x md:divide-gray-100 dark:md:divide-[#2D2B3B]">
          <div className="flex items-center gap-3 md:gap-4 p-3.5 md:p-4 bg-white dark:bg-[#0B0A10] md:bg-transparent border border-gray-100 dark:border-[#2D2B3B] md:border-0 rounded-2xl md:rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] md:hover:bg-gray-50 dark:md:hover:bg-[#1A1A24] transition-all duration-200 shadow-sm md:shadow-none cursor-default">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] md:text-xl font-bold text-gray-900 dark:text-white leading-tight">{displayStreak}</span>
              <span className="text-[11px] md:text-[12px] text-gray-500 dark:text-gray-400 font-semibold md:font-medium truncate">Day Streak</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3 md:gap-4 p-3.5 md:p-4 bg-white dark:bg-[#0B0A10] md:bg-transparent border border-gray-100 dark:border-[#2D2B3B] md:border-0 rounded-2xl md:rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] md:hover:bg-gray-50 dark:md:hover:bg-[#1A1A24] transition-all duration-200 shadow-sm md:shadow-none cursor-default">
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[17px] md:text-xl font-bold text-gray-900 dark:text-white leading-tight">{postsCountState}</span>
              <span className="text-[11px] md:text-[12px] text-gray-500 dark:text-gray-400 font-semibold md:font-medium truncate">Posts</span>
            </div>
          </div>

          <FollowListDialog userId={profileState.id} type="followers" count={followersCountState || 0}>
            <div className="flex items-center gap-3 md:gap-4 p-3.5 md:p-4 bg-white dark:bg-[#0B0A10] md:bg-transparent border border-gray-100 dark:border-[#2D2B3B] md:border-0 rounded-2xl md:rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] md:hover:bg-gray-50 dark:md:hover:bg-[#1A1A24] transition-all duration-200 shadow-sm md:shadow-none cursor-pointer w-full text-left">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[17px] md:text-xl font-bold text-gray-900 dark:text-white leading-tight">{followersCountState || 0}</span>
                <span className="text-[11px] md:text-[12px] text-gray-500 dark:text-gray-400 font-semibold md:font-medium truncate">Followers</span>
              </div>
            </div>
          </FollowListDialog>

          <FollowListDialog userId={profileState.id} type="following" count={followingCountState || 0}>
            <div className="flex items-center gap-3 md:gap-4 p-3.5 md:p-4 bg-white dark:bg-[#0B0A10] md:bg-transparent border border-gray-100 dark:border-[#2D2B3B] md:border-0 rounded-2xl md:rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A24] md:hover:bg-gray-50 dark:md:hover:bg-[#1A1A24] transition-all duration-200 shadow-sm md:shadow-none cursor-pointer w-full text-left">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5 text-blue-500" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[17px] md:text-xl font-bold text-gray-900 dark:text-white leading-tight">{followingCountState || 0}</span>
                <span className="text-[11px] md:text-[12px] text-gray-500 dark:text-gray-400 font-semibold md:font-medium truncate">Following</span>
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

            {/* Verification Progress Card */}
            <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 shadow-md rounded-3xl p-6 relative overflow-hidden transition-all duration-300 hover:shadow-lg">
              {/* Background gradient glow */}
              <div className="absolute -right-10 -bottom-10 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />
              
              <h2 className="text-[15px] font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Award className="w-4 h-4 text-violet-500" /> Verification Progress
              </h2>

              <div className="space-y-4">
                {/* Current Badge Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">Current Badge</span>
                    <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {currentBadgeLevel === 0 && "None"}
                      {currentBadgeLevel === 1 && "Verified Member"}
                      {currentBadgeLevel === 2 && "Elite Member"}
                      {currentBadgeLevel === 3 && "Legend Member"}
                    </span>
                  </div>
                  <div>
                    {currentBadgeLevel > 0 ? (
                      <VerifiedBadge level={currentBadgeLevel} size="md" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-600">
                        <Lock className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Details */}
                {currentBadgeLevel < 3 ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                      <span>Next Level: {nextTierName}</span>
                      <span>{progressText}</span>
                    </div>
                    
                    {/* Progress Bar Container */}
                    <div className="w-full h-2.5 bg-gray-200/50 dark:bg-white/10 rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progressPercentage}%` }}
                        transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                        className={`h-full rounded-full ${
                          nextTierBadgeLevel === 1 
                            ? "bg-gradient-to-r from-blue-400 to-blue-600 shadow-[0_0_8px_rgba(59,130,246,0.3)]" 
                            : nextTierBadgeLevel === 2 
                            ? "bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-600 shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                            : "bg-gradient-to-r from-cyan-400 via-violet-500 to-pink-500 shadow-[0_0_12px_rgba(99,102,241,0.4)]"
                        }`}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">Target Streak:</span>
                        <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">{nextTierTarget} Days</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mr-1.5">Preview:</span>
                        <VerifiedBadge level={nextTierBadgeLevel} size="sm" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 text-center">
                    <p className="text-xs font-bold text-violet-600 dark:text-violet-400">🏆 Maximum Badge Tier Reached!</p>
                    <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-1">You are a Trackr Legend! Keep maintaining your amazing streak of {displayStreak} days!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Top Skills & Achievements removed as per user request */}

          </div>
        </div>
      </main>
    </div>
  )
}

'use client'

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { UserPlus, UserMinus } from "lucide-react"

export function FollowButton({ 
  targetUserId, 
  initialIsFollowing = false 
}: { 
  targetUserId: string
  initialIsFollowing?: boolean 
}) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const checkStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setCurrentUserId(user.id)
        
        // If we are looking at our own profile, don't show the button
        if (user.id === targetUserId) {
          setLoading(false)
          return
        }

        const { data } = await supabase
          .from('follows')
          .select('*')
          .match({ follower_id: user.id, following_id: targetUserId })
          .single()
        
        if (data) setIsFollowing(true)
      }
      setLoading(false)
    }
    
    checkStatus()
  }, [targetUserId])

  const toggleFollow = async () => {
    if (!currentUserId || currentUserId === targetUserId) return

    // Optimistic UI update
    const previousState = isFollowing
    setIsFollowing(!isFollowing)

    if (previousState) {
      // Unfollow
      const { error } = await supabase
        .from('follows')
        .delete()
        .match({ follower_id: currentUserId, following_id: targetUserId })
      
      if (error) setIsFollowing(previousState)
    } else {
      // Follow
      const { error } = await supabase
        .from('follows')
        .insert({ follower_id: currentUserId, following_id: targetUserId })
        
      if (error) setIsFollowing(previousState)
    }
  }

  if (loading || currentUserId === targetUserId) return null

  return (
    <button
      onClick={toggleFollow}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${
        isFollowing 
          ? 'bg-[#EEECFF] text-violet-600 hover:bg-violet-100' 
          : 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm'
      }`}
    >
      {isFollowing ? (
        <>
          <UserMinus className="w-4 h-4" />
          Following
        </>
      ) : (
        <>
          <UserPlus className="w-4 h-4" />
          Follow
        </>
      )}
    </button>
  )
}

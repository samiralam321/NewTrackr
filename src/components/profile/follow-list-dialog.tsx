'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import Link from "next/link"

type FollowUser = {
  id: string
  full_name: string | null
  avatar_url: string | null
  college: string | null
}

export function FollowListDialog({ 
  userId, 
  type,
  count,
  children
}: { 
  userId: string
  type: 'followers' | 'following'
  count: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [users, setUsers] = useState<FollowUser[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (!open) return
    
    const fetchUsers = async () => {
      setLoading(true)
      
      try {
        if (type === 'followers') {
          // Fetch people who follow this user
          const { data } = await supabase
            .from('follows')
            .select(`
              follower:profiles!follower_id(id, full_name, avatar_url, college)
            `)
            .eq('following_id', userId)
          
          if (data) {
            setUsers(data.map((d: any) => d.follower))
          }
        } else {
          // Fetch people this user follows
          const { data } = await supabase
            .from('follows')
            .select(`
              following:profiles!following_id(id, full_name, avatar_url, college)
            `)
            .eq('follower_id', userId)
          
          if (data) {
            setUsers(data.map((d: any) => d.following))
          }
        }
      } catch (error) {
        console.error("Error fetching follows list", error)
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [open, userId, type])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="appearance-none bg-transparent border-none p-0 text-left outline-none">
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px] rounded-2xl h-[500px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-4 border-b border-gray-100 shrink-0 bg-white">
          <DialogTitle className="text-xl capitalize flex items-center gap-2">
            {type}
            <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">{count}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto bg-gray-50/50 p-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p className="text-sm">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-6">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
                <span className="text-2xl">👻</span>
              </div>
              <h3 className="text-gray-900 font-semibold mb-1">No {type} yet</h3>
              <p className="text-sm text-gray-500">When someone connects, they'll show up right here.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {users.map(user => (
                <Link 
                  key={user.id} 
                  href={`/profile/${user.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 p-3 bg-white rounded-xl hover:bg-violet-50 transition-colors border border-transparent hover:border-violet-100"
                >
                  <img 
                    src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.full_name || 'User'}&background=7C3AED&color=fff`} 
                    alt={user.full_name || 'User'} 
                    className="w-12 h-12 rounded-full object-cover shadow-sm"
                  />
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="font-semibold text-gray-900 truncate">{user.full_name || 'Anonymous User'}</span>
                    {user.college && <span className="text-xs text-gray-500 truncate">{user.college}</span>}
                  </div>
                  <div className="text-violet-600 bg-violet-100 px-3 py-1.5 rounded-full text-xs font-bold shrink-0">
                    View
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

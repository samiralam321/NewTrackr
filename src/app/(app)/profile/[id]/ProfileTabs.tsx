'use client'

import { useState } from "react"
import { Feed } from "@/components/dashboard/feed"

export function ProfileTabs({ profileId }: { profileId: string }) {
  const [activeTab, setActiveTab] = useState<'posts' | 'replies' | 'likes'>('posts')

  return (
    <>
      {/* Tabs / Filter */}
      <div className="border-b border-gray-100 flex gap-8 mb-6">
        <button 
          onClick={() => setActiveTab('posts')}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'posts' ? 'border-b-2 border-violet-600 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Posts
        </button>
        <button 
          onClick={() => setActiveTab('replies')}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'replies' ? 'border-b-2 border-violet-600 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Replies
        </button>
        <button 
          onClick={() => setActiveTab('likes')}
          className={`pb-3 text-sm font-bold transition-colors ${activeTab === 'likes' ? 'border-b-2 border-violet-600 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Likes
        </button>
      </div>

      {/* Feed */}
      <div className="pb-20 max-w-2xl">
        {activeTab === 'posts' && <Feed userIdFilter={profileId} />}
        {activeTab === 'replies' && <Feed commentedByFilter={profileId} />}
        {activeTab === 'likes' && <Feed likedByFilter={profileId} />}
      </div>
    </>
  )
}

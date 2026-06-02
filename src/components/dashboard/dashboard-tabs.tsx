"use client"

import { useState } from "react"
import { Feed } from "@/components/dashboard/feed"
import { Settings2 } from "lucide-react"

export function DashboardTabs({ currentUserId }: { currentUserId?: string }) {
  const [activeTab, setActiveTab] = useState("for-you")

  return (
    <div className="w-full">
      {/* Desktop Version - original left-aligned pill-shaped buttons with settings icon */}
      <div className="hidden md:flex items-center justify-between border-b border-gray-100 dark:border-[#2D2B3B] mb-6 overflow-hidden">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-3">
          <button 
            onClick={() => setActiveTab('for-you')}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'for-you' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A24]'}`}
          >
            For you
          </button>
          <button 
            onClick={() => setActiveTab('following')}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'following' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A24]'}`}
          >
            Following
          </button>
          <button 
            onClick={() => setActiveTab('college')}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${activeTab === 'college' ? 'bg-violet-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A24]'}`}
          >
            College
          </button>
        </div>
        <button className="flex-shrink-0 h-8 w-8 ml-4 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors">
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      {/* Mobile Version - distributed evenly, clean underlines, no settings icon */}
      <div className="flex md:hidden items-center justify-between border-b border-gray-100 dark:border-[#2D2B3B] mb-6">
        <div className="flex-1 flex items-center justify-around py-1">
          <button 
            onClick={() => setActiveTab('for-you')}
            className={`relative py-3 px-3 text-[14px] sm:text-base font-bold transition-all duration-300 flex-1 text-center ${
              activeTab === 'for-you' 
                ? 'text-violet-600 dark:text-violet-400 font-extrabold' 
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            For you
            {activeTab === 'for-you' && (
              <span className="absolute bottom-0 left-1/6 right-1/6 h-[3px] bg-violet-600 dark:bg-violet-400 rounded-full animate-in fade-in slide-in-from-left-2 duration-200"></span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('following')}
            className={`relative py-3 px-3 text-[14px] sm:text-base font-bold transition-all duration-300 flex-1 text-center ${
              activeTab === 'following' 
                ? 'text-violet-600 dark:text-violet-400 font-extrabold' 
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Following
            {activeTab === 'following' && (
              <span className="absolute bottom-0 left-1/6 right-1/6 h-[3px] bg-violet-600 dark:bg-violet-400 rounded-full animate-in fade-in slide-in-from-left-2 duration-200"></span>
            )}
          </button>
          
          <button 
            onClick={() => setActiveTab('college')}
            className={`relative py-3 px-3 text-[14px] sm:text-base font-bold transition-all duration-300 flex-1 text-center ${
              activeTab === 'college' 
                ? 'text-violet-600 dark:text-violet-400 font-extrabold' 
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            College
            {activeTab === 'college' && (
              <span className="absolute bottom-0 left-1/6 right-1/6 h-[3px] bg-violet-600 dark:bg-violet-400 rounded-full animate-in fade-in slide-in-from-left-2 duration-200"></span>
            )}
          </button>
        </div>
      </div>
      
      <div className={activeTab === 'for-you' ? 'block' : 'hidden'}>
        <Feed currentUserIdProp={currentUserId} />
      </div>
      <div className={activeTab === 'following' ? 'block' : 'hidden'}>
        <Feed followingOnlyFilter={true} currentUserIdProp={currentUserId} />
      </div>
      <div className={activeTab === 'college' ? 'block' : 'hidden'}>
        <Feed collegeOnlyFilter={true} currentUserIdProp={currentUserId} />
      </div>
    </div>
  )
}

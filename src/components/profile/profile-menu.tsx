'use client'

import { useState } from "react"
import { MoreVertical, Share2, Settings, HelpCircle, LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

export function ProfileMenu() {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  
  const [supportEmail, setSupportEmail] = useState("")
  const [supportMessage, setSupportMessage] = useState("")
  const [isSendingSupport, setIsSendingSupport] = useState(false)
  const [supportSent, setSupportSent] = useState(false)
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    setIsLoggingOut(true)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Trackr Profile',
          url: window.location.href
        })
      } catch (err) {}
    }
    setIsSheetOpen(false)
  }

  const handleSupportSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingSupport(true)
    
    try {
      await fetch('https://formsubmit.co/ajax/sa8103339@gmail.com', {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            email: supportEmail,
            message: supportMessage,
            _subject: "Support Request from Trackr"
        })
      })
      
      setSupportSent(true)
      setTimeout(() => {
        setIsHelpOpen(false)
        setSupportSent(false)
        setSupportEmail("")
        setSupportMessage("")
      }, 2000)
    } catch (error) {
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSendingSupport(false)
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsSheetOpen(!isSheetOpen)}
        className="absolute top-4 right-4 z-20 flex items-center justify-center w-10 h-10 bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-full shadow-sm border border-white/20 dark:border-white/10 hover:bg-white/80 dark:hover:bg-black/60 transition-all duration-200 active:scale-95"
      >
        <MoreVertical className="w-5 h-5 text-gray-800 dark:text-gray-200" strokeWidth={2} />
      </button>

      {/* Menu Overlay / Dropdown */}
      {isSheetOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/10 dark:bg-black/40 md:bg-transparent md:dark:bg-transparent backdrop-blur-[2px] md:backdrop-blur-none z-50 animate-in fade-in duration-200"
            onClick={() => setIsSheetOpen(false)}
          />
          
          <div className="fixed md:absolute inset-x-0 bottom-0 md:inset-auto md:right-0 md:top-12 z-50 bg-white dark:bg-[#12121A] rounded-t-[32px] md:rounded-2xl shadow-2xl md:shadow-lg md:border md:border-gray-100 md:dark:border-[#2D2B3B] animate-in slide-in-from-bottom md:slide-in-from-top-2 duration-300 ease-out pb-8 md:pb-2 md:w-64">
            
            {/* Drag Handle (Mobile Only) */}
            <div className="w-full flex justify-center pt-4 pb-2 md:hidden">
              <div className="w-10 h-1 bg-gray-200 dark:bg-gray-800 rounded-full" />
            </div>

            <div className="px-4 md:px-2 py-2 flex flex-col gap-1">
              
              <button onClick={handleShare} className="flex items-center gap-4 px-4 h-14 md:h-12 rounded-xl md:rounded-lg hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors">
                <Share2 className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
                <span className="text-[16px] md:text-sm font-medium text-gray-900 dark:text-white">Share Profile</span>
              </button>

              <button className="flex items-center gap-4 px-4 h-14 md:h-12 rounded-xl md:rounded-lg hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors">
                <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
                <span className="text-[16px] md:text-sm font-medium text-gray-900 dark:text-white">Settings</span>
              </button>

              <button onClick={() => { setIsSheetOpen(false); setIsHelpOpen(true); }} className="flex items-center gap-4 px-4 h-14 md:h-12 rounded-xl md:rounded-lg hover:bg-gray-50 dark:hover:bg-[#1A1A24] transition-colors">
                <HelpCircle className="w-5 h-5 text-gray-700 dark:text-gray-300" strokeWidth={1.5} />
                <span className="text-[16px] md:text-sm font-medium text-gray-900 dark:text-white">Help & Support</span>
              </button>

              <div className="h-px bg-gray-100 dark:bg-[#2D2B3B] my-2 mx-2"></div>

              {/* Logout Button */}
              <button 
                onClick={() => {
                  setIsSheetOpen(false)
                  setTimeout(() => setIsConfirmOpen(true), 200)
                }} 
                className="flex items-center gap-4 px-4 h-14 md:h-12 rounded-xl md:rounded-lg hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
              >
                <LogOut className="w-5 h-5 text-[#EF4444]" strokeWidth={1.5} />
                <span className="text-[16px] md:text-sm font-medium text-[#EF4444]">Logout</span>
              </button>

            </div>
          </div>
        </>
      )}

      {/* Logout Confirmation Modal */}
      {isConfirmOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200"
            onClick={() => !isLoggingOut && setIsConfirmOpen(false)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-[#1A1A24] w-full max-w-[340px] rounded-[32px] p-8 shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
              <h3 className="text-[22px] font-black text-[#111827] dark:text-white text-center mb-3">Leaving so soon?</h3>
              <p className="text-[15px] text-[#6B7280] dark:text-gray-400 text-center mb-8 leading-relaxed px-2">
                We're sad to see you go. Are you sure you want to log out of your session?
              </p>
              
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setIsConfirmOpen(false)}
                  disabled={isLoggingOut}
                  className="w-full h-14 bg-[#7C3AED] hover:bg-[#6D28D9] text-white font-bold rounded-2xl transition-colors active:scale-[0.98] flex items-center justify-center text-[16px]"
                >
                  Stay Logged In
                </button>
                <button 
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full h-12 bg-transparent text-[#6B7280] hover:text-[#374151] dark:text-gray-400 dark:hover:text-gray-200 font-bold rounded-2xl transition-colors active:scale-[0.98] text-[15px]"
                >
                  {isLoggingOut ? "Logging out..." : "Yes, Log Out"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Help & Support Modal */}
      {isHelpOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[60] animate-in fade-in duration-200"
            onClick={() => setIsHelpOpen(false)}
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-[#1A1A24] w-full max-w-md rounded-3xl p-6 shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-200">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Help & Support</h3>
              <p className="text-sm text-gray-500 mb-6">Have a question or feedback? Send a message directly to our support team.</p>
              
              {supportSent ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Message Sent!</h4>
                  <p className="text-sm text-gray-500">We'll get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSupportSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Email</label>
                    <input 
                      type="email" 
                      value={supportEmail}
                      onChange={(e) => setSupportEmail(e.target.value)}
                      placeholder="name@example.com" 
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea 
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      placeholder="Tell us what's on your mind..." 
                      rows={4}
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setIsHelpOpen(false)} disabled={isSendingSupport} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2D2B3B] rounded-xl transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSendingSupport} className="px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                      {isSendingSupport ? 'Sending...' : 'Send Message'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

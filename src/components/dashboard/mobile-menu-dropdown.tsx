'use client'

import { useState, useRef, useEffect } from "react"
import { Menu, Trophy, Medal, Bookmark, Bell, MessageSquare } from "lucide-react"
import Link from "next/link"

export function MobileMenuDropdown({ profile }: { profile?: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Contact States
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactMessage, setContactMessage] = useState("")
  const [isSendingContact, setIsSendingContact] = useState(false)
  const [contactSent, setContactSent] = useState(false)

  // Auto-fill profile name if loaded
  useEffect(() => {
    if (profile?.full_name) {
      setContactName(profile.full_name)
    }
  }, [profile])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingContact(true)
    
    try {
      await fetch('https://formsubmit.co/ajax/sa8103339@gmail.com', {
        method: "POST",
        headers: { 
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        },
        body: JSON.stringify({
            name: contactName,
            email: contactEmail,
            message: contactMessage,
            _subject: "Trackr Creator Contact Form (Mobile)"
        })
      })
      
      setContactSent(true)
      setTimeout(() => {
        setIsContactOpen(false)
        setContactSent(false)
        setContactMessage("")
      }, 2000)
    } catch (error) {
      alert("Failed to send message. Please try again.")
    } finally {
      setIsSendingContact(false)
    }
  }

  return (
    <div className="md:hidden relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 -ml-1 text-gray-900 dark:text-white rounded-full hover:bg-gray-100 dark:hover:bg-[#1A1A24] transition-colors focus:outline-none"
      >
        <Menu className="w-7 h-7" />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-3 w-56 bg-white dark:bg-[#1A1A24] rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-gray-100 dark:border-[#2D2B3B] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="py-2">
            <Link href="/challenges" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Trophy className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Challenge</span>
            </Link>
            <Link href="/leaderboard" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Medal className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Leaderboard</span>
            </Link>
            <Link href="/saved" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Bookmark className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Saved Message</span>
            </Link>
            <Link href="/notifications" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors">
              <Bell className="w-[18px] h-[18px] text-violet-500" />
              <span className="font-semibold text-[15px]">Notification</span>
            </Link>
            <button 
              onClick={() => {
                setIsContactOpen(true)
                setIsOpen(false)
              }} 
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-[#2D2B3B] text-gray-700 dark:text-gray-300 transition-colors text-left font-semibold text-[15px]"
            >
              <MessageSquare className="w-[18px] h-[18px] text-violet-500" />
              <span>Contact</span>
            </button>
          </div>
        </div>
      )}

      {/* Contact Creator Modal (Mobile) */}
      {isContactOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-[2px] animate-in fade-in duration-200"
            onClick={() => !isSendingContact && setIsContactOpen(false)}
          />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pointer-events-none">
            <div className="bg-white dark:bg-[#1A1A24] w-full max-w-sm rounded-3xl p-6 shadow-2xl pointer-events-auto animate-in zoom-in-95 fade-in duration-200 border border-gray-100 dark:border-[#2D2B3B]">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Contact Admin / Creator 💬</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Have any feedback, issues, or suggestions? Drop the creator a line directly!</p>
              
              {contactSent ? (
                <div className="flex flex-col items-center justify-center py-8 text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Message Sent!</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Your message is on its way to the creator's inbox.</p>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Name</label>
                    <input 
                      type="text" 
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Enter your name" 
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Your Email</label>
                    <input 
                      type="email" 
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com" 
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Message</label>
                    <textarea 
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Type your thoughts here..." 
                      rows={4}
                      required
                      className="w-full bg-gray-50 dark:bg-[#0B0A10] border border-gray-200 dark:border-[#2D2B3B] text-gray-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 resize-y"
                    />
                  </div>
                  <div className="flex justify-end gap-3 mt-2">
                    <button type="button" onClick={() => setIsContactOpen(false)} disabled={isSendingContact} className="px-5 py-2.5 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#2D2B3B] rounded-xl transition-colors disabled:opacity-50">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSendingContact} className="px-5 py-2.5 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 rounded-xl shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50">
                      {isSendingContact ? 'Sending...' : 'Send'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

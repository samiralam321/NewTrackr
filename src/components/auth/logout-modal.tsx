'use client'

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { clearTrackrClientCaches } from "@/lib/cache/client-cache"

interface LogoutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => Promise<void> | void
}

/**
 * LogoutIllustration - Custom SVG vector reproducing the open door,
 * leafy plant, curious peeking character, and walking cat matching the reference.
 */
function LogoutIllustration() {
  return (
    <svg
      viewBox="0 0 160 110"
      className="w-[145px] h-[98px] select-none pointer-events-none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Doorway Interior */}
      <rect x="42" y="24" width="34" height="68" rx="2" fill="#D1FAE5" />

      {/* Doorway Frame */}
      <path
        d="M41 92V23H77V92"
        stroke="#264653"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Open Door Slab (Angled outward to the left) */}
      <path
        d="M41 23L23 28V90L41 92Z"
        fill="#264653"
        stroke="#1E3940"
        strokeWidth="1"
      />

      {/* Door Inset Panels */}
      <polygon points="25,32 38,28 38,54 25,56" fill="#1D343C" />
      <polygon points="25,60 38,58 38,84 25,86" fill="#1D343C" />

      {/* Door Handle */}
      <rect x="35" y="55" width="2" height="7" rx="1" fill="#E2E8F0" />

      {/* Potted Plant (Left) */}
      <path d="M21 78C16 72 11 74 8 76C12 79 17 79 21 78Z" fill="#10B981" />
      <path d="M21 78C17 68 11 69 7 72C11 75 16 77 21 78Z" fill="#059669" />
      <path d="M21 78C21 66 16 64 13 65C16 71 19 75 21 78Z" fill="#34D399" />
      <path d="M21 78C23 68 28 66 31 68C27 73 24 76 21 78Z" fill="#10B981" />
      <path d="M21 78C26 71 31 73 34 76C30 79 25 79 21 78Z" fill="#059669" />
      <path d="M14 92L16 78H26L28 92Z" fill="#264653" />

      {/* Wonder/Curiosity Marks above Character's Head */}
      <path
        d="M72 13C73 11 75 12 74 14C73 16 75 18 74 19"
        stroke="#6B7280"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="74" cy="21" r="0.7" fill="#6B7280" />
      <path
        d="M79 16C80 14 82 15 81 17C80 19 82 21 81 22"
        stroke="#6B7280"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <circle cx="81" cy="24" r="0.7" fill="#6B7280" />

      {/* Character (Peeking around right side of door) */}
      <circle cx="71" cy="26" r="4.5" fill="#1F2421" />
      <circle cx="74" cy="31" r="6" fill="#FBD5BE" />
      <path
        d="M68 31C68 25 73 24 77 27C75 29 74 32 74 35C72 35 68 34 68 31Z"
        fill="#1F2421"
      />
      <circle cx="76.5" cy="31.5" r="0.8" fill="#1F2421" />
      <ellipse cx="76" cy="33.5" rx="1.2" ry="0.6" fill="#F472B6" opacity="0.6" />

      {/* Pink Top */}
      <path
        d="M68 37C72 37 77 39 77 43L76 59C73 59 69 59 67 59L66 42C66 39 67 37 68 37Z"
        fill="#FB7185"
      />
      <path
        d="M66 47C64 47 63 49 64 52C65 53 67 53 67 51Z"
        fill="#FBD5BE"
      />

      {/* Teal Pants */}
      <path d="M67 59H76L77 84H68L67 59Z" fill="#0D9488" />
      <ellipse cx="73" cy="88" rx="3.5" ry="1.8" fill="#1F2421" />

      {/* Cat (Walking towards the right) */}
      <path
        d="M96 81C98 77 103 76 108 79C110 81 111 83 109 85C105 86 99 86 96 81Z"
        fill="#1F2421"
      />
      <circle cx="111" cy="78" r="3.2" fill="#1F2421" />
      <polygon points="109,75 111,71 112,75" fill="#1F2421" />
      <polygon points="112,75 114,72 115,76" fill="#1F2421" />
      <rect x="97" y="82" width="1.8" height="7.5" rx="0.9" fill="#1F2421" />
      <rect x="101" y="83" width="1.8" height="6.5" rx="0.9" fill="#1F2421" />
      <rect x="106" y="83" width="1.8" height="6.5" rx="0.9" fill="#1F2421" />
      <rect x="109" y="82" width="1.8" height="7.5" rx="0.9" fill="#1F2421" />
      <path
        d="M96 81C93 77 92 71 95 66C96.5 63.5 98 65 97 67C94.5 72 95.5 76 97.5 80Z"
        fill="#1F2421"
      />
    </svg>
  )
}

export function LogoutModal({ isOpen, onClose, onConfirm }: LogoutModalProps) {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const supabase = createClient()

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (!isOpen) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = originalOverflow
    }
  }, [isOpen])

  // Handle ESC key to dismiss modal
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleLogout = async () => {
    setIsLoggingOut(true)
    try {
      if (onConfirm) {
        await onConfirm()
      } else {
        clearTrackrClientCaches()
        try {
          localStorage.removeItem("trackr_opp_bookmarks")
          localStorage.removeItem("trackr_user_reposts")
        } catch {}
        try {
          await fetch("/api/auth/signout", { method: "POST" }).catch(() => {})
        } catch {}
        await supabase.auth.signOut()
        window.location.href = "/"
      }
    } catch (err) {
      console.error("Logout failed:", err)
      window.location.href = "/"
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-[#000000] z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200 select-none"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="relative flex items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Distinctive thin white outline rotated behind the modal */}
        <div
          className="absolute inset-0 rounded-[30px] border-[1.5px] border-white -rotate-[2.2deg] pointer-events-none select-none"
          style={{ transform: "rotate(-2.2deg)" }}
          aria-hidden="true"
        />

        {/* Centered White Confirmation Modal */}
        <div className="relative bg-[#FFFFFF] rounded-[30px] w-[305px] max-w-[calc(100vw-36px)] pt-5 pb-6 px-6 flex flex-col items-center text-center shadow-none text-black">
          {/* Top-Right Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-black hover:opacity-60 transition-opacity p-1 cursor-pointer focus:outline-none"
            aria-label="Close modal"
          >
            <X className="w-4 h-4 stroke-[2.2]" />
          </button>

          {/* Top Illustration */}
          <LogoutIllustration />

          {/* Modal Heading */}
          <h3
            id="logout-modal-title"
            className="text-[19px] font-bold text-black mt-2 mb-2 tracking-tight"
          >
            Are you logging out?
          </h3>

          {/* Description Text with Account Switch Link */}
          <p className="text-[12px] leading-[1.55] text-[#4B5563] max-w-[240px] mb-5 font-normal">
            You can always log back in at any time. If you just want to switch accounts, you can add{" "}
            <Link
              href="/auth"
              onClick={onClose}
              className="underline text-black font-normal hover:opacity-75 transition-opacity"
            >
              another account
            </Link>
            .
          </p>

          {/* Action Buttons: Cancel & Log out */}
          <div className="flex items-center justify-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoggingOut}
              className="min-w-[66px] h-[29px] px-3.5 rounded-full bg-white border border-black text-black font-semibold text-[11.5px] hover:bg-black/5 active:scale-95 transition-all flex items-center justify-center cursor-pointer focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="min-w-[68px] h-[29px] px-3.5 rounded-full bg-black border border-black text-white font-semibold text-[11.5px] hover:bg-neutral-900 active:scale-95 transition-all flex items-center justify-center cursor-pointer focus:outline-none"
            >
              {isLoggingOut ? "..." : "Log out"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

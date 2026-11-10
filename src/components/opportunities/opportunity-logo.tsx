'use client'

import React, { useState } from "react"

interface OpportunityLogoProps {
  src?: string | null
  alt: string
  category?: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

// Built-in pristine SVG brand vectors for 100% instant, crack-free rendering
function BrandIcon({ name }: { name: string }) {
  const n = name.toLowerCase()

  if (n.includes('flipkart')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#2874F0" />
        <path d="M14 16H34L31 34H17L14 16Z" fill="#FFE500" />
        <path d="M22 13V16H26V13C26 11.9 25.1 11 24 11C22.9 11 22 11.9 22 13Z" stroke="#FFE500" strokeWidth="2" strokeLinecap="round" />
        <path d="M21 21H27M21 26H25" stroke="#2874F0" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }

  if (n.includes('amazon')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#131921" />
        <path d="M16 23C16 19.5 18.5 17 22.5 17C26.5 17 28.5 19.5 28.5 23V27H26V25.5C25.2 26.6 23.8 27.2 22.2 27.2C19.5 27.2 17.5 25.6 17.5 23.2C17.5 20.8 19.3 19.5 22.2 19.5C23.6 19.5 24.8 19.9 25.5 20.4V19.8C25.5 18.2 24.2 17.2 22.5 17.2C21.1 17.2 19.8 17.8 19 18.7L17.5 17.2C18.8 15.8 20.6 15 22.5 15C25.8 15 28 17 28 20.2V27.5H26.2L26 26.2C25 27.3 23.5 27.8 21.8 27.8C18.5 27.8 16 25.8 16 23Z" fill="#FFFFFF" />
        <path d="M14 32C19 35 29 35 34 31M31.5 30.5L34 31L33 33.5" stroke="#FF9900" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )
  }

  if (n.includes('google')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect width="48" height="48" rx="10" fill="#FFFFFF" className="dark:fill-[#1E1C2A]" />
        <path fill="#4285F4" d="M35.6 24.3c0-.8-.1-1.6-.2-2.3H24v4.5h6.6c-.3 1.5-1.1 2.8-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9z"/>
        <path fill="#34A853" d="M24 36c3.2 0 6-1.1 8-3l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5h-4v3.1C15.2 33.2 19.3 36 24 36z"/>
        <path fill="#FBBC05" d="M17.2 26.2c-.3-.7-.4-1.5-.4-2.2 0-.8.1-1.6.4-2.2v-3.1h-4C12.4 20.3 12 22.1 12 24s.4 3.7 1.2 5.3l4-3.1z"/>
        <path fill="#EA4335" d="M24 16.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C29.9 13.3 27.2 12.4 24 12.4c-4.7 0-8.8 2.8-10.8 6.7l4 3.1c1-2.9 3.7-5.4 6.8-5.4z"/>
      </svg>
    )
  }

  if (n.includes('microsoft')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full">
        <rect width="48" height="48" rx="10" fill="#FFFFFF" className="dark:fill-[#1E1C2A]" />
        <rect x="13" y="13" width="10" height="10" fill="#F25022" rx="1"/>
        <rect x="25" y="13" width="10" height="10" fill="#7FBA00" rx="1"/>
        <rect x="13" y="25" width="10" height="10" fill="#00A4EF" rx="1"/>
        <rect x="25" y="25" width="10" height="10" fill="#FFB900" rx="1"/>
      </svg>
    )
  }

  if (n.includes('meta')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#0081FB" />
        <path d="M29.5 18C27.5 18 25.8 19.3 24 21.8C22.2 19.3 20.5 18 18.5 18C14.8 18 12 21.3 12 25.4C12 29.5 15.2 32 18.5 32C21 32 22.9 30.5 24 28.5C25.1 30.5 27 32 29.5 32C32.8 32 36 29.5 36 25.4C36 21.3 33.2 18 29.5 18ZM18.5 29C16.4 29 14.5 27.2 14.5 25.4C14.5 22.6 16.5 20.5 18.5 20.5C20.4 20.5 22 22.3 23.3 25C22.2 27.4 20.6 29 18.5 29ZM29.5 29C27.4 29 25.8 27.4 24.7 25C26 22.3 27.6 20.5 29.5 20.5C31.5 20.5 33.5 22.6 33.5 25.4C33.5 27.2 31.6 29 29.5 29Z" fill="#FFFFFF"/>
      </svg>
    )
  }

  if (n.includes('nvidia')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#000000" />
        <path d="M23 16C18 16.2 14.5 19.5 14 24C14.5 28.5 18 31.8 23 32V29.5C19.5 29.3 17 27 16.5 24C17 21 19.5 18.7 23 18.5V16Z" fill="#76B900"/>
        <path d="M23 19.5C20.5 19.7 18.5 21.5 18.2 24C18.5 26.5 20.5 28.3 23 28.5V26.5C21.7 26.3 20.5 25.3 20.5 24C20.5 22.7 21.7 21.7 23 21.5V19.5Z" fill="#76B900"/>
        <path d="M25 14C30.5 14.3 35 18.8 35 24C35 29.2 30.5 33.7 25 34V32C29.2 31.7 32.8 28.2 32.8 24C32.8 19.8 29.2 16.3 25 16V14Z" fill="#76B900"/>
      </svg>
    )
  }

  if (n.includes('github')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#24292E" />
        <path fillRule="evenodd" clipRule="evenodd" d="M24 13C17.9 13 13 17.9 13 24C13 28.9 16.2 33 20.5 34.4C21.1 34.5 21.3 34.2 21.3 33.9C21.3 33.6 21.3 32.8 21.3 31.8C18.2 32.5 17.6 30.3 17.6 30.3C17.1 29 16.4 28.6 16.4 28.6C15.4 27.9 16.5 27.9 16.5 27.9C17.6 28 18.2 29 18.2 29C19.2 30.7 20.8 30.2 21.4 29.9C21.5 29.2 21.8 28.6 22.1 28.3C19.7 28 17.1 27.1 17.1 23C17.1 21.8 17.5 20.8 18.2 20.1C18.1 19.8 17.7 18.7 18.3 17.2C18.3 17.2 19.2 16.9 21.3 18.3C22.2 18.1 23.1 17.9 24 17.9C24.9 17.9 25.8 18.1 26.7 18.3C28.8 16.9 29.7 17.2 29.7 17.2C30.3 18.7 29.9 19.8 29.8 20.1C30.5 20.8 30.9 21.8 30.9 23C30.9 27.1 28.3 28 25.9 28.3C26.3 28.6 26.7 29.3 26.7 30.4C26.7 31.9 26.7 33.5 26.7 33.9C26.7 34.2 26.9 34.5 27.5 34.4C31.8 33 35 28.9 35 24C35 17.9 30.1 13 24 13Z" fill="#FFFFFF"/>
      </svg>
    )
  }

  if (n.includes('devfolio') || n.includes('ethindia')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#3770FF" />
        <path d="M16 15H25C29.4 15 33 18.6 33 23C33 27.4 29.4 31 25 31H16V15Z" fill="#FFFFFF" fillOpacity="0.2"/>
        <path d="M16 18H24C27.3 18 30 20.7 30 24C30 27.3 27.3 30 24 30H16V18Z" fill="#FFFFFF"/>
      </svg>
    )
  }

  if (n.includes('tata') || n.includes('tcs')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#004B87" />
        <text x="24" y="29" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="system-ui, sans-serif" textAnchor="middle" letterSpacing="0.5">TCS</text>
      </svg>
    )
  }

  if (n.includes('reliance')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#003580" />
        <circle cx="24" cy="24" r="14" stroke="#EE2A24" strokeWidth="2.5" />
        <text x="24" y="28" fill="#FFFFFF" fontSize="12" fontWeight="800" fontFamily="system-ui, sans-serif" textAnchor="middle">RF</text>
      </svg>
    )
  }

  if (n.includes('aicte') || n.includes('ministry of education') || n.includes('smart india')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#FF9933" />
        <circle cx="24" cy="24" r="13" fill="#FFFFFF" />
        <circle cx="24" cy="24" r="6" stroke="#000080" strokeWidth="1.5" />
        <text x="24" y="27" fill="#000080" fontSize="8" fontWeight="bold" textAnchor="middle">SIH</text>
      </svg>
    )
  }

  if (n.includes('mlh') || n.includes('major league')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#C2272D" />
        <text x="24" y="29" fill="#FFFFFF" fontSize="11" fontWeight="900" fontFamily="monospace" textAnchor="middle">MLH</text>
      </svg>
    )
  }

  if (n.includes('linux')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#003366" />
        <circle cx="24" cy="24" r="12" fill="#FFFFFF" fillOpacity="0.15" />
        <text x="24" y="28" fill="#FFFFFF" fontSize="11" fontWeight="800" textAnchor="middle">LFX</text>
      </svg>
    )
  }

  if (n.includes('adobe')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#FA0F00" />
        <path d="M19 16L13 32H18.2L20.5 26.2H24.5L19 16ZM29 16L35 32H29.8L27.5 26.2H23.5L29 16ZM24 23.5L26.5 30H21.5L24 23.5Z" fill="#FFFFFF"/>
      </svg>
    )
  }

  if (n.includes('goldman')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#7399C6" />
        <text x="24" y="29" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle">GS</text>
      </svg>
    )
  }

  if (n.includes('uber')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#000000" />
        <text x="24" y="28" fill="#FFFFFF" fontSize="9" fontWeight="900" letterSpacing="0.5" textAnchor="middle">UBER</text>
      </svg>
    )
  }

  if (n.includes('atlassian')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#0052CC" />
        <path d="M23.5 17C20.5 21.5 19 26 19 31H24C24 28 25 24 28.5 20L23.5 17ZM24.5 31C24.5 28 25.5 24 29 20L34 23C31 27.5 29.5 31 24.5 31Z" fill="#FFFFFF"/>
      </svg>
    )
  }

  if (n.includes('cisco')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#005073" />
        <path d="M16 28V24M20 28V20M24 28V16M28 28V20M32 28V24" stroke="#00BCEB" strokeWidth="2.5" strokeLinecap="round" />
        <text x="24" y="34" fill="#FFFFFF" fontSize="6" fontWeight="bold" textAnchor="middle">CISCO</text>
      </svg>
    )
  }

  if (n.includes('salesforce')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#00A1E0" />
        <path d="M19.5 20C20.5 17.5 23 16 26 16C29.5 16 32 18.5 32.5 21.5C34 22 35 23.5 35 25.5C35 28 33 30 30.5 30H17.5C15 30 13 28 13 25.5C13 23.3 14.5 21.5 16.7 21.1C17.2 19 18.5 20 19.5 20Z" fill="#FFFFFF" />
      </svg>
    )
  }

  if (n.includes('morgan stanley')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#002D62" />
        <text x="24" y="29" fill="#FFFFFF" fontSize="12" fontWeight="bold" textAnchor="middle">MS</text>
      </svg>
    )
  }

  if (n.includes('infosys') || n.includes('hackwithinfy')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#007CC3" />
        <text x="24" y="29" fill="#FFFFFF" fontSize="9" fontWeight="900" textAnchor="middle" letterSpacing="0.5">INFY</text>
      </svg>
    )
  }

  if (n.includes('leetcode')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#282828" />
        <path d="M28 16L18 24L28 32" stroke="#FFA116" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="30" cy="24" r="3" fill="#B3B3B3" />
      </svg>
    )
  }

  if (n.includes('codeforces')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#181818" />
        <rect x="14" y="24" width="5" height="10" rx="1" fill="#FFD700" />
        <rect x="21.5" y="18" width="5" height="16" rx="1" fill="#318CE7" />
        <rect x="29" y="28" width="5" height="6" rx="1" fill="#DC143C" />
      </svg>
    )
  }

  if (n.includes('hdfc')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#004C8F" />
        <rect x="16" y="16" width="16" height="16" fill="#ED232A" rx="2" />
        <rect x="20" y="20" width="8" height="8" fill="#FFFFFF" />
        <rect x="22" y="18" width="4" height="12" fill="#004C8F" />
      </svg>
    )
  }

  if (n.includes('bitcoin')) {
    return (
      <svg viewBox="0 0 48 48" className="w-full h-full" fill="none">
        <rect width="48" height="48" rx="10" fill="#F7931A" />
        <text x="24" y="31" fill="#FFFFFF" fontSize="18" fontWeight="bold" textAnchor="middle">₿</text>
      </svg>
    )
  }

  return null
}

export function OpportunityLogo({
  src,
  alt,
  category,
  className = "",
  size = 'md'
}: OpportunityLogoProps) {
  const [imgError, setImgError] = useState(false)

  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg",
    md: "w-10 h-10 rounded-xl",
    lg: "w-12 h-12 rounded-2xl",
  }[size]

  // Check if we have a known pristine vector brand icon
  const hasBrandVector = BrandIcon({ name: alt }) !== null

  // If we have a dedicated vector icon, render it directly for razor-sharp, 0-latency display
  if (hasBrandVector) {
    return (
      <div className={`${sizeClasses} shrink-0 overflow-hidden shadow-xs flex items-center justify-center p-0.5 border border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#1A1825] ${className}`}>
        <BrandIcon name={alt} />
      </div>
    )
  }

  // If an external logo image URL is provided and has not errored
  if (src && !imgError) {
    return (
      <div className={`${sizeClasses} shrink-0 overflow-hidden shadow-xs flex items-center justify-center p-1.5 border border-gray-100 dark:border-[#2D2B3B] bg-white dark:bg-[#1A1825] ${className}`}>
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setImgError(true)}
          className="max-w-full max-h-full object-contain"
        />
      </div>
    )
  }

  // Graceful, stylish fallback monogram when no image exists or image failed
  const initial = alt.trim().charAt(0).toUpperCase() || 'O'
  
  const gradients = [
    'from-violet-500 to-indigo-600',
    'from-blue-500 to-cyan-600',
    'from-emerald-500 to-teal-600',
    'from-amber-500 to-orange-600',
    'from-rose-500 to-pink-600',
  ]
  const colorIndex = Math.abs(alt.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % gradients.length
  const gradientClass = gradients[colorIndex]

  return (
    <div className={`${sizeClasses} shrink-0 bg-gradient-to-br ${gradientClass} text-white font-extrabold flex items-center justify-center shadow-xs text-sm border border-white/20 select-none ${className}`}>
      {initial}
    </div>
  )
}

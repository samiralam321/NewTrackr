import React from "react"

interface CodingIllustrationProps {
  className?: string
}

export function CodingIllustration({ className = "w-full max-w-[260px] h-auto" }: CodingIllustrationProps) {
  return (
    <div className={`relative flex items-center justify-center select-none pointer-events-none ${className}`}>
      <svg
        viewBox="0 0 260 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-sm"
      >
        <defs>
          {/* Purple Gradient for Back Panel */}
          <linearGradient id="codeBackPanelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4B5FD" />
            <stop offset="50%" stopColor="#A78BFA" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Subtle gradient for Front Panel border */}
          <linearGradient id="codeFrontBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F3FF" />
            <stop offset="100%" stopColor="#EDE9FE" />
          </linearGradient>

          {/* Deep soft shadow for floating effect */}
          <filter id="codeFrontShadow" x="-15%" y="-15%" width="145%" height="150%" filterUnits="userSpaceOnUse">
            <feDropShadow dx="0" dy="14" stdDeviation="16" floodColor="#581C87" floodOpacity="0.14" />
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.04" />
          </filter>

          {/* Ambient Ground Shadow */}
          <filter id="codeGroundShadow" x="-30%" y="-30%" width="160%" height="160%" filterUnits="userSpaceOnUse">
            <feGaussianBlur stdDeviation="12" />
          </filter>
        </defs>

        {/* Ambient Ground Shadow beneath floating panels */}
        <ellipse cx="138" cy="174" rx="88" ry="12" fill="#7C3AED" fillOpacity="0.12" filter="url(#codeGroundShadow)" />

        {/* Soft Circular Backdrop Aura */}
        <ellipse cx="130" cy="102" rx="94" ry="76" fill="#EDE9FE" fillOpacity="0.5" />

        {/* Back Panel (Lavender-Purple tilted card) */}
        <g transform="rotate(7 175 115)">
          <rect x="110" y="55" width="125" height="106" rx="18" fill="url(#codeBackPanelGrad)" />
        </g>

        {/* Front Panel (Crisp White Card with soft shadow & border) */}
        <g filter="url(#codeFrontShadow)">
          <rect
            x="24"
            y="42"
            width="162"
            height="120"
            rx="20"
            fill="#FFFFFF"
            stroke="url(#codeFrontBorderGrad)"
            strokeWidth="1.5"
          />

          {/* Window Control Buttons: Red, Amber, Green */}
          <circle cx="44" cy="59" r="4.5" fill="#EF4444" />
          <circle cx="57" cy="59" r="4.5" fill="#F59E0B" />
          <circle cx="70" cy="59" r="4.5" fill="#10B981" />

          {/* Center Coding Symbol </> */}
          {/* Left Angle Bracket < */}
          <path
            d="M 87 90 L 72 103 L 87 116"
            stroke="#7628F5"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Center Slash / */}
          <path
            d="M 109 87 L 97 122"
            stroke="#7628F5"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Right Angle Bracket > */}
          <path
            d="M 120 90 L 135 103 L 120 116"
            stroke="#7628F5"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Top-Right Action / Motion Strokes */}
        <g stroke="#7628F5" strokeWidth="2.8" strokeLinecap="round">
          {/* Diagonal left burst */}
          <path d="M 183 30 L 180 18" />
          {/* Center burst */}
          <path d="M 194 34 L 204 24" />
          {/* Diagonal right burst */}
          <path d="M 199 46 L 212 43" />
        </g>
      </svg>
    </div>
  )
}

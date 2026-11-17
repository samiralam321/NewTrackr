'use client'

import React from "react"
import { Compass, Sparkles, Rocket } from "lucide-react"
import LiquidChrome from "@/components/ui/LiquidChrome"

export default function ExplorePage() {
  return (
    <div className="relative flex h-full w-full min-h-full overflow-hidden bg-[#050508] transition-colors duration-300">
      {/* LiquidChrome Canvas Background */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden">
        <LiquidChrome
          baseColor={[0.1, 0.1, 0.1]}
          speed={0.15}
          amplitude={0.4}
          frequencyX={3}
          frequencyY={3}
          interactive={true}
        />
        {/* Subtle vignette / ambiance overlay so text stands out crisply */}
        <div className="absolute inset-0 bg-black/30 pointer-events-none" />
      </div>

      <main className="relative z-10 flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 flex flex-col items-center justify-center text-center">
        <div className="max-w-xl mx-auto space-y-8 flex flex-col items-center backdrop-blur-xl bg-black/40 border border-white/10 p-8 md:p-12 rounded-3xl shadow-2xl">
          {/* Animated Icon Container */}
          <div className="relative flex items-center justify-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-violet-500/30 blur-3xl rounded-full"></div>
            
            <div className="relative w-28 h-28 bg-gradient-to-br from-violet-600/30 to-fuchsia-600/30 rounded-full flex items-center justify-center border border-violet-400/40 shadow-xl shadow-violet-500/20 animate-bounce" style={{ animationDuration: '3s' }}>
              <Compass className="w-12 h-12 text-violet-300" />
            </div>
            
            {/* Sparkles */}
            <Sparkles className="absolute -top-2 -right-4 w-6 h-6 text-yellow-300 animate-pulse" />
            <Sparkles className="absolute bottom-4 -left-6 w-5 h-5 text-fuchsia-300 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-fuchsia-300 to-indigo-300">More</span>
            </h1>
            <p className="text-lg text-gray-300 leading-relaxed max-w-md mx-auto">
              We're currently crafting an exciting new way to explore content, discover peers, and learn together. The arena is expanding.
            </p>
          </div>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/15 backdrop-blur-md rounded-full text-sm font-semibold text-white border border-white/15 shadow-sm transition-colors">
              <Rocket className="w-4 h-4 text-violet-400" />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

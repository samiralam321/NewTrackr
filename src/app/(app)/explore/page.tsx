import { Compass, Sparkles, Rocket } from "lucide-react"

export default function ExplorePage() {
  return (
    <div className="flex h-screen w-full bg-[#FCFBFF] dark:bg-[#050505] transition-colors duration-300">
      <main className="flex-1 overflow-y-auto px-4 md:px-10 py-6 md:py-8 flex flex-col items-center justify-center text-center">
        
        <div className="max-w-xl mx-auto space-y-8 flex flex-col items-center">
          {/* Animated Icon Container */}
          <div className="relative flex items-center justify-center">
            {/* Background glow */}
            <div className="absolute inset-0 bg-violet-400/20 dark:bg-violet-600/20 blur-3xl rounded-full"></div>
            
            <div className="relative w-28 h-28 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/40 dark:to-fuchsia-900/40 rounded-full flex items-center justify-center border border-violet-200 dark:border-violet-700/50 shadow-xl shadow-violet-200/50 dark:shadow-none animate-bounce" style={{ animationDuration: '3s' }}>
              <Compass className="w-12 h-12 text-violet-600 dark:text-violet-400" />
            </div>
            
            {/* Sparkles */}
            <Sparkles className="absolute -top-2 -right-4 w-6 h-6 text-yellow-400 animate-pulse" />
            <Sparkles className="absolute bottom-4 -left-6 w-5 h-5 text-fuchsia-400 animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="space-y-4 relative z-10">
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white">
              Discover <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">More</span>
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 leading-relaxed max-w-md mx-auto">
              We're currently crafting an exciting new way to explore content, discover peers, and learn together. The arena is expanding.
            </p>
          </div>

          <div className="pt-6 relative z-10">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white dark:bg-[#1A1A24] rounded-full text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-[#2D2B3B] shadow-sm">
              <Rocket className="w-4 h-4 text-violet-500" />
              <span>Coming Soon</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  )
}

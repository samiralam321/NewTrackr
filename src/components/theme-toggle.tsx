'use client'

import { useTheme } from "./theme-provider"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const isDark = theme === 'dark'

  return (
    <div className="flex items-center justify-center gap-4 bg-white dark:bg-[#1A1A24] border border-gray-100 dark:border-[#2D2B3B] px-5 py-2.5 rounded-[2rem] shadow-sm transition-colors duration-300 w-full max-w-[280px]">
      
      {/* Light Side */}
      <button 
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 transition-colors duration-300 ${!isDark ? 'text-orange-500 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <Sun className="w-4 h-4" />
        <span className="text-sm">Light</span>
      </button>

      {/* Toggle Switch */}
      <button
        onClick={() => setTheme(isDark ? 'light' : 'dark')}
        className="relative flex items-center w-[46px] h-6 bg-violet-500 rounded-full cursor-pointer focus:outline-none transition-colors duration-300 shrink-0"
        aria-label="Toggle Dark Mode"
      >
        <div 
          className={`absolute w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-300 ease-in-out ${
            isDark ? 'translate-x-[24px]' : 'translate-x-[4px]'
          }`}
        />
      </button>

      {/* Dark Side */}
      <button 
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 transition-colors duration-300 ${isDark ? 'text-indigo-400 font-semibold' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <span className="text-sm">Dark</span>
        <Moon className="w-4 h-4" />
      </button>

    </div>
  )
}

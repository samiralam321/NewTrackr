'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'light',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(defaultTheme)

  useEffect(() => {
    const root = window.document.documentElement
    
    // Check local storage first
    const savedTheme = localStorage.getItem('trackr-theme') as Theme | null
    if (savedTheme) {
      setTheme(savedTheme)
      if (savedTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
    } else {
      if (defaultTheme === 'dark') {
        root.classList.add('dark')
      }
    }
  }, [defaultTheme])

  const setThemeHandler = (newTheme: Theme) => {
    localStorage.setItem('trackr-theme', newTheme)
    
    const applyTheme = () => {
      const root = window.document.documentElement
      if (newTheme === 'dark') {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }
      setTheme(newTheme)
    }

    // Use GPU-accelerated View Transitions API if supported for 60fps butter-smooth transition
    if (typeof document !== 'undefined' && 'startViewTransition' in document) {
      const root = window.document.documentElement
      root.classList.add('theme-transitioning')
      try {
        const transition = (document as any).startViewTransition(() => {
          applyTheme()
        })
        if (transition && transition.finished) {
          transition.finished.finally(() => {
            root.classList.remove('theme-transitioning')
          })
        } else {
          setTimeout(() => root.classList.remove('theme-transitioning'), 300)
        }
      } catch (err) {
        root.classList.remove('theme-transitioning')
        applyTheme()
      }
    } else {
      applyTheme()
    }
  }

  const value = {
    theme,
    setTheme: setThemeHandler,
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}

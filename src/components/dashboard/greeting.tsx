'use client'

import { useState, useEffect } from 'react'

export function Greeting({ name, className }: { name: string; className?: string }) {
  const [greeting, setGreeting] = useState("Good morning")
  const [icon, setIcon] = useState("☀️")

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) {
      setGreeting("Good morning")
      setIcon("☀️")
    } else if (hour < 18) {
      setGreeting("Good afternoon")
      setIcon("🌤️")
    } else {
      setGreeting("Good evening")
      setIcon("🌙")
    }
  }, [])

  return (
    <span 
      suppressHydrationWarning
      className={className || "text-xl sm:text-2xl md:text-[25px] font-bold tracking-tight text-[#0f1419] dark:text-[#e7e9ea] transition-colors leading-tight inline-block"}
    >
      {greeting}, {name}! <span className="inline-block select-none">{icon}</span>
    </span>
  )
}

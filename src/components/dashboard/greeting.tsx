'use client'

import { useState, useEffect } from 'react'

export function Greeting({ name }: { name: string }) {
  const [greeting, setGreeting] = useState("Good morning") // Default SSR value

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreeting("Good morning")
    else if (hour < 18) setGreeting("Good afternoon")
    else setGreeting("Good evening")
  }, [])

  return (
    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-gray-900 dark:text-white transition-colors leading-tight">
      {greeting}, {name}! <span className="inline-block">👋</span>
    </h1>
  )
}

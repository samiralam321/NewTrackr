"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Star, Zap } from "lucide-react"

type Particle = {
  id: number
  x: number // End X position relative to center (-100 to 100vw)
  y: number // End Y position relative to bottom (-50 to -150vh)
  size: number
  color: string
  duration: number
  delay: number
  type: "orb" | "streak" | "star" | "spark"
}

export function Celebration({ accuracy }: { accuracy: number }) {
  const [particles, setParticles] = useState<Particle[]>([])
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Determine intensity based on accuracy
    let count = 10
    if (accuracy === 100) count = 80 // Diamond
    else if (accuracy >= 60) count = 40 // Gold/Silver

    const colors = [
      "#8B5CF6", // Violet 500
      "#C084FC", // Purple 400
      "#F59E0B", // Amber 500
      "#FBBF24", // Amber 400
      "#FFFFFF", // White
      "#D8B4FE", // Purple 300
    ]

    const types: Particle["type"][] = ["orb", "orb", "orb", "streak", "star", "spark"]

    const generated: Particle[] = Array.from({ length: count }).map((_, i) => {
      // Create a fountain spread: more particles go straight up, fewer go wide
      const angle = (Math.random() - 0.5) * Math.PI // -90 to 90 degrees
      const power = Math.random() * 0.6 + 0.4 // 0.4 to 1.0

      const endX = Math.sin(angle) * power * (typeof window !== 'undefined' ? window.innerWidth * 0.8 : 800)
      const endY = -Math.abs(Math.cos(angle)) * power * (typeof window !== 'undefined' ? window.innerHeight * 1.2 : 1000)

      return {
        id: i,
        x: endX,
        y: endY,
        size: Math.random() * 12 + 4, // 4px to 16px
        color: colors[Math.floor(Math.random() * colors.length)],
        duration: Math.random() * 1.5 + 1.5, // 1.5s to 3s
        delay: Math.random() * 0.2, // Slight delay for fountain effect
        type: types[Math.floor(Math.random() * types.length)],
      }
    })

    setParticles(generated)

    // Cleanup from DOM after animation completes
    const timer = setTimeout(() => {
      setIsVisible(false)
    }, 4000)

    return () => clearTimeout(timer)
  }, [accuracy])

  if (!isVisible || particles.length === 0) return null

  return (
    <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden flex items-end justify-center">
      {particles.map((p) => {
        
        // Define specific styling per particle type
        let style = {}
        let content = null

        if (p.type === "orb") {
          style = {
            width: p.size,
            height: p.size,
            borderRadius: "50%",
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}`,
          }
        } else if (p.type === "streak") {
          style = {
            width: Math.max(2, p.size / 4),
            height: p.size * 4,
            borderRadius: "999px",
            backgroundColor: p.color,
            boxShadow: `0 0 ${p.size}px ${p.color}`,
          }
        } else if (p.type === "star") {
          content = <Star fill={p.color} color={p.color} width={p.size * 1.5} height={p.size * 1.5} className="drop-shadow-lg" />
        } else if (p.type === "spark") {
          content = <Zap fill={p.color} color={p.color} width={p.size * 1.5} height={p.size * 1.5} className="drop-shadow-lg" />
        }

        return (
          <motion.div
            key={p.id}
            initial={{ 
              x: 0, 
              y: 100, 
              opacity: 1, 
              scale: 0.5,
              rotate: 0 
            }}
            animate={{
              x: p.x,
              y: p.y,
              opacity: [1, 1, 0], // Stay visible, then fade out
              scale: [0.5, 1.2, 0.8],
              rotate: p.x > 0 ? 360 : -360 // Spin while flying
            }}
            transition={{
              duration: p.duration,
              delay: p.delay,
              ease: [0.25, 1, 0.5, 1], // Custom ease-out cubic bezier for a "burst" feel
            }}
            style={{ position: "absolute", bottom: "-5vh", ...style }}
          >
            {content}
          </motion.div>
        )
      })}
    </div>
  )
}

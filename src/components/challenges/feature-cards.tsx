import React from "react"
import Link from "next/link"
import { Flame, BarChart3, Trophy, Star, ArrowRight } from "lucide-react"

export function FeatureCards() {
  const cards = [
    {
      id: "consistency",
      title: "Build Consistency",
      description: "Solve a new challenge every day.",
      href: "/challenges",
      icon: Flame,
      iconColor: "#7628F5",
      iconBg: "bg-[#F3EEFF]"
    },
    {
      id: "progress",
      title: "Track Progress",
      description: "See your scores and improvement over time.",
      href: "/profile",
      icon: BarChart3,
      iconColor: "#3B82F6",
      iconBg: "bg-[#EFF6FF]"
    },
    {
      id: "rank",
      title: "Earn Rank",
      description: "Climb the leaderboard and unlock new ranks.",
      href: "/leaderboard",
      icon: Trophy,
      iconColor: "#F59E0B",
      iconBg: "bg-[#FFF7ED]"
    },
    {
      id: "badges",
      title: "Win Badges",
      description: "Complete streaks and special challenges.",
      href: "/profile",
      icon: Star,
      iconColor: "#FB7185",
      iconBg: "bg-[#FDF2F8]",
      fillIcon: true
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 w-full">
      {cards.map((card) => {
        const IconComponent = card.icon
        return (
          <Link
            key={card.id}
            href={card.href}
            className="bg-white border border-[#EBE6F7] rounded-[22px] p-5 shadow-xs shadow-purple-900/5 hover:shadow-md hover:border-purple-200 transition-all flex flex-col justify-between min-h-[142px] group cursor-pointer"
          >
            {/* Top: Icon Badge */}
            <div className={`w-10 h-10 rounded-xl ${card.iconBg} flex items-center justify-center mb-4 transition-transform group-hover:scale-105`}>
              <IconComponent
                className="w-5 h-5"
                style={{ color: card.iconColor }}
                fill={card.fillIcon ? card.iconColor : "none"}
              />
            </div>

            {/* Bottom Row: Text and Arrow */}
            <div className="flex items-end justify-between gap-2">
              <div className="min-w-0 pr-1">
                <h4 className="text-[15px] font-bold text-[#17152F] mb-1 group-hover:text-[#7628F5] transition-colors truncate">
                  {card.title}
                </h4>
                <p className="text-[12.5px] text-[#6B7280] leading-snug">
                  {card.description}
                </p>
              </div>

              {/* Small Circular Arrow Button */}
              <div className="w-8 h-8 rounded-full bg-[#F3EEFF] text-[#7628F5] flex items-center justify-center group-hover:bg-[#7628F5] group-hover:text-white transition-all shrink-0 self-end ml-1 shadow-xs">
                <ArrowRight className="w-4 h-4" />
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

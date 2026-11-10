'use client'



interface HackathonItem {
  id: string
  name: string
  dates: string
  prize: string
  url: string
  logoType: 'sih' | 'amazon' | 'flipkart'
}

const HACKATHONS: HackathonItem[] = [
  {
    id: "sih-2026",
    name: "SIH 2026",
    dates: "Mar 1 - Apr 30, 2026",
    prize: "₹1.5 Cr+",
    url: "https://www.sih.gov.in/",
    logoType: "sih"
  },
  {
    id: "amazon-ml-2026",
    name: "Amazon ML Challenge",
    dates: "Jan 12 - Feb 20, 2026",
    prize: "₹50 Lakh",
    url: "https://www.hackerearth.com/challenges/hackathon/amazon-ml-challenge-2026/",
    logoType: "amazon"
  },
  {
    id: "flipkart-grid-6",
    name: "Flipkart Grid 6.0",
    dates: "Feb 5 - Mar 5, 2026",
    prize: "₹30 Lakh",
    url: "https://www.flipkartcareers.com/students",
    logoType: "flipkart"
  }
]

function HackathonLogo({ type }: { type: HackathonItem['logoType'] }) {
  if (type === 'sih') {
    return (
      <div className="w-9 h-9 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
        <span className="text-base select-none">💡</span>
      </div>
    )
  }
  if (type === 'amazon') {
    return (
      <div className="w-9 h-9 rounded-full bg-slate-900 text-white font-black text-xs flex items-center justify-center shrink-0">
        <span className="tracking-tighter">amzn</span>
      </div>
    )
  }
  return (
    <div className="w-9 h-9 rounded-full bg-amber-400 text-blue-950 font-bold text-xs flex items-center justify-center shrink-0">
      <span>🛍️</span>
    </div>
  )
}

export function UpcomingHackathons() {
  return (
    <div className="bg-[#f7f9f9] dark:bg-[#16181c] border border-[#eff3f4] dark:border-[#2f3336] rounded-2xl overflow-hidden transition-colors">
      {/* Header */}
      <div className="px-4 pt-3.5 pb-1 flex items-center justify-between">
        <h3 className="text-[18px] font-bold text-[#0f1419] dark:text-[#e7e9ea]">
          Upcoming Hackathons
        </h3>
      </div>

      {/* List */}
      <div>
        {HACKATHONS.map((hackathon) => (
          <a
            key={hackathon.id}
            href={hackathon.url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-3 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors flex items-center justify-between group cursor-pointer"
          >
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <HackathonLogo type={hackathon.logoType} />
              <div className="min-w-0">
                <p className="text-[15px] font-bold text-[#0f1419] dark:text-[#e7e9ea] truncate group-hover:underline">
                  {hackathon.name}
                </p>
                <p className="text-[13px] text-[#536471] dark:text-[#71767b] font-normal">
                  {hackathon.dates}
                </p>
              </div>
            </div>

            <span className="text-[12px] font-semibold px-2.5 py-0.5 rounded-md bg-purple-50 text-[#7C3AED] dark:bg-purple-950/40 dark:text-purple-300 border border-purple-100 dark:border-purple-800/40 shrink-0">
              {hackathon.prize}
            </span>
          </a>
        ))}
      </div>

      {/* Footer / Show more */}
      <button
        onClick={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('switch-feed-tab', { detail: 'opportunities' }))
          }
        }}
        className="w-full text-left px-4 py-3.5 text-[14px] font-semibold text-[#7C3AED] hover:bg-black/[0.03] dark:hover:bg-white/[0.03] block transition-colors cursor-pointer border-t border-[#eff3f4] dark:border-[#2f3336]/60"
      >
        Show all opportunities
      </button>
    </div>
  )
}

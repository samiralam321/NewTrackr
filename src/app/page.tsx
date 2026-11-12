import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { InstallButton } from "@/components/pwa/InstallPWA"
import { Flame, Code2, Trophy, Briefcase, AtSign, ShieldCheck, Star, Users, UsersRound, BookOpen, Target, Award, CheckCircle2, Zap, TrendingUp, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      <main className="flex-1">
        {/* ================= HERO CONTAINER (Navbar + Hero Integrated on 4K Landscape Asset) ================= */}
        <div 
          className="relative w-full min-h-screen min-h-[100dvh] flex flex-col justify-between overflow-hidden bg-[#DFECFC]"
        >
          {/* Synchronously decoded high-priority hero background image - Eliminates reload flash/blink */}
          <img 
            src="/hero-bg.webp" 
            alt="Trackr landscape background" 
            role="presentation" 
            fetchPriority="high"
            loading="eager"
            decoding="sync"
            className="absolute inset-0 w-full h-full object-cover object-bottom pointer-events-none select-none z-0"
          />
          {/* Top Floating Pill Navigation Bar - Ribbon Style */}
          <div className="relative z-50 w-full flex justify-center px-4 pt-4 sm:pt-6">
            <header className="inline-flex items-center gap-4 sm:gap-7 lg:gap-8 px-3.5 sm:px-5 py-1.5 sm:py-2 bg-white rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-gray-100/90">
              {/* Left: Trackr Logo & Brand */}
              <Link href="/" className="flex items-center gap-1.5 group shrink-0">
                <img 
                  src="/logo.png" 
                  alt="Trackr Logo" 
                  width={32}
                  height={32}
                  className="w-7 h-7 sm:w-8 sm:h-8 object-contain scale-[1.1] origin-center transition-transform group-hover:scale-[1.15]" 
                />
                <span className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">Trackr</span>
              </Link>
              
              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-xs sm:text-sm font-medium text-gray-600">
                <a href="#features" className="hover:text-[#6B46C1] transition-colors">Features</a>
                <a href="#how-it-works" className="hover:text-[#6B46C1] transition-colors">How it Works</a>
                <a href="#why-trackr" className="hover:text-[#6B46C1] transition-colors">Why Trackr?</a>
                <a href="#community" className="hover:text-[#6B46C1] transition-colors">Community</a>
              </nav>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <InstallButton 
                  className="flex items-center gap-1 px-3 sm:px-3.5 h-7 sm:h-8 rounded-full border border-violet-200/90 bg-white hover:bg-violet-50/60 active:scale-95 text-[#6B46C1] text-xs font-semibold transition-all shadow-2xs cursor-pointer" 
                  iconClassName="w-3.5 h-3.5 text-[#6B46C1]"
                />
                <Link href="/auth">
                  <button 
                    type="button"
                    className="bg-[#6B46C1] hover:bg-[#5835A8] text-white rounded-full px-3.5 sm:px-4 h-7 sm:h-8 text-xs font-semibold shadow-xs transition-all hover:shadow-sm hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center"
                  >
                    Get Started
                  </button>
                </Link>
              </div>
            </header>
          </div>

          {/* Hero Content Area - Centered in Viewport inside Lavender Dome - Shifted -35px Upward as a Group */}
          <section className="relative z-10 flex-1 flex flex-col items-center justify-center pt-8 sm:pt-12 md:pt-14 pb-20 sm:pb-28 md:pb-36 max-w-4xl mx-auto px-6 sm:px-8 text-center w-full -translate-y-8 sm:-translate-y-[35px]">
            
            {/* Centered Pill Badge */}
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-4 py-1.5 rounded-full bg-white/95 backdrop-blur-xs border border-violet-100 shadow-[0_4px_16px_rgba(107,70,193,0.08)] mb-6 sm:mb-8 animate-hero-badge">
              <span className="text-xs sm:text-sm font-semibold text-[#2D2459]">Join 25,000+ students</span>
              <UsersRound className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#6B46C1] shrink-0" />
            </div>

            {/* Editorial Serif Heading matching Playfair Display reference exactly */}
            <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl lg:text-[68px] text-[#1E1738] font-normal tracking-[-0.015em] leading-[1.15] max-w-3xl mx-auto animate-hero-heading">
              <span className="block font-normal">A Space for Students to</span>
              <span className="block italic text-[#6B46C1] font-normal mt-1 sm:mt-2">Share, Learn and Grow</span>
            </h1>

            {/* Hero Description */}
            <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-[#524B6B] max-w-[620px] mx-auto leading-relaxed font-normal animate-hero-subtitle">
              Trackr helps you share daily progress, build consistency, and stay accountable with a community of learners.
            </p>

            {/* Call-to-Action Buttons */}
            <div className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-4 w-full sm:w-auto animate-hero-cta">
              <Link href="/auth" className="w-full sm:w-auto">
                <button 
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#6B46C1] hover:bg-[#5835A8] text-white rounded-full px-8 py-3.5 text-sm sm:text-base font-semibold shadow-lg shadow-violet-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Start Your Journey</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <button 
                  type="button"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-full px-8 py-3.5 text-sm sm:text-base font-semibold border border-[#E2D9F3] bg-white hover:bg-violet-50 text-[#6B46C1] shadow-sm hover:shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>See How It Works</span>
                  <span className="ml-2 text-xs text-[#6B46C1]">▶</span>
                </button>
              </a>
            </div>

            {/* Social Proof & Value Props Bar Below Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-wrap items-center justify-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs sm:text-sm font-medium text-[#4A3E72] animate-hero-subtitle">
              <div className="inline-flex items-center gap-1.5 sm:gap-2">
                <Users className="w-4 h-4 text-[#6B46C1] shrink-0" />
                <span>Join 200+ students</span>
              </div>
              <span className="hidden sm:inline-block h-3.5 w-px bg-violet-300/70" aria-hidden="true" />
              <div className="inline-flex items-center gap-1.5 sm:gap-2">
                <Zap className="w-4 h-4 text-[#6B46C1] fill-[#6B46C1] shrink-0" />
                <span>Build consistency</span>
              </div>
              <span className="hidden sm:inline-block h-3.5 w-px bg-violet-300/70" aria-hidden="true" />
              <div className="inline-flex items-center gap-1.5 sm:gap-2">
                <TrendingUp className="w-4 h-4 text-[#6B46C1] shrink-0" />
                <span>Grow together</span>
              </div>
            </div>
          </section>
        </div>

        {/* ================= HOW IT WORKS SECTION ================= */}
        <section
          id="how-it-works"
          className="scroll-mt-0 bg-[#FAF9FE] relative overflow-hidden border-b border-violet-100/60"
        >
          {/* ── Main two-column layout: Left = Character | Right = Content ── */}
          <div className="relative z-10 max-w-[1360px] mx-auto flex flex-col lg:flex-row lg:items-stretch min-h-[520px] lg:min-h-[580px]">

            {/* ═══ LEFT COLUMN — 3D Character (35% on desktop) ═══ */}
            <div className="relative flex-shrink-0 w-full lg:w-[35%] xl:w-[34%] flex items-end justify-center pt-10 pb-0 lg:pt-0 lg:pb-0 overflow-visible">
              {/* Lavender circular aura behind character */}
              <div
                className="absolute left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:-left-4 xl:-left-8 bottom-0 rounded-full pointer-events-none z-0"
                style={{
                  width: "clamp(320px, 36vw, 560px)",
                  height: "clamp(320px, 36vw, 560px)",
                  background: "radial-gradient(circle at 50% 55%, rgba(216,195,252,0.85) 0%, rgba(232,218,254,0.55) 42%, rgba(243,237,254,0.20) 65%, rgba(250,249,254,0) 80%)"
                }}
                aria-hidden="true"
              />
              {/* Character image — bottom-aligned */}
              <img
                src="/cheerful-student.webp"
                alt="Cheerful student with laptop and backpack"
                width={520}
                height={570}
                loading="lazy"
                decoding="async"
                className="relative z-10 w-[260px] sm:w-[300px] md:w-[340px] lg:w-full lg:max-w-[420px] xl:max-w-[460px] h-auto object-contain drop-shadow-xl select-none pointer-events-none"
              />
            </div>

            {/* ═══ RIGHT COLUMN — Heading + Subtitle + 4 Steps (65% on desktop) ═══ */}
            <div className="flex-1 min-w-0 flex flex-col justify-center px-5 sm:px-8 lg:px-8 xl:px-10 pt-8 sm:pt-10 lg:pt-14 pb-28 sm:pb-32 lg:pb-36 xl:pb-40">

              {/* Section label */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-violet-100/90 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-4 shadow-2xs self-start">
                Simple Daily Rhythm
              </div>

              {/* Main heading */}
              <h2 className="text-3xl sm:text-4xl lg:text-[38px] xl:text-[44px] font-bold text-[#1E1738] mb-3 tracking-tight leading-[1.15]">
                How Trackr Works
              </h2>

              {/* Subtitle */}
              <p className="text-[#524B6B] text-base sm:text-[17px] leading-relaxed font-normal mb-10 lg:mb-12 max-w-[520px]">
                A frictionless daily loop designed to turn small daily efforts into exponential career outcomes.
              </p>

              {/* ── Four-Step Timeline ── */}
              <div className="relative w-full">
                {/* Dashed connecting line through icon centers */}
                <div
                  className="hidden md:block absolute top-7 left-[12.5%] right-[12.5%] h-0.5 border-t-2 border-dashed border-violet-200/80 z-0"
                  aria-hidden="true"
                />

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-8 gap-x-2 md:gap-x-3 xl:gap-x-4 relative z-10">

                  {/* Step 1: Learn */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-14 h-14 bg-[#ECE8FD] rounded-2xl flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <BookOpen className="w-6 h-6 text-[#7C3AED]" />
                    </div>
                    <h3 className="font-bold text-[#1E1738] text-[13.5px] lg:text-[13.5px] xl:text-[14.5px] mb-1.5 tracking-tight whitespace-nowrap">
                      1. Learn
                    </h3>
                    <p className="text-[11px] lg:text-[11.5px] xl:text-[12.5px] text-[#524B6B] leading-[1.6]">
                      <span className="lg:block">Spend 30+ minutes daily</span>{" "}
                      <span className="lg:block">learning DSA, Web Dev, AI,</span>{" "}
                      <span className="lg:block">or Core CS concepts.</span>
                    </p>
                  </div>

                  {/* Step 2: Log Progress */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-14 h-14 bg-[#E0F2FE] rounded-2xl flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Code2 className="w-6 h-6 text-[#0284C7]" />
                    </div>
                    <h3 className="font-bold text-[#1E1738] text-[13.5px] lg:text-[13.5px] xl:text-[14.5px] mb-1.5 tracking-tight whitespace-nowrap">
                      2. Log Progress
                    </h3>
                    <p className="text-[11px] lg:text-[11.5px] xl:text-[12.5px] text-[#524B6B] leading-[1.6]">
                      <span className="lg:block">Post what you built,</span>{" "}
                      <span className="lg:block">problems solved, and paste</span>{" "}
                      <span className="lg:block">syntax-highlighted code.</span>
                    </p>
                  </div>

                  {/* Step 3: Keep The Streak */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-14 h-14 bg-[#DCFCE7] rounded-2xl flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Flame className="w-6 h-6 text-[#F97316] fill-[#F97316]/20" />
                    </div>
                    <h3 className="font-bold text-[#1E1738] text-[13.5px] lg:text-[13.5px] xl:text-[14.5px] mb-1.5 tracking-tight whitespace-nowrap">
                      3. Keep The Streak
                    </h3>
                    <p className="text-[11px] lg:text-[11.5px] xl:text-[12.5px] text-[#524B6B] leading-[1.6]">
                      <span className="lg:block">Earn streak flames, unlock</span>{" "}
                      <span className="lg:block">milestone badges, and climb</span>{" "}
                      <span className="lg:block">campus leaderboards.</span>
                    </p>
                  </div>

                  {/* Step 4: Unlock Opportunities */}
                  <div className="flex flex-col items-center text-center group">
                    <div className="w-14 h-14 bg-[#FCE7F3] rounded-2xl flex items-center justify-center mb-3.5 shadow-sm group-hover:scale-110 transition-transform duration-300 shrink-0">
                      <Trophy className="w-6 h-6 text-[#DB2777]" />
                    </div>
                    <h3 className="font-bold text-[#1E1738] text-[13.5px] lg:text-[13.5px] xl:text-[14.5px] mb-1.5 tracking-tight whitespace-nowrap">
                      4. Unlock Opportunities
                    </h3>
                    <p className="text-[11px] lg:text-[11.5px] xl:text-[12.5px] text-[#524B6B] leading-[1.6]">
                      <span className="lg:block">Discover curated hackathons,</span>{" "}
                      <span className="lg:block">placement opportunities, and</span>{" "}
                      <span className="lg:block">partner teams.</span>
                    </p>
                  </div>

                </div>
              </div>
            </div>

          </div>

          {/* Bottom Flowing Water-Flow Waves — strictly below all text content */}
          <div className="absolute inset-x-0 bottom-0 pointer-events-none select-none z-0 overflow-hidden leading-none" aria-hidden="true">
            <svg
              className="w-full h-16 sm:h-20 md:h-24 lg:h-[96px] xl:h-[104px] block"
              viewBox="0 0 1440 120"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="trackrWaveBack" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ECE3FC" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#E4D7FB" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#ECE3FC" stopOpacity="0.6" />
                </linearGradient>
                <linearGradient id="trackrWaveMid" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#E9DDFB" stopOpacity="0.75" />
                  <stop offset="45%" stopColor="#DFCEFA" stopOpacity="0.85" />
                  <stop offset="100%" stopColor="#EDE4FC" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="trackrWaveFront" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#F5F0FE" stopOpacity="0.95" />
                  <stop offset="50%" stopColor="#EFE7FC" stopOpacity="0.95" />
                  <stop offset="100%" stopColor="#F7F3FE" stopOpacity="0.98" />
                </linearGradient>
              </defs>
              {/* Layer 1: Soft back wave */}
              <path
                fill="url(#trackrWaveBack)"
                d="M0,48 C220,18 440,78 720,46 C1000,14 1240,68 1440,34 L1440,120 L0,120 Z"
              />
              {/* Layer 2: Mid flowing curve */}
              <path
                fill="url(#trackrWaveMid)"
                d="M0,64 C260,92 520,28 820,58 C1080,84 1280,42 1440,56 L1440,120 L0,120 Z"
              />
              {/* Layer 3: Smooth foreground pastel wave */}
              <path
                fill="url(#trackrWaveFront)"
                d="M0,84 C300,52 600,98 920,72 C1160,52 1320,82 1440,68 L1440,120 L0,120 Z"
              />
            </svg>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section id="features" className="scroll-mt-0 py-20 md:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-3">
                Engineered for Serious Coders
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2459] mb-4 tracking-tight">
                Everything You Need to Stay 100% Consistent
              </h2>
              <p className="text-gray-500 text-base sm:text-lg">
                Trackr is laser-focused on accountability, community, and real engineering growth without the social media noise.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Code2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Rich Code Snippets</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Share clean, syntax-highlighted code blocks with line numbering, language tags, and instant one-click copy.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center text-xs font-semibold text-violet-600">
                  <span>Supports C++, Java, Python, TS & more</span>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Flame className="w-6 h-6 fill-current text-orange-500" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Authentic Streak Engine</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Show up every day to build your streak score. Track consistency on your profile with Twitter-style streak badges.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center text-xs font-semibold text-orange-600">
                  <span>Never break the chain 🔥</span>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Campus & Global Ranks</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Filter leaderboards by your specific college or compete globally across engineering students nationwide.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center text-xs font-semibold text-amber-600">
                  <span>100+ colleges connected</span>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Curated Opportunities</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Stay ahead with real-time updates for SIH, nationwide hackathons, internships, placements, and coding contests.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center text-xs font-semibold text-blue-600">
                  <span>One-click bookmark & apply</span>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <AtSign className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Smart @Mentions & Tags</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Tag classmates using their exact @username, discuss problem approaches, quote posts, and receive instant alerts.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center text-xs font-semibold text-purple-600">
                  <span>Real-time notifications & messaging</span>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-50 transition-all group flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-2">Pure Focus, Zero Noise</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    No doomscrolling algorithms or vanity traps. Every feed item represents authentic student learning and progress.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200/60 flex items-center text-xs font-semibold text-emerald-600">
                  <span>100% Student-first environment</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= WHY TRACKR? SECTION ================= */}
        <section id="why-trackr" className="scroll-mt-0 py-20 md:py-28 bg-[#FBFBFE] border-y border-violet-100/50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-3">
                The Trackr Advantage
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2459] mb-4 tracking-tight">
                Why Trackr? Four Key Benefits
              </h2>
              <p className="text-gray-500 text-base sm:text-lg">
                Designed from the ground up to solve the consistency problem for student developers.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Benefit 1 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">🪴</div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-3">
                    Built for Serious Learners
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    No distractions, memes, or doomscrolling algorithms. A clean, purpose-built space focused 100% on skills, problem solving, and growth.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Zero algorithmic noise</span>
                </div>
              </div>
              
              {/* Benefit 2 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">🔥</div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-3">
                    Real Daily Accountability
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Streaks, flame milestone badges, and peer check-ins keep you disciplined when motivation fades. You show up because consistency compounds.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-orange-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Daily habit compounding</span>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📊</div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-3">
                    Visible Proof of Work
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Every daily log, solved LeetCode problem, and syntax-highlighted code block builds a living timeline of your real engineering journey.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-violet-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Show your actual journey</span>
                </div>
              </div>

              {/* Benefit 4 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 hover:border-violet-200 hover:shadow-md transition-all flex flex-col justify-between group">
                <div>
                  <div className="text-4xl mb-6 group-hover:scale-110 transition-transform text-pink-400">🤝</div>
                  <h3 className="font-semibold text-xl text-gray-900 mb-3">
                    Supportive Campus Community
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    Find teammates for hackathons like SIH, ask questions, learn from seniors, and connect with peers across 100+ colleges nationwide.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-1.5 text-xs font-semibold text-pink-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>100+ colleges connected</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= COMMUNITY SECTION ================= */}
        <section id="community" className="scroll-mt-0 py-20 md:py-28 bg-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-3">
                Thriving Student Network
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2459] mb-4 tracking-tight">
                Built by Students, Powered by Community
              </h2>
              <p className="text-gray-500 text-base sm:text-lg">
                Join a nationwide peer circle of passionate learners building consistency every single day.
              </p>
            </div>

            {/* Impact Metrics Banner */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16 text-center">
              <div className="bg-[#FAF9FF] p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-3xl sm:text-4xl font-bold text-violet-600">25K+</span>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Active Students</p>
              </div>
              <div className="bg-[#FAF9FF] p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-3xl sm:text-4xl font-bold text-emerald-600">150K+</span>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Daily Logs Shared</p>
              </div>
              <div className="bg-[#FAF9FF] p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-3xl sm:text-4xl font-bold text-blue-600">100+</span>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Colleges Connected</p>
              </div>
              <div className="bg-[#FAF9FF] p-6 rounded-2xl border border-gray-100 shadow-sm">
                <span className="text-3xl sm:text-4xl font-bold text-orange-500">98%</span>
                <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Consistency Rate</p>
              </div>
            </div>

            {/* Student Stories Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                    &ldquo;Trackr helped me maintain a 90-day DSA streak without missing a single day. Logging each question solved kept me accountable, and I recently cracked an SDE intern offer!&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img src="/student-1.png" alt="Aarav" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Aarav Sharma</h4>
                    <p className="text-xs text-gray-400">DTU · 92 Day Streak 🔥</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                    &ldquo;I used to start a web development project and abandon it after 3 days. Sharing daily milestone updates with my campus peers on Trackr completely changed my discipline.&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img src="/student-2.png" alt="Priya" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Priya Patel</h4>
                    <p className="text-xs text-gray-400">IIT Delhi · Full-Stack Dev</p>
                  </div>
                </div>
              </div>

              <div className="bg-[#FAF9FF] p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 mb-4">
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">
                    &ldquo;The hackathon opportunities tab and college leaderboards are pure gold. Found teammates for Smart India Hackathon directly from our university leaderboard!&rdquo;
                  </p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                  <img src="/student-3.png" alt="Rohan" className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Rohan Verma</h4>
                    <p className="text-xs text-gray-400">VIT · SIH 2026 Finalist</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= BOTTOM CTA ================= */}
        <section className="py-16 md:py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="bg-[#F4F1FE] rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden min-h-[350px] md:min-h-[420px] shadow-sm">
              
              {/* Background Bottom Waves (SVG) */}
              <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-0">
                <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-[60px] md:h-[120px]" style={{ transform: 'rotate(180deg)' }}>
                  <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" className="fill-[#EBE5FD]"></path>
                </svg>
              </div>

              {/* Left Image (Character) - Absolutely positioned */}
              <img 
                src="/cta-left.png" 
                alt="Trackr Character" 
                className="hidden md:block absolute bottom-6 lg:bottom-8 left-4 lg:left-12 w-[300px] lg:w-[420px] h-auto object-contain z-10"
              />

              {/* Center/Right Content */}
              <div className="relative z-20 w-full max-w-xl mx-auto md:ml-[40%] lg:ml-[45%] py-12 px-6 md:px-0 text-center md:text-left">
                <h2 className="text-3xl lg:text-4xl font-bold text-[#2D2459] mb-4 tracking-tight">
                  Ready to build your future?
                </h2>
                <p className="text-base text-[#615C75] mb-8 leading-relaxed">
                  Join thousands of students who are showing up every single day to master code and land great careers.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                  <Link href="/auth" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-[#6B46C1] hover:bg-[#553C9A] text-white rounded-xl px-8 py-6 text-base font-semibold shadow-md shadow-violet-200 transition-all hover:scale-105 active:scale-95">
                      Get Started for Free
                    </Button>
                  </Link>
                  <a href="#community" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8 py-6 text-base font-semibold border-gray-200 bg-transparent hover:bg-white shadow-sm transition-all hover:scale-105 active:scale-95 text-[#6B46C1]">
                      Explore Community
                    </Button>
                  </a>
                </div>
              </div>

              {/* Right Image (Plant) - Absolutely positioned */}
              <img 
                src="/cta-right.png" 
                alt="Trackr Growth" 
                className="hidden md:block absolute bottom-8 right-0 lg:right-8 w-40 lg:w-56 h-auto object-contain z-10"
              />
            </div>
          </div>
        </section>
      </main>

      {/* ================= MODERN FOOTER ================= */}
      <footer className="bg-white border-t border-gray-100 py-12 px-6 sm:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Trackr" className="w-8 h-8 object-contain" />
            <span className="font-bold text-gray-900 tracking-tight text-lg">Trackr</span>
            <span className="text-xs text-gray-400 ml-2">© 2026 Trackr. Built for ambitious students.</span>
          </div>

          <div className="flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-violet-600 transition-colors">How it Works</a>
            <a href="#why-trackr" className="hover:text-violet-600 transition-colors">Why Trackr?</a>
            <a href="#community" className="hover:text-violet-600 transition-colors">Community</a>
            <Link href="/auth" className="hover:text-violet-600 transition-colors">Log In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

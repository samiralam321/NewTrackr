import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InstallButton } from "@/components/pwa/InstallPWA"
import { Flame, Code2, Trophy, Briefcase, AtSign, ShieldCheck, Star, Users, BookOpen, Target, Award, Rocket, CheckCircle2 } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden selection:bg-violet-100 selection:text-violet-900">
      {/* Sticky Header with Backdrop Blur */}
      <header className="sticky top-0 z-50 flex h-20 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto w-full bg-white/90 backdrop-blur-md border-b border-gray-100/80 transition-all">
        <Link href="/" className="flex items-center gap-1 md:gap-2 group">
          <img 
            src="/logo.png" 
            alt="Trackr Logo" 
            className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm scale-[1.3] origin-center transition-transform group-hover:scale-[1.35]" 
          />
          <span className="text-xl font-bold text-gray-900 ml-1 tracking-tight">Trackr</span>
        </Link>
        
        {/* Navigation Links with Smooth Anchor Scrolling */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <a href="#features" className="hover:text-violet-600 transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-violet-600 transition-colors">How it Works</a>
          <a href="#why-trackr" className="hover:text-violet-600 transition-colors">Why Trackr?</a>
          <a href="#community" className="hover:text-violet-600 transition-colors">Community</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <InstallButton className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 hover:bg-violet-100 active:scale-95 text-violet-700 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer" />
          <Link href="/auth" className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900 px-2 py-1">
            Log in
          </Link>
          <Link href="/auth">
            <Button className="bg-[#6B46C1] hover:bg-[#553C9A] text-white rounded-full px-3.5 sm:px-6 h-9 sm:h-10 text-xs sm:text-sm font-semibold shadow-sm transition-all hover:shadow-md hover:scale-105 active:scale-95">
              Get Started
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* ================= HERO SECTION ================= */}
        <section className="relative pt-10 md:pt-16 pb-16 md:pb-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12 overflow-hidden px-6 sm:px-8">
          
          {/* Background Gradient Blob */}
          <div className="absolute right-0 top-0 bottom-0 -z-10 w-full lg:w-[55%] bg-gradient-to-bl from-[#F8F6FE] via-[#F4F1FE] to-[#EAE4FD] lg:rounded-l-[150px] opacity-100 overflow-hidden">
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/50 rounded-full blur-3xl"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#E4DCFC]/50 rounded-full blur-3xl"></div>
          </div>
          
          <div className="flex-1 text-left relative z-20">
            <div className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-violet-50 border border-violet-100 text-violet-700 text-xs font-semibold mb-6">
              <span>Track progress. Build daily discipline.</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#2D2459] leading-[1.1]">
              Share Progress.<br/>
              <span className="text-[#6B46C1]">Stay Accountable.</span><br/>
              <span className="text-[#48BB78]">Grow Together.</span>
            </h1>

            <p className="mt-6 text-base sm:text-lg text-[#615C75] max-w-lg leading-relaxed">
              Trackr is a focused space for students to share daily learning progress, build consistency, and become 1% better every day.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link href="/auth" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#6B46C1] hover:bg-[#553C9A] text-white rounded-xl px-8 py-6 text-base font-semibold shadow-md shadow-violet-200 transition-all hover:scale-105 active:scale-95">
                  Start Your Journey
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8 py-6 text-base font-semibold border-gray-200 bg-white/80 hover:bg-white text-[#6B46C1] shadow-sm transition-all hover:scale-105 active:scale-95">
                  See How It Works <span className="ml-2 text-xs">▶</span>
                </Button>
              </a>
            </div>
            
            {/* Social Proof */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover aspect-square shadow-sm" src="/student-1.png" alt="Student 1"/>
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover aspect-square shadow-sm" src="/student-2.png" alt="Student 2"/>
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover aspect-square shadow-sm" src="/student-3.png" alt="Student 3"/>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-[#2D2459]">Join 25,000+ students</p>
                <p className="text-[#615C75]">building their future together.</p>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="flex-1 relative z-10 flex justify-center items-center mt-4 lg:mt-0">
            <div className="absolute top-[10%] right-[20%] text-yellow-300 animate-pulse text-2xl z-0">✦</div>
            <div className="absolute bottom-[20%] left-[5%] text-[#6B46C1] animate-pulse text-xl z-0" style={{ animationDelay: '1s' }}>✨</div>
            <div className="absolute top-[30%] left-[10%] text-violet-300 animate-pulse text-3xl z-0" style={{ animationDelay: '0.5s' }}>✦</div>
            <div className="absolute bottom-[30%] right-[5%] text-yellow-200 animate-pulse text-2xl z-0" style={{ animationDelay: '1.5s' }}>✦</div>
            
            <div className="relative z-10 w-full lg:w-[120%] flex justify-center -my-16 lg:-my-32">
              <img 
                src="/hero-illustration.png" 
                alt="Trackr Hero" 
                className="w-full h-auto object-contain drop-shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 scale-[1.1] lg:scale-[1.2] origin-bottom lg:translate-x-8" 
              />
            </div>
          </div>
        </section>

        {/* ================= HOW IT WORKS SECTION ================= */}
        <section id="how-it-works" className="scroll-mt-6 md:scroll-mt-3 py-20 md:py-28 bg-[#F8F7FF] text-center relative border-y border-violet-100/50">
          <div className="max-w-7xl mx-auto px-6 sm:px-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/80 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-3">
              Simple Daily Rhythm
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2D2459] mb-3 tracking-tight">How Trackr Works</h2>
            <p className="text-gray-500 mb-16 max-w-xl mx-auto text-base sm:text-lg">
              A frictionless daily loop designed to turn small daily efforts into exponential career outcomes.
            </p>

            <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-12 md:gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center flex-1 z-10 group">
                <div className="h-16 w-16 bg-violet-100 text-violet-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <BookOpen className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">1. Learn</h3>
                <p className="text-sm text-gray-500 px-4 leading-relaxed">
                  Spend 30+ minutes daily learning DSA, Web Dev, AI, or Core CS concepts.
                </p>
              </div>
              
              <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-0.5 bg-dashed border-t-2 border-dashed border-gray-200 -z-0" />

              {/* Step 2 */}
              <div className="flex flex-col items-center flex-1 z-10 group">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Code2 className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">2. Log Progress</h3>
                <p className="text-sm text-gray-500 px-4 leading-relaxed">
                  Post what you built, problems solved, and paste syntax-highlighted code.
                </p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center flex-1 z-10 group">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Flame className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">3. Keep The Streak</h3>
                <p className="text-sm text-gray-500 px-4 leading-relaxed">
                  Earn streak flames, unlock milestone badges, and climb campus leaderboards.
                </p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center flex-1 z-10 group">
                <div className="h-16 w-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
                  <Trophy className="w-8 h-8 text-pink-600" />
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">4. Unlock Opportunities</h3>
                <p className="text-sm text-gray-500 px-4 leading-relaxed">
                  Discover curated hackathons, placement opportunities, and partner teams.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= FEATURES SECTION ================= */}
        <section id="features" className="scroll-mt-6 md:scroll-mt-3 py-20 md:py-28 bg-white">
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
        <section id="why-trackr" className="scroll-mt-6 md:scroll-mt-3 py-20 md:py-28 bg-[#FBFBFE] border-y border-violet-100/50">
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
        <section id="community" className="scroll-mt-6 md:scroll-mt-3 py-20 md:py-28 bg-white relative overflow-hidden">
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

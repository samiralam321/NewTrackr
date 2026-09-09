import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InstallButton } from "@/components/pwa/InstallPWA"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white overflow-x-hidden">
      {/* Navigation */}
      <header className="flex h-20 items-center justify-between px-4 sm:px-8 max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-1 md:gap-2">
          <img src="/logo.png" alt="Trackr Logo" className="w-10 h-10 sm:w-12 sm:h-12 object-contain drop-shadow-sm scale-[1.3] origin-center" />
          <span className="text-xl font-bold text-gray-900 ml-1">Trackr</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
          <Link href="#features" className="hover:text-gray-900">Features</Link>
          <Link href="#how-it-works" className="hover:text-gray-900">How it Works</Link>
          <Link href="#community" className="hover:text-gray-900">Community</Link>
          <Link href="#pricing" className="hover:text-gray-900">Pricing</Link>
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <InstallButton className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-200 bg-violet-50 hover:bg-violet-100 active:scale-95 text-violet-700 text-xs sm:text-sm font-bold transition-all shadow-sm cursor-pointer" />
          <Link href="/auth" className="text-xs sm:text-sm font-medium text-gray-600 hover:text-gray-900">Log in</Link>
          <Link href="/auth">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-3 sm:px-6 h-8 sm:h-10 text-xs sm:text-sm">Get Started</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-12 md:pt-20 pb-16 md:pb-24 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-8 lg:gap-12 overflow-hidden px-8">
          
          {/* Background Gradient Blob matching Target Design */}
          <div className="absolute right-0 top-0 bottom-0 -z-10 w-full lg:w-[55%] bg-gradient-to-bl from-[#F8F6FE] via-[#F4F1FE] to-[#EAE4FD] lg:rounded-l-[150px] opacity-100 overflow-hidden">
            {/* Soft internal waves */}
            <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-white/50 rounded-full blur-3xl"></div>
            <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-[#E4DCFC]/50 rounded-full blur-3xl"></div>
          </div>
          
          <div className="flex-1 text-left relative z-20">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-[#2D2459] leading-[1.1]">
              Share Progress.<br/>
              <span className="text-[#6B46C1]">Stay Accountable.</span><br/>
              <span className="text-[#48BB78]">Grow Together.</span>
            </h1>
            <p className="mt-6 text-lg text-[#615C75] max-w-lg leading-relaxed">
              Trackr is a focused space for students to share daily learning progress, build consistency, and become 1% better every day.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Link href="/auth" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-[#6B46C1] hover:bg-[#553C9A] text-white rounded-xl px-8 py-6 text-base font-semibold shadow-sm transition-transform hover:scale-105">Start Your Journey</Button>
              </Link>
              <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8 py-6 text-base font-semibold border-gray-200 bg-transparent hover:bg-white text-[#6B46C1] shadow-sm transition-transform hover:scale-105">
                See How It Works <span className="ml-2">▶</span>
              </Button>
            </div>
            
            {/* Social Proof */}
            <div className="mt-12 flex items-center gap-4">
              <div className="flex -space-x-3">
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover aspect-square" src="/student-1.png" alt="Student 1"/>
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover aspect-square" src="/student-2.png" alt="Student 2"/>
                <img className="inline-block h-10 w-10 rounded-full ring-2 ring-white object-cover aspect-square" src="/student-3.png" alt="Student 3"/>
              </div>
              <div className="text-sm">
                <p className="font-semibold text-[#2D2459]">Join 25,000+ students</p>
                <p className="text-[#615C75]">building their future together.</p>
              </div>
            </div>
          </div>

          {/* Hero Illustration */}
          <div className="flex-1 relative z-10 flex justify-center items-center mt-4 lg:mt-0">
            {/* Floating Stars */}
            <div className="absolute top-[10%] right-[20%] text-yellow-300 animate-pulse text-2xl z-0">✦</div>
            <div className="absolute bottom-[20%] left-[5%] text-[#6B46C1] animate-pulse text-xl z-0" style={{ animationDelay: '1s' }}>✨</div>
            <div className="absolute top-[30%] left-[10%] text-violet-300 animate-pulse text-3xl z-0" style={{ animationDelay: '0.5s' }}>✦</div>
            <div className="absolute bottom-[30%] right-[5%] text-yellow-200 animate-pulse text-2xl z-0" style={{ animationDelay: '1.5s' }}>✦</div>
            
            {/* Image container with negative margins to chop off whitespace and scale up */}
            <div className="relative z-10 w-full lg:w-[120%] flex justify-center -my-16 lg:-my-32">
              <img 
                src="/hero-illustration.png" 
                alt="Trackr Hero" 
                className="w-full h-auto object-contain drop-shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-1000 scale-[1.1] lg:scale-[1.2] origin-bottom lg:translate-x-8" 
              />
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-16 md:py-20 bg-[#F8F7FF] text-center">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">How Trackr Works</h2>
            <p className="text-gray-500 mb-16">A simple daily loop to help you stay consistent and grow.</p>

            <div className="flex flex-col md:flex-row justify-center items-center md:items-start gap-12 md:gap-8 relative">
              {/* Step 1 */}
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="h-16 w-16 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Learn</h3>
                <p className="text-sm text-gray-500 px-4">Learn something new and valuable</p>
              </div>
              
              <div className="hidden md:block absolute top-8 left-[15%] right-[15%] h-px bg-gray-200 -z-0" />

              {/* Step 2 */}
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="h-16 w-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Log Progress</h3>
                <p className="text-sm text-gray-500 px-4">Share what you learned, time spent, and output</p>
              </div>

              {/* Step 3 */}
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Accountability</h3>
                <p className="text-sm text-gray-500 px-4">Stay consistent with streaks, peers & challenges</p>
              </div>

              {/* Step 4 */}
              <div className="flex flex-col items-center flex-1 z-10">
                <div className="h-16 w-16 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">Grow Together</h3>
                <p className="text-sm text-gray-500 px-4">See others' progress, get inspired, improve daily</p>
              </div>
            </div>
          </div>
        </section>

        {/* Why Students Love Trackr */}
        <section className="py-16 md:py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-12 text-center">Why Students Love Trackr</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Card 1 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Built for<br/>Serious Learners</h3>
                  <p className="text-sm text-gray-500">No distractions. Just focus, progress, and growth.</p>
                </div>
                <div className="text-4xl mt-8">🪴</div>
              </div>
              
              {/* Card 2 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Real Accountability</h3>
                  <p className="text-sm text-gray-500">Streaks, leaderboards, and peer check-ins keep you consistent.</p>
                </div>
                <div className="text-4xl mt-8">🔥</div>
              </div>

              {/* Card 3 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Visible Progress</h3>
                  <p className="text-sm text-gray-500">Track your journey and see how far you've come.</p>
                </div>
                <div className="text-4xl mt-8">📊</div>
              </div>

              {/* Card 4 */}
              <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Positive Community</h3>
                  <p className="text-sm text-gray-500">Supportive, focused community of learners like you.</p>
                </div>
                <div className="text-4xl mt-8 text-pink-400">💖</div>
              </div>
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-16 md:py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-8">
            <div className="bg-[#F4F1FE] rounded-[2.5rem] flex flex-col justify-center relative overflow-hidden min-h-[350px] md:min-h-[420px]">
              
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
                <h2 className="text-3xl lg:text-4xl font-bold text-[#2D2459] mb-4">Ready to build your future?</h2>
                <p className="text-base text-[#615C75] mb-8">Join thousands of students who are showing up every day.</p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4">
                  <Link href="/auth" className="w-full sm:w-auto">
                    <Button className="w-full sm:w-auto bg-violet-500 hover:bg-violet-600 text-white rounded-xl px-8 py-6 text-base font-semibold shadow-sm transition-transform hover:scale-105">Get Started for Free</Button>
                  </Link>
                  <Button variant="outline" className="w-full sm:w-auto rounded-xl px-8 py-6 text-base font-semibold border-gray-200 bg-transparent hover:bg-white shadow-sm transition-transform hover:scale-105 text-[#6B46C1]">
                    Explore Community
                  </Button>
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
    </div>
  )
}

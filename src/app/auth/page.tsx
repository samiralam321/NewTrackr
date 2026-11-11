import { AuthForm } from "@/components/auth/auth-form"
import Link from "next/link"

export default function AuthPage() {
  return (
    <div className="flex min-h-screen bg-gray-50/50 p-4 sm:p-6 lg:p-8 items-center justify-center">
      <div className="mx-auto flex w-full max-w-6xl overflow-hidden rounded-[2.5rem] bg-white shadow-xl ring-1 ring-gray-100">
        
        {/* Left Side - Brand & Features Overview */}
        <div className="relative hidden w-[45%] flex-col bg-[#FCFBFF] p-12 pb-0 lg:flex overflow-hidden">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-1 mb-10 relative z-20 group w-fit">
            <img 
              src="/logo.png" 
              alt="Trackr Logo" 
              className="w-12 h-12 object-contain drop-shadow-sm scale-[1.3] origin-center transition-transform group-hover:scale-[1.35]" 
            />
            <span className="text-xl font-bold text-[#2D2459] ml-1">Trackr</span>
          </Link>

          {/* Feature List */}
          <div className="flex flex-col gap-7 relative z-20">
            {/* Feature 1 */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#EEECFF] text-[22px]">
                <span className="translate-y-[1px]">🪴</span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#2D2459] mb-1">Track Progress</h3>
                <p className="text-[14px] leading-relaxed text-[#615C75]">Monitor your daily learning and<br/>achieve your engineering goals.</p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#E6F8F1] text-[22px]">
                <span className="translate-y-[1px]">📊</span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#2D2459] mb-1">Stay Consistent</h3>
                <p className="text-[14px] leading-relaxed text-[#615C75]">Build streak flames and make<br/>consistency your superpower.</p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFEAF0] text-[22px]">
                <span className="translate-y-[1px]">💖</span>
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-[#2D2459] mb-1">Grow Together</h3>
                <p className="text-[14px] leading-relaxed text-[#615C75]">Share code, find SIH teammates,<br/>and learn with campus peers.</p>
              </div>
            </div>
          </div>

          {/* Decorative Stars */}
          <div className="absolute top-24 right-16 text-[#D6BCFA] opacity-50 z-0">✦</div>
          <div className="absolute top-[40%] right-10 text-[#F6E05E] opacity-70 z-0 text-sm">✦</div>
          <div className="absolute top-1/2 left-8 text-[#D6BCFA] opacity-50 z-0 text-sm">✦</div>

          {/* Bottom Illustration Container */}
          <div className="mt-auto -mx-12 flex justify-center relative items-end min-h-[220px]">
             {/* Background Smooth Mound */}
             <div className="absolute bottom-[-150px] left-[-20%] right-[-20%] h-[400px] bg-[#F2F0FF] rounded-[100%] z-0"></div>
             
             {/* Character Image */}
             <div className="relative z-10 w-[92%] max-w-[340px] flex justify-center pb-2">
               <img 
                 src="/auth-character.png" 
                 alt="Trackr Mascot" 
                 className="w-full h-auto object-contain drop-shadow-sm"
               />
             </div>
          </div>
        </div>

        {/* Right Side - Interactive Authentication Center */}
        <div className="flex w-full flex-col items-center justify-center p-6 sm:p-12 lg:w-[55%]">
          <div className="w-full max-w-[420px] text-center">
            
            {/* Logo Icon inside circle */}
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-50 relative">
               <div className="absolute -top-2 -left-4 text-yellow-300"><svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5L12 0z"/></svg></div>
               <div className="absolute -top-6 right-0 text-violet-200"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5L12 0z"/></svg></div>
               <div className="absolute top-10 -right-6 text-yellow-300"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0l2.5 9.5L24 12l-9.5 2.5L12 24l-2.5-9.5L0 12l9.5-2.5L12 0z"/></svg></div>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-100/50">
                <img src="/logo.png" alt="Trackr Logo" className="w-10 h-10 object-contain drop-shadow-sm scale-[1.3]" />
              </div>
            </div>

            {/* Welcome Text */}
            <h1 className="mb-2 text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Welcome to <span className="text-violet-600">Trackr</span>
            </h1>
            <p className="mb-7 text-sm text-gray-500 max-w-[320px] mx-auto leading-relaxed">
              Track daily learning progress, build streaks, and grow with 25,000+ student developers.
            </p>

            {/* Auth Form Component */}
            <AuthForm />

          </div>
        </div>
        
      </div>
    </div>
  )
}

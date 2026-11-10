'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, useRef } from "react"
import { Loader2, Mail, Lock, Check } from "lucide-react"
import { cleanUsername, validateUsernameFormat } from "@/lib/utils/user"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [username, setUsername] = useState("")
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available: boolean | null; error?: string }>({
    checking: false,
    available: null
  })
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null)
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const supabase = createClient()

  // Client-Side Session Auto-Restore & Redirect
  useEffect(() => {
    const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '').split('.')[0] || 'bsqqdfkdycziocmgiani'
    
    // Proactively clean up any legacy corrupted URL-encoded JSON cookie
    if (typeof document !== 'undefined') {
      const corruptCookieName = `sb-${projectRef}-auth-token`
      if (document.cookie.includes(`${corruptCookieName}=%7B`) || document.cookie.includes(`${corruptCookieName}={`)) {
        document.cookie = `${corruptCookieName}=; max-age=0; path=/; SameSite=Lax`
      }
    }

    const checkActiveSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          window.location.href = '/dashboard'
        }
      } catch (err) {
        console.warn("Client session restore skipped:", err)
      }
    }

    checkActiveSession()

    // 2. Set up listener to capture OAuth (Google) or Email auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event as string) === 'PASSWORD_RECOVERY' || window.location.pathname.includes('/auth/reset-password')) {
        return
      }

      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        window.location.href = '/dashboard'
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setErrorMsg(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
    
    if (error) {
      console.error('Error logging in:', error.message)
      setErrorMsg(error.message)
      setIsLoading(false)
    }
  }

  const handleUsernameChange = (val: string) => {
    const clean = cleanUsername(val).replace(/\s+/g, '')
    setUsername(clean)

    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current)

    if (!clean) {
      setUsernameStatus({ checking: false, available: null })
      return
    }

    const formatCheck = validateUsernameFormat(clean)
    if (!formatCheck.valid) {
      setUsernameStatus({ checking: false, available: false, error: formatCheck.error })
      return
    }

    setUsernameStatus({ checking: true, available: null })
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', clean)
          .maybeSingle()
        
        if (error) {
          setUsernameStatus({ checking: false, available: true })
        } else if (data) {
          setUsernameStatus({ checking: false, available: false, error: `@${clean} is already taken.` })
        } else {
          setUsernameStatus({ checking: false, available: true })
        }
      } catch {
        setUsernameStatus({ checking: false, available: true })
      }
    }, 350)
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!resetEmail.trim()) {
      setErrorMsg("Please enter your email address.")
      setIsLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
      })
      
      if (error) throw error
      
      setSuccessMsg("Password reset link sent! Please check your email inbox to proceed.")
    } catch (err: any) {
      console.error("Reset password error:", err)
      setErrorMsg(err.message || "An error occurred while sending reset link.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    if (!email || !password) {
      setErrorMsg("Please fill in all fields.")
      setIsLoading(false)
      return
    }

    try {
      if (isSignUp) {
        // Sign Up Flow
        const finalUsername = cleanUsername(username || email.split('@')[0])
        const formatCheck = validateUsernameFormat(finalUsername)
        if (!formatCheck.valid) {
          setErrorMsg(formatCheck.error || "Please enter a valid username (3-20 characters, alphanumeric & _)")
          setIsLoading(false)
          return
        }

        // Live check uniqueness before signing up
        try {
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', finalUsername)
            .maybeSingle()
          
          if (existingUser) {
            setErrorMsg(`Username @${finalUsername} is already taken. Please choose another.`)
            setIsLoading(false)
            return
          }
        } catch {}

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              username: finalUsername,
              avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(finalUsername)}`
            }
          }
        })
        
        if (error) throw error
        
        if (data?.session) {
          setSuccessMsg("Account created! Logging you in...")
          window.location.href = '/dashboard'
        } else {
          setSuccessMsg("Account created! Please check your inbox for a verification email to activate your account.")
          setIsLoading(false)
        }
      } else {
        // Sign In Flow
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        
        if (error) throw error
        window.location.href = '/dashboard'
      }
    } catch (err: any) {
      console.error("Auth error:", err)
      setErrorMsg(err.message || "An authentication error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  // Forgot Password Slate
  if (isForgotPassword) {
    return (
      <div className="space-y-6 text-left animate-in fade-in duration-200">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1.5">Reset Password 🔒</h3>
          <p className="text-sm text-gray-500 leading-relaxed">
            Enter your email address below, and we'll send you a password recovery link.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
              {successMsg}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reset-email">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <Input 
                id="reset-email" 
                type="email" 
                placeholder="name@university.edu"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                disabled={isLoading}
                className="pl-10 h-11 rounded-xl border-gray-200 focus-visible:ring-violet-500" 
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm text-base font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>

        <div className="text-center">
          <button 
            type="button"
            onClick={() => {
              setIsForgotPassword(false)
              setErrorMsg(null)
              setSuccessMsg(null)
            }} 
            className="text-violet-600 hover:text-violet-700 font-bold underline text-sm cursor-pointer"
          >
            Back to Sign In
          </button>
        </div>
      </div>
    )
  }

  // Standard Login/Signup Slate
  return (
    <div className="space-y-6 text-left">
      {/* Google Login Button */}
      <Button 
        type="button"
        variant="outline" 
        className="w-full h-12 rounded-xl text-base font-medium shadow-sm border-gray-200 bg-white hover:bg-gray-50 text-gray-900 hover:text-gray-900 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-gray-500" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
        )}
        Continue with Google
      </Button>

      {/* Separator */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-150"></div>
        </div>
        <span className="relative px-3 bg-white text-xs font-semibold uppercase tracking-wider text-gray-400">
          or use email
        </span>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {errorMsg && (
          <div className="p-3 text-sm font-semibold text-red-600 bg-red-50 rounded-xl border border-red-100">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
            {successMsg}
          </div>
        )}

        {isSignUp && (
          <div className="space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between">
              <Label htmlFor="username">Username (Unique Handle)</Label>
              <span className="text-[11px] text-gray-400 font-normal">{username.length}/20</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-sm font-bold text-gray-400 select-none">@</span>
              <Input 
                id="username" 
                type="text" 
                placeholder="your_handle"
                value={username}
                onChange={(e) => handleUsernameChange(e.target.value)}
                maxLength={20}
                disabled={isLoading}
                className={`pl-9 h-11 rounded-xl border-gray-200 focus-visible:ring-violet-500 ${
                  usernameStatus.available === false ? 'border-rose-400 focus-visible:ring-rose-400' : 
                  usernameStatus.available === true ? 'border-emerald-400 focus-visible:ring-emerald-400' : ''
                }`} 
              />
              {usernameStatus.checking && (
                <Loader2 className="absolute right-3.5 top-3.5 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            {usernameStatus.available === false && (
              <p className="text-[11px] font-medium text-rose-500 animate-in fade-in">
                {usernameStatus.error || "Username is already taken"}
              </p>
            )}
            {usernameStatus.available === true && username.length >= 3 && (
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>@{username} is available!</span>
              </p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <Input 
              id="email" 
              type="email" 
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-11 rounded-xl border-gray-200 focus-visible:ring-violet-500" 
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {!isSignUp && (
              <button 
                type="button" 
                onClick={() => {
                  setIsForgotPassword(true)
                  setErrorMsg(null)
                  setSuccessMsg(null)
                }}
                className="text-xs font-bold text-violet-600 hover:text-violet-700 hover:underline cursor-pointer focus:outline-none"
              >
                Forgot password?
              </button>
            )}
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              className="pl-10 h-11 rounded-xl border-gray-200 focus-visible:ring-violet-500" 
            />
          </div>
        </div>

        <Button 
          type="submit" 
          className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm text-base font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            isSignUp ? "Create Account" : "Sign In"
          )}
        </Button>
      </form>

      {/* Switch Mode Toggle */}
      <div className="text-center text-sm font-semibold text-gray-500">
        {isSignUp ? "Already have an account? " : "Don't have an account? "}
        <button 
          type="button"
          onClick={() => {
            setIsSignUp(!isSignUp)
            setErrorMsg(null)
            setSuccessMsg(null)
          }} 
          className="text-violet-600 hover:text-violet-700 font-bold underline cursor-pointer"
        >
          {isSignUp ? "Sign In" : "Sign Up"}
        </button>
      </div>
    </div>
  )
}

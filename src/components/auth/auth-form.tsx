'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"
import { Loader2, Mail, Lock } from "lucide-react"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const supabase = createClient()

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
        redirectTo: `${location.origin}/auth/callback?type=recovery`,
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
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: email.split('@')[0],
              avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`
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

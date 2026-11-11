'use client'

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { Loader2, Mail, Lock, Check, Eye, EyeOff, User, AlertCircle, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react"
import { 
  normalizeEmail, 
  validateEmail, 
  validateFullName, 
  validateUsername, 
  validatePassword,
  cleanUsername 
} from "@/lib/auth/validation"
import { formatAuthError } from "@/lib/auth/auth-errors"

export function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [isSignUp, setIsSignUp] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [emailConfirmationSent, setEmailConfirmationSent] = useState(false)
  
  // Form fields
  const [fullName, setFullName] = useState("")
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [resetEmail, setResetEmail] = useState("")
  const [rememberMe, setRememberMe] = useState(true)

  // Visibility toggles
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Username live check state
  const [usernameStatus, setUsernameStatus] = useState<{
    checking: boolean
    available: boolean | null
    error?: string
  }>({
    checking: false,
    available: null
  })
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null)

  // Alert and feedback messages
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [redirectTo, setRedirectTo] = useState<string>('/dashboard')

  const supabase = createClient()
  const isSubmitting = useRef(false)

  // Extract redirectTo param safely and monitor active sessions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const target = params.get('redirectTo') || params.get('next')
      if (target && target.startsWith('/') && !target.startsWith('//')) {
        setRedirectTo(target)
      }

      // Check URL error params
      const urlError = params.get('error_description') || params.get('error')
      if (urlError) {
        setErrorMsg(formatAuthError(urlError))
      }
    }

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
          window.location.href = redirectTo || '/dashboard'
        }
      } catch (err) {
        console.warn("Client session restore skipped:", err)
      }
    }

    checkActiveSession()

    // Listen to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event as string) === 'PASSWORD_RECOVERY' || window.location.pathname.includes('/auth/reset-password')) {
        return
      }

      if (session && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        window.location.href = redirectTo || '/dashboard'
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, redirectTo])

  // Google OAuth Authentication
  const handleGoogleLogin = async () => {
    if (isLoading || isSubmitting.current) return
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      if (redirectTo && redirectTo !== '/dashboard') {
        callbackUrl.searchParams.set('next', redirectTo)
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      })
      
      if (error) {
        throw error
      }
    } catch (err: any) {
      console.error('Google OAuth error:', err)
      setErrorMsg(formatAuthError(err))
      setIsLoading(false)
    }
  }

  // Live username uniqueness and format validator
  const handleUsernameChange = (val: string) => {
    const clean = cleanUsername(val).replace(/\s+/g, '')
    setUsername(clean)

    if (usernameCheckTimeout.current) clearTimeout(usernameCheckTimeout.current)

    if (!clean) {
      setUsernameStatus({ checking: false, available: null })
      return
    }

    const formatCheck = validateUsername(clean)
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
    }, 300)
  }

  // Password Recovery Request
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || isSubmitting.current) return
    isSubmitting.current = true
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const normalizedResetEmail = normalizeEmail(resetEmail)
    const emailCheck = validateEmail(normalizedResetEmail)
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error || "Please enter a valid email address.")
      setIsLoading(false)
      isSubmitting.current = false
      return
    }

    try {
      const callbackUrl = new URL('/auth/callback', window.location.origin)
      callbackUrl.searchParams.set('next', '/auth/reset-password')

      const { error } = await supabase.auth.resetPasswordForEmail(normalizedResetEmail, {
        redirectTo: callbackUrl.toString(),
      })
      
      if (error) throw error
      
      // Generic success message to prevent user enumeration
      setSuccessMsg("If an account exists with this email, you will receive password reset instructions shortly.")
    } catch (err: any) {
      console.error("Reset password error:", err)
      setErrorMsg(formatAuthError(err))
    } finally {
      setIsLoading(false)
      isSubmitting.current = false
    }
  }

  // Email/Password Authentication (Sign In & Sign Up)
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading || isSubmitting.current) return
    isSubmitting.current = true
    setIsLoading(true)
    setErrorMsg(null)
    setSuccessMsg(null)

    const normalizedEmail = normalizeEmail(email)

    // Check if user accidentally entered a username into the email box
    if (!normalizedEmail.includes('@')) {
      setErrorMsg("Please enter your email address to continue.")
      setIsLoading(false)
      isSubmitting.current = false
      return
    }

    const emailCheck = validateEmail(normalizedEmail)
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.error || "Please enter a valid email address.")
      setIsLoading(false)
      isSubmitting.current = false
      return
    }

    if (!password) {
      setErrorMsg("Please enter your password.")
      setIsLoading(false)
      isSubmitting.current = false
      return
    }

    try {
      if (isSignUp) {
        // --- SIGN UP VALIDATIONS ---
        const nameCheck = validateFullName(fullName)
        if (!nameCheck.valid) {
          setErrorMsg(nameCheck.error || "Please enter your full name.")
          setIsLoading(false)
          isSubmitting.current = false
          return
        }

        const chosenUsername = cleanUsername(username || normalizedEmail.split('@')[0])
        const usernameCheck = validateUsername(chosenUsername)
        if (!usernameCheck.valid) {
          setErrorMsg(usernameCheck.error || "Please enter a valid username (3-20 characters).")
          setIsLoading(false)
          isSubmitting.current = false
          return
        }

        const passwordCheck = validatePassword(password)
        if (!passwordCheck.valid) {
          setErrorMsg(passwordCheck.error || "Password must be at least 8 characters long.")
          setIsLoading(false)
          isSubmitting.current = false
          return
        }

        if (password !== confirmPassword) {
          setErrorMsg("Passwords do not match. Please verify your confirm password.")
          setIsLoading(false)
          isSubmitting.current = false
          return
        }

        // Live check uniqueness before creating
        try {
          const { data: existingUser } = await supabase
            .from('profiles')
            .select('id')
            .ilike('username', chosenUsername)
            .maybeSingle()
          
          if (existingUser) {
            setErrorMsg(`Username @${chosenUsername} is already taken. Please choose another.`)
            setIsLoading(false)
            isSubmitting.current = false
            return
          }
        } catch {}

        const callbackUrl = new URL('/auth/callback', window.location.origin)
        if (redirectTo && redirectTo !== '/dashboard') {
          callbackUrl.searchParams.set('next', redirectTo)
        }

        const { data, error } = await supabase.auth.signUp({
          email: normalizedEmail,
          password: password,
          options: {
            emailRedirectTo: callbackUrl.toString(),
            data: {
              full_name: fullName.trim(),
              username: chosenUsername,
              avatar_url: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(chosenUsername)}`
            }
          }
        })
        
        if (error) throw error
        
        if (data?.session) {
          setSuccessMsg("Account created! Redirecting to dashboard...")
          window.location.href = redirectTo || '/dashboard'
        } else {
          // Email confirmation is required by Supabase project settings
          setEmailConfirmationSent(true)
          setIsLoading(false)
          isSubmitting.current = false
        }
      } else {
        // --- SIGN IN FLOW ---
        const { data, error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password: password,
        })
        
        if (error) throw error

        if (data?.session) {
          window.location.href = redirectTo || '/dashboard'
        }
      }
    } catch (err: any) {
      console.error("Auth submit error:", err)
      setErrorMsg(formatAuthError(err))
      setIsLoading(false)
      isSubmitting.current = false
    }
  }

  // Screen: Email Confirmation Instructions
  if (emailConfirmationSent) {
    return (
      <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 text-violet-600 flex items-center justify-center mx-auto shadow-sm">
          <Mail className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
          <p className="text-sm text-gray-500 leading-relaxed max-w-sm mx-auto">
            We sent an activation link to <span className="font-semibold text-gray-900">{email}</span>. Please click the link inside to verify your account.
          </p>
        </div>
        <div className="pt-2">
          <Button
            type="button"
            onClick={() => {
              setEmailConfirmationSent(false)
              setIsSignUp(false)
            }}
            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-sm text-sm cursor-pointer"
          >
            Back to Sign In
          </Button>
        </div>
      </div>
    )
  }

  // Screen: Forgot Password Slate
  if (isForgotPassword) {
    return (
      <div className="space-y-6 text-left animate-in fade-in duration-200">
        <div>
          <button
            type="button"
            onClick={() => {
              setIsForgotPassword(false)
              setErrorMsg(null)
              setSuccessMsg(null)
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 mb-4 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Sign In</span>
          </button>
          <h2 className="text-2xl font-bold text-gray-900 mb-1.5">Reset Password 🔒</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Enter your registered email below, and we'll send you a password recovery link.
          </p>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          {errorMsg && (
            <div className="p-3.5 text-xs font-medium text-red-700 bg-red-50 rounded-xl border border-red-200 animate-in fade-in flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 animate-in fade-in flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="reset-email" className="text-xs font-semibold text-gray-700">Email address</Label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
              <Input 
                id="reset-email" 
                type="email" 
                placeholder="name@university.edu"
                value={resetEmail}
                onChange={(e) => {
                  setResetEmail(e.target.value)
                  if (errorMsg) setErrorMsg(null)
                }}
                disabled={isLoading}
                autoComplete="email"
                className="pl-10 h-11 rounded-xl border-gray-200 focus-visible:ring-violet-500 text-sm" 
                required
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm text-sm font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer"
            disabled={isLoading || !resetEmail.trim()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-white" />
            ) : (
              "Send Reset Link"
            )}
          </Button>
        </form>
      </div>
    )
  }

  // Standard Login / Sign Up Slate
  return (
    <div className="space-y-5 text-left">
      {/* Mode Switch Tabs (Sign In vs Create Account) with Sliding Pill Animation */}
      <div className="relative flex rounded-xl bg-gray-100/90 p-1 border border-gray-200/60">
        <button
          type="button"
          onClick={() => {
            setIsSignUp(false)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
          className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-200 cursor-pointer select-none text-center ${
            !isSignUp 
              ? 'text-gray-900' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {!isSignUp && (
            <motion.div
              layoutId="auth-sliding-pill"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Sign In</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setIsSignUp(true)
            setErrorMsg(null)
            setSuccessMsg(null)
          }}
          className={`relative z-10 flex-1 py-2 text-xs font-bold rounded-lg transition-colors duration-200 cursor-pointer select-none text-center ${
            isSignUp 
              ? 'text-gray-900' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          {isSignUp && (
            <motion.div
              layoutId="auth-sliding-pill"
              className="absolute inset-0 bg-white rounded-lg shadow-sm"
              transition={{ type: "spring", stiffness: 500, damping: 35 }}
            />
          )}
          <span className="relative z-10">Create Account</span>
        </button>
      </div>

      {/* Google OAuth Login Button */}
      <Button 
        type="button"
        variant="outline" 
        className="w-full h-11 rounded-xl text-sm font-semibold shadow-xs border-gray-200 bg-white hover:bg-gray-50 text-gray-800 active:scale-95 transition-all duration-200 flex items-center justify-center gap-3 cursor-pointer"
        onClick={handleGoogleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
        ) : (
          <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
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
        <span>{isSignUp ? "Sign up with Google" : "Continue with Google"}</span>
      </Button>

      {/* Modern Separator */}
      <div className="relative flex items-center justify-center py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <span className="relative px-3 bg-white text-[11px] font-semibold uppercase tracking-wider text-gray-400">
          or continue with email
        </span>
      </div>

      {/* Main Form */}
      <form onSubmit={handleEmailAuth} className="space-y-3">
        {errorMsg && (
          <div className="p-2.5 text-xs font-medium text-red-700 bg-red-50 rounded-xl border border-red-200 animate-in fade-in flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <span className="text-left">{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="p-2.5 text-xs font-medium text-emerald-800 bg-emerald-50 rounded-xl border border-emerald-200 animate-in fade-in flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <span className="text-left">{successMsg}</span>
          </div>
        )}

        {/* Sign Up: Row 1 - Full Name & Username side-by-side */}
        {isSignUp && (
          <div className="grid grid-cols-2 gap-2.5 animate-in fade-in">
            <div className="space-y-1">
              <Label htmlFor="fullname" className="text-xs font-semibold text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input 
                  id="fullname" 
                  type="text" 
                  placeholder="Samir Alam"
                  value={fullName}
                  onChange={(e) => {
                    setFullName(e.target.value)
                    if (errorMsg) setErrorMsg(null)
                  }}
                  maxLength={50}
                  disabled={isLoading}
                  autoComplete="name"
                  className="pl-8 h-9 rounded-xl border-gray-200 focus-visible:ring-violet-500 text-xs" 
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label htmlFor="username" className="text-xs font-semibold text-gray-700">Handle</Label>
                {usernameStatus.checking ? (
                  <Loader2 className="w-3 h-3 animate-spin text-gray-400" />
                ) : usernameStatus.available === true ? (
                  <span className="text-[10px] text-emerald-600 font-semibold">Available</span>
                ) : usernameStatus.available === false ? (
                  <span className="text-[10px] text-rose-500 font-semibold">Taken</span>
                ) : null}
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs font-bold text-gray-400 select-none">@</span>
                <Input 
                  id="username" 
                  type="text" 
                  placeholder="username"
                  value={username}
                  onChange={(e) => {
                    handleUsernameChange(e.target.value)
                    if (errorMsg) setErrorMsg(null)
                  }}
                  maxLength={20}
                  disabled={isLoading}
                  autoComplete="username"
                  className={`pl-7 pr-3 h-9 rounded-xl border-gray-200 focus-visible:ring-violet-500 text-xs ${
                    usernameStatus.available === false ? 'border-rose-400 focus-visible:ring-rose-400' : 
                    usernameStatus.available === true ? 'border-emerald-400 focus-visible:ring-emerald-400' : ''
                  }`} 
                  required
                />
              </div>
            </div>
          </div>
        )}

        {/* Email Address - Row 2 */}
        <div className="space-y-1">
          <Label htmlFor="email" className="text-xs font-semibold text-gray-700">Email address</Label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3 h-3.5 w-3.5 text-gray-400" />
            <Input 
              id="email" 
              type="email" 
              placeholder="name@university.edu"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (errorMsg) setErrorMsg(null)
              }}
              disabled={isLoading}
              autoComplete="email"
              className="pl-9 h-9.5 rounded-xl border-gray-200 focus-visible:ring-violet-500 text-xs" 
              required
            />
          </div>
        </div>

        {/* Row 3: Passwords */}
        {isSignUp ? (
          /* Sign Up: Password & Confirm Password side-by-side */
          <div className="grid grid-cols-2 gap-2.5 animate-in fade-in">
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  placeholder="8+ chars"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (errorMsg) setErrorMsg(null)
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pl-8 pr-7 h-9 rounded-xl border-gray-200 focus-visible:ring-violet-500 text-xs" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="confirm-password" className="text-xs font-semibold text-gray-700">Confirm</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-gray-400" />
                <Input 
                  id="confirm-password" 
                  type={showConfirmPassword ? "text" : "password"} 
                  placeholder="Repeat"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value)
                    if (errorMsg) setErrorMsg(null)
                  }}
                  disabled={isLoading}
                  autoComplete="new-password"
                  className="pl-8 pr-7 h-9 rounded-xl border-gray-200 focus-visible:ring-violet-500 text-xs" 
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Sign In: Single Password field */
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-xs font-semibold text-gray-700">Password</Label>
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
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3 h-3.5 w-3.5 text-gray-400" />
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (errorMsg) setErrorMsg(null)
                }}
                disabled={isLoading}
                autoComplete="current-password"
                className="pl-9 pr-9 h-9.5 rounded-xl border-gray-200 focus-visible:ring-violet-500 text-xs" 
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Remember Me Option (Sign In only) */}
        {!isSignUp && (
          <div className="flex items-center gap-2 pt-0.5">
            <input 
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-gray-300 text-violet-600 focus:ring-violet-500 cursor-pointer"
            />
            <label htmlFor="remember-me" className="text-xs font-medium text-gray-600 cursor-pointer select-none">
              Remember me on this device
            </label>
          </div>
        )}

        {/* Submit Button */}
        <Button 
          type="submit" 
          className="w-full h-10 bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-xs text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center justify-center cursor-pointer mt-1"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-white" />
          ) : (
            isSignUp ? "Create Account" : "Sign In"
          )}
        </Button>
      </form>
    </div>
  )
}

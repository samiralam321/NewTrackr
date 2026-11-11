'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Lock, CheckCircle2, Eye, EyeOff, AlertCircle, ShieldCheck } from "lucide-react"
import Link from "next/link"
import { validatePassword } from "@/lib/auth/validation"
import { formatAuthError } from "@/lib/auth/auth-errors"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifyingSession, setIsVerifyingSession] = useState(true)
  const [hasValidSession, setHasValidSession] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // Verify that an active authenticated session exists for password recovery
  useEffect(() => {
    let isMounted = true

    const verifySession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (isMounted) {
          if (session) {
            setHasValidSession(true)
          } else {
            // Also listen for any incoming auth event (e.g., hash token recovery)
            const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
              if (event === 'PASSWORD_RECOVERY' || (s && event === 'SIGNED_IN')) {
                setHasValidSession(true)
              }
            })
            // If after a small grace period no session is found, flag as missing
            setTimeout(() => {
              if (isMounted && !hasValidSession) {
                setIsVerifyingSession(false)
              }
            }, 1200)

            return () => subscription.unsubscribe()
          }
          setIsVerifyingSession(false)
        }
      } catch {
        if (isMounted) {
          setIsVerifyingSession(false)
          setHasValidSession(false)
        }
      }
    }

    verifySession()

    return () => {
      isMounted = false
    }
  }, [supabase, hasValidSession])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    // Validate password rules
    const passwordCheck = validatePassword(password)
    if (!passwordCheck.valid) {
      setErrorMsg(passwordCheck.error || "Password must be at least 8 characters long.")
      return
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please verify your confirm password.")
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      })

      if (error) throw error

      setSuccess(true)
      setTimeout(() => {
        router.push("/dashboard")
        router.refresh()
      }, 2000)
    } catch (err: any) {
      console.error("Password update error:", err)
      setErrorMsg(formatAuthError(err))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-[2rem] p-6 sm:p-8 shadow-xl shadow-violet-500/5">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1.5 mb-3 group">
            <img 
              src="/logo.png" 
              alt="Trackr" 
              className="w-10 h-10 object-contain drop-shadow-sm scale-[1.3] origin-center transition-transform group-hover:scale-[1.35]" 
            />
            <span className="text-2xl font-bold tracking-tight text-gray-900 ml-1">Trackr</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-1.5">
            Choose a strong password with at least 8 characters.
          </p>
        </div>

        {isVerifyingSession ? (
          <div className="py-12 text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-violet-600 mx-auto" />
            <p className="text-sm text-gray-500">Verifying secure recovery link...</p>
          </div>
        ) : !hasValidSession ? (
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 text-center space-y-4 animate-in fade-in">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">Recovery Link Invalid or Expired</h2>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                For your security, password reset links can only be used once and expire after a short period.
              </p>
            </div>
            <Link href="/auth">
              <Button className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-sm text-sm">
                Request New Password Reset Link
              </Button>
            </Link>
          </div>
        ) : success ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h2 className="text-base font-bold text-emerald-900">Password Updated Successfully!</h2>
            <p className="text-xs text-emerald-700 mt-1">
              Your password has been changed. Redirecting you to your dashboard...
            </p>
          </div>
        ) : (
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {errorMsg && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3.5 rounded-xl font-medium animate-in fade-in flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 rounded-xl text-sm focus-visible:ring-violet-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-gray-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-violet-600" />
                <span>Must include letters and at least one number or symbol</span>
              </p>
            </div>

            <div className="space-y-1.5 text-left">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repeat new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-10 pr-10 h-11 bg-gray-50/50 border-gray-200 rounded-xl text-sm focus-visible:ring-violet-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading || !password || !confirmPassword}
              className="w-full h-11 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-semibold shadow-md shadow-violet-500/20 active:scale-[0.99] transition-all cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password"
              )}
            </Button>

            <div className="text-center pt-2">
              <Link href="/auth" className="text-xs font-semibold text-gray-500 hover:text-violet-600 transition-colors">
                Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

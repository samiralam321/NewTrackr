'use client'

import { useUser } from "@clerk/nextjs"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"

export function SupabaseAuthSync({ children }: { children: React.ReactNode }) {
  const { user: clerkUser, isLoaded: isClerkLoaded } = useUser()
  const [isSynced, setIsSynced] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!isClerkLoaded) return

    if (!clerkUser) {
      // If not logged in to Clerk, clear Supabase session and stop loading
      supabase.auth.signOut()
      setIsSynced(true)
      return
    }

    const syncSessions = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        const email = clerkUser.primaryEmailAddress?.emailAddress
        const password = clerkUser.id + "_secure_clerk_pass!"
        const fullName = clerkUser.fullName || clerkUser.username || "User"
        const avatarUrl = clerkUser.imageUrl

        if (session?.user?.email === email) {
          // Already logged into Supabase with matching email, synced successfully
          setIsSynced(true)
          if (window.location.pathname === '/auth') {
            window.location.href = '/dashboard'
          }
          return
        }

        // Try signing in to Supabase first
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: email!,
          password,
        })

        if (signInError) {
          // If sign-in fails (e.g. user does not exist in Supabase auth yet), sign up!
          const { error: signUpError } = await supabase.auth.signUp({
            email: email!,
            password,
            options: {
              data: {
                full_name: fullName,
                avatar_url: avatarUrl,
              }
            }
          })

          if (signUpError) {
            console.error("Supabase sync sign-up failed:", signUpError.message)
          } else {
            // Sign in again after sign up to establish session
            await supabase.auth.signInWithPassword({
              email: email!,
              password,
            })
          }
        }

        if (window.location.pathname === '/auth') {
          window.location.href = '/dashboard'
        }
      } catch (err) {
        console.error("Error synchronizing session with Supabase:", err)
      } finally {
        setIsSynced(true)
      }
    }

    syncSessions()
  }, [clerkUser, isClerkLoaded])

  // While loading Clerk session or executing the Supabase background sync, show a premium loading indicator
  if (!isClerkLoaded || (clerkUser && !isSynced)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50/50 dark:bg-[#050505] transition-colors duration-300">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-violet-600 dark:text-violet-400" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Verifying session...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

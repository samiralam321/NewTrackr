import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = 
  process.env.EXPO_PUBLIC_SUPABASE_URL || "https://bsqqdfkdycziocmgiani.supabase.co"

export const SUPABASE_ANON_KEY = 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzcXFkZmtkeWN6aW9jbWdpYW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzg4NzksImV4cCI6MjA5MjYxNDg3OX0.ZBZCHtdwC9qyLanaXoW-FuaNZFd_K9Nssrm-nFDGdzU"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: true,
  }
})

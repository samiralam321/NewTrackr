'use client'

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Camera, UploadCloud, FileText, Trash2, Check, Link2, X } from "lucide-react"
import { cleanUsername, validateUsernameFormat, getUserHandle } from "@/lib/utils/user"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { 
  validateFileSecurity, 
  IMAGE_UPLOAD_CONSTRAINTS, 
  RESUME_UPLOAD_CONSTRAINTS,
  sanitizeText
} from "@/lib/security/api-security"

type ProfileProps = {
  id: string
  full_name: string | null
  username?: string | null
  bio: string | null
  college: string | null
  website?: string | null
  avatar_url: string | null
  resume_url?: string | null
  resume_name?: string | null
}

export function EditProfileDialog({ profile }: { profile: ProfileProps }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || "")
  const initialUsername = (profile.username || getUserHandle(profile.full_name)).replace(/^@+/, '')
  const [username, setUsername] = useState(initialUsername)
  const [usernameStatus, setUsernameStatus] = useState<{ checking: boolean; available: boolean | null; error?: string }>({
    checking: false,
    available: null
  })
  const usernameCheckTimeout = useRef<NodeJS.Timeout | null>(null)
  const [website, setWebsite] = useState(profile.website || "")
  const [bio, setBio] = useState(profile.bio || "")
  const [college, setCollege] = useState(profile.college || "")
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(profile.avatar_url)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeUrl, setResumeUrl] = useState<string | null>(profile.resume_url || null)
  const [resumeName, setResumeName] = useState<string | null>(profile.resume_name || null)
  const [isDeletingResume, setIsDeletingResume] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resumeInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()
  const router = useRouter()

  // Keep dialog fields synchronized when dialog opens or profile changes
  useEffect(() => {
    if (open) {
      setFullName(profile.full_name || "")
      const currentU = (profile.username || getUserHandle(profile.full_name)).replace(/^@+/, '')
      setUsername(currentU)
      setWebsite(profile.website || "")
      setBio(profile.bio || "")
      setCollege(profile.college || "")
      setPreviewUrl(profile.avatar_url)
      setResumeUrl(profile.resume_url || null)
      setResumeName(profile.resume_name || null)
      setAvatarFile(null)
      setResumeFile(null)
      setIsDeletingResume(false)
      setUsernameStatus({ checking: false, available: null })
    }
  }, [open, profile])

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

    if (clean.toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameStatus({ checking: false, available: true })
      return
    }

    setUsernameStatus({ checking: true, available: null })
    usernameCheckTimeout.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', clean)
          .neq('id', profile.id)
          .maybeSingle()
        
        if (error) {
          setUsernameStatus({ checking: false, available: true })
        } else if (data) {
          setUsernameStatus({ checking: false, available: false, error: `@${clean} is already taken. Try another.` })
        } else {
          setUsernameStatus({ checking: false, available: true })
        }
      } catch {
        setUsernameStatus({ checking: false, available: true })
      }
    }, 350)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      const validation = validateFileSecurity(file, IMAGE_UPLOAD_CONSTRAINTS)
      if (!validation.valid) {
        alert(validation.error || "Please select a valid image (JPG, PNG, WEBP under 5MB)")
        return
      }
      setAvatarFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user || authData.user.id !== profile.id) {
        throw new Error("Unauthorized to edit this profile")
      }

      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg'
        const safeFileName = `${profile.id}-${Date.now()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(safeFileName, avatarFile, { upsert: true })
        
        if (uploadError) throw uploadError

        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(safeFileName)
        
        avatarUrl = publicUrl.publicUrl
      }

      let finalResumeUrl = resumeUrl
      let finalResumeName = resumeName

      if (isDeletingResume) {
        finalResumeUrl = null
        finalResumeName = null
      } else if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop()?.toLowerCase() || 'pdf'
        const safeResumeFileName = `${profile.id}-resume-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(safeResumeFileName, resumeFile, { upsert: true })
        
        if (uploadError) throw uploadError

        const { data: publicUrl } = supabase.storage
          .from('resumes')
          .getPublicUrl(safeResumeFileName)
        
        finalResumeUrl = publicUrl.publicUrl
        finalResumeName = sanitizeText(resumeFile.name, 100)
      }

      const cleanFullName = sanitizeText(fullName, 100)
      const cleanBio = sanitizeText(bio, 500)
      const cleanCollege = sanitizeText(college, 150)
      const cleanWebsite = sanitizeText(website.trim(), 200)

      // Validate Twitter-style unique username
      const cleanU = cleanUsername(username)
      const uCheck = validateUsernameFormat(cleanU)
      if (!uCheck.valid) {
        alert(uCheck.error)
        setIsLoading(false)
        return
      }

      if (usernameStatus.available === false) {
        alert(usernameStatus.error || "Please choose an available username.")
        setIsLoading(false)
        return
      }

      // Live uniqueness verification
      if (cleanU.toLowerCase() !== initialUsername.toLowerCase()) {
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .ilike('username', cleanU)
          .neq('id', profile.id)
          .maybeSingle()

        if (existingUser) {
          setUsernameStatus({ checking: false, available: false, error: `@${cleanU} is already taken.` })
          alert(`Username @${cleanU} is already taken by another student.`)
          setIsLoading(false)
          return
        }
      }

      // Persist website to auth user metadata so it persists across sessions immediately
      try {
        await supabase.auth.updateUser({
          data: {
            website: cleanWebsite,
            link: cleanWebsite
          }
        })
      } catch (authErr) {
        console.warn("Could not update auth user_metadata:", authErr)
      }

      const updatePayload: Record<string, any> = {
        full_name: cleanFullName,
        bio: cleanBio,
        college: cleanCollege,
        avatar_url: avatarUrl,
        resume_url: finalResumeUrl,
        resume_name: finalResumeName,
        username: cleanU,
        website: cleanWebsite
      }

      let { error } = await supabase
        .from('profiles')
        .update(updatePayload)
        .eq('id', profile.id)

      // Graceful fallback if database columns (e.g. 'website' or 'username') do not exist yet in public.profiles table
      if (error) {
        const errorMsg = (error.message || '').toLowerCase()
        const isColumnMissing = 
          error.code === 'PGRST204' || 
          error.code === '42703' || 
          errorMsg.includes('schema cache') || 
          errorMsg.includes('does not exist')

        if (isColumnMissing) {
          let hasChanges = false
          if (errorMsg.includes('website')) {
            delete updatePayload.website
            hasChanges = true
          }
          if (errorMsg.includes('username')) {
            delete updatePayload.username
            hasChanges = true
          }

          if (hasChanges) {
            const retryRes = await supabase
              .from('profiles')
              .update(updatePayload)
              .eq('id', profile.id)
            error = retryRes.error
          }
        }
      }

      if (error) {
        if (error.code === '23505') {
          throw new Error(`Username @${cleanU} is already taken.`)
        }
        throw new Error(error.message || error.details || "Failed to update profile.")
      }

      window.dispatchEvent(
        new CustomEvent('profile-updated', {
          detail: {
            full_name: cleanFullName,
            username: cleanU,
            bio: cleanBio,
            college: cleanCollege,
            avatar_url: avatarUrl,
            resume_url: finalResumeUrl,
            resume_name: finalResumeName,
            website: cleanWebsite
          }
        })
      )

      setOpen(false)
      router.refresh()
    } catch (error: any) {
      console.error("Error updating profile:", error?.message || error)
      alert(error?.message || "Failed to update profile.")
    } finally {
      setIsLoading(false)
    }
  }
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-full h-9 px-4 text-xs font-semibold shadow-sm border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1A1A24] hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white transition-colors cursor-pointer">
        Edit Profile
      </DialogTrigger>
      
      <DialogContent 
        showCloseButton={false}
        overlayClassName="bg-black/65 backdrop-blur-xs z-[999]"
        className="z-[1000] p-0 gap-0 overflow-hidden flex flex-col w-full h-full sm:h-[88vh] max-h-[90vh] sm:max-w-[740px] rounded-none sm:rounded-2xl md:rounded-3xl bg-white dark:bg-[#0D0B14] border-0 sm:border border-gray-100 dark:border-[#2D2B3B] shadow-2xl"
      >
        <DialogTitle className="sr-only">Edit Profile</DialogTitle>

        {/* Fixed Twitter/X-style Header */}
        <div className="h-14 sm:h-16 px-4 sm:px-6 flex items-center justify-between border-b border-gray-100 dark:border-white/10 bg-white/95 dark:bg-[#0D0B14]/95 backdrop-blur-md sticky top-0 z-20 shrink-0">
          <div className="flex items-center gap-3 sm:gap-5 min-w-0">
            {/* Close button on the left */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Title next to close button */}
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white truncate">
              Edit Profile
            </h2>
          </div>

          {/* Save Changes button on the right */}
          <Button
            type="button"
            onClick={handleSave}
            disabled={isLoading}
            className="rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 h-9 shadow-sm active:scale-95 transition-all cursor-pointer shrink-0"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
            Save Changes
          </Button>
        </div>

        {/* Vertically Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 sm:space-y-7 [scrollbar-gutter:stable]">
          {/* Avatar Section */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 pb-6 border-b border-gray-100 dark:border-white/5">
            <div 
              className="relative group cursor-pointer shrink-0" 
              onClick={() => fileInputRef.current?.click()}
              title="Click to change profile picture"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-2 border-violet-100 dark:border-violet-900/30 bg-gray-50 dark:bg-[#161420] shadow-sm">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs font-semibold text-gray-400">No Image</div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/45 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 backdrop-blur-xs">
                <Camera className="w-6 h-6 text-white" />
                <span className="text-[10px] font-semibold text-white/90">Change</span>
              </div>
            </div>

            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">Profile Photo</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed max-w-md">
                A profile picture helps other students and tech peers recognize you across Trackr. JPG, PNG or WEBP up to 5MB.
              </p>
              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl h-8 px-3 text-xs font-semibold border-gray-200 dark:border-white/10 hover:border-violet-500 hover:text-violet-600 transition-colors cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5 text-violet-500" />
                  Upload new photo
                </Button>
              </div>
            </div>

            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/jpeg,image/png,image/webp,image/jpg" 
              className="hidden" 
            />
          </div>

          {/* Username (Unique Handle) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="username" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Username (Unique Handle)
              </Label>
              <span className="text-[11px] text-gray-400 font-normal">{username.length}/20</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400 select-none">@</span>
              <Input 
                id="username" 
                value={username} 
                onChange={(e) => handleUsernameChange(e.target.value)} 
                maxLength={20} 
                placeholder="username" 
                className={`h-11 pl-8 pr-10 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#161420] text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500 ${
                  usernameStatus.available === false ? 'border-rose-400 focus-visible:ring-rose-400/20 focus-visible:border-rose-400' : 
                  usernameStatus.available === true ? 'border-emerald-400 focus-visible:ring-emerald-400/20 focus-visible:border-emerald-400' : ''
                }`} 
              />
              {usernameStatus.checking && (
                <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            {usernameStatus.available === false && (
              <p className="text-[11px] font-medium text-rose-500 animate-in fade-in">
                {usernameStatus.error || "Username is not available"}
              </p>
            )}
            {usernameStatus.available === true && username.length >= 3 && (
              <p className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 animate-in fade-in">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>@{username} is available!</span>
              </p>
            )}
          </div>

          {/* Name */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="name" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Name
              </Label>
              <span className="text-[11px] text-gray-400 font-normal">{fullName.length}/100</span>
            </div>
            <Input 
              id="name" 
              value={fullName} 
              onChange={(e) => setFullName(e.target.value)} 
              maxLength={100} 
              placeholder="Your display name"
              className="h-11 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#161420] text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500" 
            />
          </div>
          
          {/* College / Organization */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="college" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                College / Organization
              </Label>
              <span className="text-[11px] text-gray-400 font-normal">{college.length}/150</span>
            </div>
            <Input 
              id="college" 
              value={college} 
              onChange={(e) => setCollege(e.target.value)} 
              maxLength={150} 
              placeholder="e.g. Stanford University or Tech Org" 
              className="h-11 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#161420] text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500" 
            />
          </div>

          {/* Website / Link */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="website" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-violet-500" />
                <span>Link / Website</span>
              </Label>
              <span className="text-[11px] text-gray-400 font-normal">{website.length}/200</span>
            </div>
            <Input 
              id="website" 
              value={website} 
              onChange={(e) => setWebsite(e.target.value)} 
              maxLength={200} 
              placeholder="e.g. github.com/yourhandle, portfolio, or any link" 
              className="h-11 rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#161420] text-sm text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500" 
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="bio" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
                Bio
              </Label>
              <span className="text-[11px] text-gray-400 font-normal">{bio.length}/500</span>
            </div>
            <Textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Tell us about yourself, what you're building, or your tech stack..."
              maxLength={500}
              rows={4}
              className="resize-none rounded-xl border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-[#161420] text-sm text-gray-900 dark:text-white leading-relaxed p-3.5 focus-visible:ring-2 focus-visible:ring-violet-500/20 focus-visible:border-violet-500 h-28" 
            />
          </div>

          {/* Resume Section */}
          <div className="space-y-2 pt-1 pb-4">
            <Label htmlFor="resume" className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">
              Resume (PDF or Word)
            </Label>
            <div className="flex items-center gap-3">
              {resumeFile || resumeName ? (
                <div className="flex-1 flex items-center justify-between p-3.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-[#161420] transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white truncate block max-w-[280px] sm:max-w-[420px]">
                        {resumeFile ? resumeFile.name : resumeName}
                      </span>
                      <span className="text-[11px] text-gray-400">Attached resume</span>
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      setResumeFile(null)
                      setResumeUrl(null)
                      setResumeName(null)
                      setIsDeletingResume(true)
                      if (resumeInputRef.current) resumeInputRef.current.value = ""
                    }} 
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer shrink-0"
                    title="Remove resume"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => resumeInputRef.current?.click()} 
                  className="w-full h-14 border-dashed border-gray-300 dark:border-white/15 hover:border-violet-500 hover:bg-violet-50/20 dark:hover:bg-violet-950/20 rounded-xl flex items-center justify-center gap-2.5 text-gray-600 dark:text-gray-300 hover:text-violet-600 dark:hover:text-violet-400 font-semibold transition-all duration-200 cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5 text-violet-500" />
                  <span>Upload Resume (PDF, DOC, DOCX up to 5MB)</span>
                </Button>
              )}
              <input 
                type="file" 
                ref={resumeInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0]
                    const validation = validateFileSecurity(file, RESUME_UPLOAD_CONSTRAINTS)
                    if (!validation.valid) {
                      alert(validation.error || "Please select a valid resume file (PDF or Word document under 5MB)")
                      return
                    }
                    setResumeFile(file)
                    setIsDeletingResume(false)
                  }
                }} 
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                className="hidden" 
              />
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Camera, UploadCloud, FileText, Trash2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

type ProfileProps = {
  id: string
  full_name: string | null
  bio: string | null
  college: string | null
  avatar_url: string | null
  resume_url?: string | null
  resume_name?: string | null
}

export function EditProfileDialog({ profile }: { profile: ProfileProps }) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [fullName, setFullName] = useState(profile.full_name || "")
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setAvatarFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    try {
      let avatarUrl = profile.avatar_url

      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop()
        const fileName = `${profile.id}-${Math.random()}.${fileExt}`
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true })
        
        if (uploadError) throw uploadError

        const { data: publicUrl } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName)
        
        avatarUrl = publicUrl.publicUrl
      }

      let finalResumeUrl = resumeUrl
      let finalResumeName = resumeName

      if (isDeletingResume) {
        finalResumeUrl = null
        finalResumeName = null
      } else if (resumeFile) {
        const fileExt = resumeFile.name.split('.').pop()
        const fileName = `${profile.id}-resume-${Date.now()}.${fileExt}`
        
        const { error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, resumeFile, { upsert: true })
        
        if (uploadError) throw uploadError

        const { data: publicUrl } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName)
        
        finalResumeUrl = publicUrl.publicUrl
        finalResumeName = resumeFile.name
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          bio,
          college,
          avatar_url: avatarUrl,
          resume_url: finalResumeUrl,
          resume_name: finalResumeName
        })
        .eq('id', profile.id)

      if (error) throw error

      window.dispatchEvent(
        new CustomEvent('profile-updated', {
          detail: {
            full_name: fullName,
            bio,
            college,
            avatar_url: avatarUrl,
            resume_url: finalResumeUrl,
            resume_name: finalResumeName
          }
        })
      )

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="inline-flex items-center justify-center rounded-full h-9 px-4 text-xs font-semibold shadow-sm border border-gray-200 bg-white hover:bg-gray-50 text-gray-900 transition-colors cursor-pointer">
        Edit Profile
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Edit Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="flex flex-col items-center gap-4">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 bg-gray-50">
                {previewUrl ? (
                  <img src={previewUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="rounded-xl border-gray-200" />
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="college">College / Organization</Label>
            <Input id="college" value={college} onChange={(e) => setCollege(e.target.value)} placeholder="e.g. Stanford University" className="rounded-xl border-gray-200" />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="bio">Bio</Label>
            <Textarea 
              id="bio" 
              value={bio} 
              onChange={(e) => setBio(e.target.value)} 
              placeholder="Tell us about yourself..."
              className="resize-none rounded-xl border-gray-200 h-24"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="resume">Resume (PDF or Word)</Label>
            <div className="flex items-center gap-3">
              {resumeFile || resumeName ? (
                <div className="flex-1 flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50/50 dark:bg-[#1A1A24] dark:border-[#2D2B3B] transition-all">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-5 h-5 text-violet-500 shrink-0" />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate max-w-[220px]">
                      {resumeFile ? resumeFile.name : resumeName}
                    </span>
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
                    className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => resumeInputRef.current?.click()} 
                  className="w-full h-11 border-dashed border-gray-200 hover:border-violet-500 hover:bg-violet-50/10 dark:border-[#2D2B3B] rounded-xl flex items-center justify-center gap-2.5 text-gray-500 hover:text-violet-600 font-semibold transition-all duration-200 cursor-pointer"
                >
                  <UploadCloud className="w-5 h-5" />
                  Upload Resume
                </Button>
              )}
              <input 
                type="file" 
                ref={resumeInputRef} 
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    const file = e.target.files[0]
                    if (file.size > 5 * 1024 * 1024) {
                      alert("File is too large. Max size is 5MB.")
                      return
                    }
                    setResumeFile(file)
                    setIsDeletingResume(false)
                  }
                }} 
                accept=".pdf,.doc,.docx" 
                className="hidden" 
              />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
          <Button onClick={handleSave} disabled={isLoading} className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

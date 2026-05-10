import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-[#FAFAFA] dark:bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center animate-pulse">
          <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium animate-pulse">Loading Trackr...</p>
      </div>
    </div>
  )
}

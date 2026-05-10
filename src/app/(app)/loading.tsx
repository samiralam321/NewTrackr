import { Loader2 } from "lucide-react"

export default function Loading() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-[#FAFAFA] dark:bg-[#050505]">
      <div className="flex flex-col items-center gap-4">
         <Loader2 className="w-8 h-8 text-violet-600 dark:text-violet-400 animate-spin" />
      </div>
    </div>
  )
}

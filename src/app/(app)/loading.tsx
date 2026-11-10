export default function Loading() {
  return (
    <div className="flex h-full w-full overflow-hidden bg-[#FDFCFE] dark:bg-[#050505] transition-colors duration-300">
      <div className="flex-1 min-w-0 overflow-y-auto px-4 sm:px-6 md:px-8 lg:px-10 py-5 md:py-6">
        <div className="max-w-[680px] mx-auto w-full space-y-5 animate-pulse">
          {/* Header Skeleton */}
          <div className="space-y-2 mb-6">
            <div className="h-7 bg-gray-200/70 dark:bg-[#1A1A24] rounded-xl w-48"></div>
            <div className="h-4 bg-gray-100 dark:bg-[#1A1A24]/60 rounded-lg w-72"></div>
          </div>

          {/* Tab Bar Skeleton */}
          <div className="h-11 bg-gray-100/80 dark:bg-[#1A1A24]/60 rounded-full w-80 mb-6"></div>

          {/* Post Composer Skeleton */}
          <div className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-[#1A1A24] shrink-0"></div>
              <div className="h-9 bg-gray-50 dark:bg-[#1A1A24]/40 rounded-xl flex-1"></div>
            </div>
          </div>

          {/* Feed Post Card Skeletons */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-[#0B0A10] border border-gray-100 dark:border-[#2D2B3B] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-[#1A1A24] shrink-0"></div>
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 dark:bg-[#1A1A24] rounded w-1/3"></div>
                  <div className="h-3 bg-gray-100 dark:bg-[#1A1A24]/60 rounded w-1/4"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-3.5 bg-gray-200/80 dark:bg-[#1A1A24] rounded w-full"></div>
                <div className="h-3.5 bg-gray-200/80 dark:bg-[#1A1A24] rounded w-5/6"></div>
                <div className="h-3.5 bg-gray-100 dark:bg-[#1A1A24]/60 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

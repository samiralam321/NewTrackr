'use client'

import { Opportunity } from "@/lib/opportunities/types"
import { computeDaysRemaining } from "@/lib/opportunities/validators"
import { X, ExternalLink, Calendar, MapPin, Award, CheckCircle2, Bookmark, ShieldCheck, DollarSign, Users } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface OpportunityDetailModalProps {
  opportunity: Opportunity | null
  isOpen: boolean
  onClose: () => void
  isBookmarked: boolean
  onToggleBookmark: (oppId: string) => void
}

export function OpportunityDetailModal({
  opportunity,
  isOpen,
  onClose,
  isBookmarked,
  onToggleBookmark
}: OpportunityDetailModalProps) {
  if (!isOpen || !opportunity) return null

  const daysRemaining = computeDaysRemaining(opportunity.registration_deadline)
  const isClosingSoon = daysRemaining <= 7 && daysRemaining >= 0

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative bg-white dark:bg-[#0E0C15] border border-gray-200 dark:border-[#2D2B3B] rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-[#1F1D2B] flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              {opportunity.organizer_logo ? (
                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-[#1A1825] border border-gray-100 dark:border-[#2D2B3B] p-2 flex items-center justify-center shrink-0 shadow-sm">
                  <img
                    src={opportunity.organizer_logo}
                    alt={opportunity.organizer}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-2xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300 font-bold text-lg flex items-center justify-center shrink-0 border border-violet-100 dark:border-violet-800/40">
                  {opportunity.organizer.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-800/40">
                    {opportunity.category}
                  </span>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                    isClosingSoon
                      ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800/50'
                      : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/50'
                  }`}>
                    {daysRemaining <= 0 ? 'Closes Today' : isClosingSoon ? `Closing in ${daysRemaining}d` : 'Active'}
                  </span>
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white leading-tight truncate">
                  {opportunity.title}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {opportunity.organizer}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#1F1D2B] transition-colors shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-sm text-gray-700 dark:text-gray-300">
            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 p-3.5 bg-gray-50/80 dark:bg-[#151320] rounded-2xl border border-gray-100 dark:border-[#242132]">
              <div>
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-violet-500" /> Mode & Location
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate">
                  {opportunity.mode} • {opportunity.location.split('(')[0]}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-500" /> Deadline
                </p>
                <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5">
                  {opportunity.registration_deadline}
                </p>
              </div>

              {(opportunity.prize_pool || opportunity.stipend) && (
                <div className="col-span-2">
                  <p className="text-[11px] font-medium text-gray-400 dark:text-gray-500 flex items-center gap-1">
                    <Award className="w-3 h-3 text-emerald-500" /> Reward / Compensation
                  </p>
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                    {opportunity.prize_pool || opportunity.stipend}
                  </p>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                About Opportunity
              </h3>
              <p className="leading-relaxed whitespace-pre-line text-gray-700 dark:text-gray-300">
                {opportunity.full_description || opportunity.description}
              </p>
            </div>

            {/* Eligibility */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                Eligibility & Qualifications
              </h3>
              <div className="p-3 bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/30 rounded-xl text-xs sm:text-sm text-gray-700 dark:text-gray-300 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0 mt-0.5" />
                <p>{opportunity.eligibility}</p>
              </div>
            </div>

            {/* Required Skills */}
            {opportunity.skills && opportunity.skills.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">
                  Key Skills & Domains
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {opportunity.skills.map((skill) => (
                    <span
                      key={skill}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-gray-100 dark:bg-[#1E1C2B] text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-[#2D2B3B]"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Source Attribution & Verification Notice */}
            <div className="pt-2 border-t border-gray-100 dark:border-[#1F1D2B] flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                Verified via {opportunity.source_name}
              </span>
              <span>
                Verified on {new Date(opportunity.last_verified_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-[#1F1D2B] bg-gray-50/50 dark:bg-[#0B0A10] flex items-center justify-between gap-3">
            <button
              onClick={() => onToggleBookmark(opportunity.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all ${
                isBookmarked
                  ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-800'
                  : 'bg-white dark:bg-[#1A1825] text-gray-700 dark:text-gray-300 border-gray-200 dark:border-[#2D2B3B] hover:bg-gray-100 dark:hover:bg-[#252233]'
              }`}
            >
              <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
              <span>{isBookmarked ? 'Saved' : 'Save for Later'}</span>
            </button>

            <a
              href={opportunity.application_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 active:scale-95 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-500/20 transition-all ml-auto"
            >
              <span>Apply on Official Portal</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

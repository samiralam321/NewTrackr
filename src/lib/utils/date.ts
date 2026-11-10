/**
 * Formats a timestamp in Twitter/X timeline style:
 * - < 1 min: "now"
 * - < 1 hour: "Xm" (e.g. "5m")
 * - < 24 hours: "Xh" (e.g. "3h")
 * - < 7 days: "Xd" (e.g. "1d", "6d")
 * - >= 7 days (current calendar year): "MMM d" (e.g. "May 3", "Nov 10")
 * - older (prior calendar years): "MMM d, yyyy" (e.g. "May 3, 2025")
 */
export function formatTimeCompact(dateStr?: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  // Handle clock skew / just now
  if (diffInSeconds < 60) return 'now'

  // Less than 1 hour -> "Xm"
  if (diffInSeconds < 3600) {
    return `${Math.floor(diffInSeconds / 60)}m`
  }

  // Less than 24 hours -> "Xh"
  if (diffInSeconds < 86400) {
    return `${Math.floor(diffInSeconds / 3600)}h`
  }

  // Less than 7 days -> "Xd"
  const diffInDays = Math.floor(diffInSeconds / 86400)
  if (diffInDays < 7) {
    return `${diffInDays}d`
  }

  // Same year -> "May 3"
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // Different year -> "May 3, 2025"
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Relative time with "ago" suffix for verbose cards / notifications
 */
export function getTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return 'Just now'
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`

  const diffInDays = Math.floor(diffInSeconds / 86400)
  if (diffInDays < 7) return `${diffInDays}d ago`

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Returns formatted date and time for accessible title tooltip (e.g. "May 3, 2026, 4:15 PM")
 */
export function formatFullDateTime(dateStr?: string | null): string {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return ''

  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

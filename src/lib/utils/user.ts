/**
 * Twitter-style Unique Username & Handle Utilities
 */

export function cleanUsername(username: string): string {
  return username.trim().replace(/^@+/, '')
}

export function validateUsernameFormat(username: string): { valid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { valid: false, error: "Username cannot be empty" }
  }
  const clean = cleanUsername(username)
  if (clean.length < 3) {
    return { valid: false, error: "Username must be at least 3 characters" }
  }
  if (clean.length > 20) {
    return { valid: false, error: "Username cannot exceed 20 characters" }
  }
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { valid: false, error: "Username can only contain letters, numbers, and underscores (_)" }
  }
  if (/^_+$/.test(clean)) {
    return { valid: false, error: "Username must contain at least one letter or number" }
  }
  return { valid: true }
}

export function getUserHandle(
  userOrFullName?: { full_name?: string | null; username?: string | null } | string | null,
  explicitUsername?: string | null
): string {
  // 1. Explicit username passed as second argument
  if (explicitUsername && explicitUsername.trim()) {
    const cleanU = cleanUsername(explicitUsername)
    if (cleanU) return `@${cleanU}`
  }

  // 2. Profile object passed as first argument
  if (userOrFullName && typeof userOrFullName === 'object') {
    if (userOrFullName.username && userOrFullName.username.trim()) {
      return `@${cleanUsername(userOrFullName.username)}`
    }
    userOrFullName = userOrFullName.full_name
  }

  // 3. String name passed
  if (!userOrFullName || typeof userOrFullName !== 'string') return '@student'
  const clean = userOrFullName.trim()

  // Admin Samir Alam defaults to @samCPer (Twitter handle)
  if (clean.toLowerCase().includes('samir')) return '@samCPer'

  // Clean fallback handle: lowercase alphanumeric and underscore without duplicates
  const handle = clean.toLowerCase().replace(/[^a-z0-9_]+/g, '_').replace(/^_+|_+$/g, '')
  return `@${handle || 'student'}`
}

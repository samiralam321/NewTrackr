/**
 * Trackr Authentication Validation & Sanitization Engine
 * Twitter/X & LinkedIn standard validation rules for emails, usernames, and passwords.
 */

// List of system-reserved usernames that users cannot register
export const RESERVED_USERNAMES = new Set([
  'admin',
  'administrator',
  'trackr',
  'trackrapp',
  'official',
  'root',
  'support',
  'help',
  'api',
  'dashboard',
  'settings',
  'profile',
  'auth',
  'login',
  'signup',
  'register',
  'reset',
  'null',
  'undefined',
  'system',
  'moderator',
  'mod',
  'bot',
  'staff',
  'team',
  'security',
  'privacy',
  'terms',
  'explore',
  'challenges',
  'leaderboard',
  'saved',
  'messages',
  'notifications',
  'feed'
])

/**
 * Standardizes email addresses: trimmed, lowercase, no control chars
 */
export function normalizeEmail(email: string): string {
  if (!email || typeof email !== 'string') return ''
  return email.trim().toLowerCase()
}

/**
 * Standardizes usernames: trimmed, lowercase, strips leading @ symbol
 */
export function normalizeUsername(username: string): string {
  if (!username || typeof username !== 'string') return ''
  return username.trim().replace(/^@+/, '').toLowerCase()
}

/**
 * Strips leading @ and trims username while preserving user case choice
 */
export function cleanUsername(username: string): string {
  if (!username || typeof username !== 'string') return ''
  return username.trim().replace(/^@+/, '')
}

/**
 * Validates RFC 5322 compatible email format
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email address is required.' }
  }

  const normalized = normalizeEmail(email)
  
  if (normalized.length > 254) {
    return { valid: false, error: 'Email address cannot exceed 254 characters.' }
  }

  // RFC 5322 compliant regex for robust email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/
  
  if (!emailRegex.test(normalized)) {
    return { valid: false, error: 'Please enter a valid email address (e.g., name@university.edu).' }
  }

  // Check domain structure
  const parts = normalized.split('@')
  if (parts.length !== 2 || !parts[1].includes('.')) {
    return { valid: false, error: 'Email must contain a valid domain name.' }
  }

  return { valid: true }
}

/**
 * Validates full name format and length
 */
export function validateFullName(name: string): { valid: boolean; error?: string } {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Full name is required.' }
  }

  const trimmed = name.trim()
  if (trimmed.length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters.' }
  }
  if (trimmed.length > 50) {
    return { valid: false, error: 'Full name cannot exceed 50 characters.' }
  }

  // Allow alphabets, spaces, dots, hyphens, and apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s.'-]+$/
  if (!nameRegex.test(trimmed)) {
    return { valid: false, error: 'Full name should only contain letters and standard punctuation.' }
  }

  return { valid: true }
}

/**
 * Checks whether a given handle is reserved by the system
 */
export function isReservedUsername(username: string): boolean {
  const clean = normalizeUsername(username)
  return RESERVED_USERNAMES.has(clean)
}

/**
 * Validates username length, allowed characters, and reserved handles
 */
export function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || !username.trim()) {
    return { valid: false, error: 'Username is required.' }
  }

  const clean = username.trim().replace(/^@+/, '')

  if (clean.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters.' }
  }
  if (clean.length > 20) {
    return { valid: false, error: 'Username cannot exceed 20 characters.' }
  }

  // Only alphanumeric characters and underscores
  if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores (_).' }
  }

  // Cannot be all underscores
  if (/^_+$/.test(clean)) {
    return { valid: false, error: 'Username must contain at least one letter or number.' }
  }

  // Reserved handles check
  if (isReservedUsername(clean)) {
    return { valid: false, error: `@${clean} is a reserved system handle. Please choose another.` }
  }

  return { valid: true }
}

/**
 * Validates password strength:
 * - Minimum 8 characters
 * - Must include at least 1 letter and 1 number or special character
 */
export function validatePassword(password: string): {
  valid: boolean
  error?: string
  strength: 'weak' | 'fair' | 'good' | 'strong'
  score: number
} {
  if (!password) {
    return { valid: false, error: 'Password is required.', strength: 'weak', score: 0 }
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters long.', strength: 'weak', score: 1 }
  }

  if (password.length > 72) {
    // Bcrypt max length safeguard
    return { valid: false, error: 'Password cannot exceed 72 characters.', strength: 'weak', score: 1 }
  }

  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecial = /[^a-zA-Z0-9]/.test(password)

  if (!hasLetter) {
    return { valid: false, error: 'Password must contain at least one letter.', strength: 'weak', score: 1 }
  }

  if (!hasNumber && !hasSpecial) {
    return { valid: false, error: 'Password must contain at least one number or special symbol.', strength: 'weak', score: 2 }
  }

  // Calculate score for UI meter
  let score = 2
  if (password.length >= 10) score += 1
  if (hasLetter && hasNumber && hasSpecial) score += 1

  let strength: 'weak' | 'fair' | 'good' | 'strong' = 'fair'
  if (score <= 2) strength = 'fair'
  else if (score === 3) strength = 'good'
  else strength = 'strong'

  return { valid: true, strength, score }
}

/**
 * Sanitizes generic user text input to strip ASCII control characters
 */
export function sanitizeAuthInput(input: string, maxLength = 254): string {
  if (!input || typeof input !== 'string') return ''
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLength)
    .trim()
}

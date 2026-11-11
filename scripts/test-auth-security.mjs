/**
 * Automated Verification Suite for Trackr Authentication & Security
 * Tests validation routines, open-redirect mitigation, error formatting, and password constraints.
 */

import { 
  normalizeEmail, 
  validateEmail, 
  validateFullName, 
  validateUsername, 
  validatePassword, 
  isReservedUsername 
} from '../src/lib/auth/validation.ts'
import { formatAuthError } from '../src/lib/auth/auth-errors.ts'

let passed = 0
let failed = 0

function assert(condition, testName) {
  if (condition) {
    console.log(`  ✓ ${testName}`)
    passed++
  } else {
    console.error(`  ✗ FAIL: ${testName}`)
    failed++
  }
}

console.log('\n--- 1. EMAIL NORMALIZATION & VALIDATION TESTS ---')
assert(normalizeEmail('  User@Example.COM ') === 'user@example.com', 'Normalizes mixed case and trims whitespace')
assert(validateEmail('user@domain.com').valid === true, 'Accepts standard valid email')
assert(validateEmail('student.name+test@university.edu').valid === true, 'Accepts complex university email with plus tag')
assert(validateEmail('invalid-email').valid === false, 'Rejects email without @')
assert(validateEmail('user@').valid === false, 'Rejects email missing domain')
assert(validateEmail('@domain.com').valid === false, 'Rejects email missing local part')
assert(validateEmail('').valid === false, 'Rejects empty email')
assert(validateEmail('user@domain..com').valid === false, 'Rejects double dot domain')

console.log('\n--- 2. USERNAME & RESERVED HANDLES TESTS ---')
assert(validateUsername('samir').valid === true, 'Accepts valid username')
assert(validateUsername('sam_cper99').valid === true, 'Accepts alphanumeric and underscore')
assert(validateUsername('ab').valid === false, 'Rejects username shorter than 3 chars')
assert(validateUsername('a'.repeat(21)).valid === false, 'Rejects username longer than 20 chars')
assert(validateUsername('samir@trackr').valid === false, 'Rejects username with @ symbol inside')
assert(validateUsername('user name').valid === false, 'Rejects username with spaces')
assert(validateUsername('____').valid === false, 'Rejects username consisting solely of underscores')
assert(isReservedUsername('admin') === true, 'Correctly flags "admin" as reserved')
assert(isReservedUsername('trackr') === true, 'Correctly flags "trackr" as reserved')
assert(isReservedUsername('official') === true, 'Correctly flags "official" as reserved')
assert(isReservedUsername('dashboard') === true, 'Correctly flags "dashboard" as reserved')
assert(validateUsername('admin').valid === false, 'Rejects registration of reserved handle "admin"')

console.log('\n--- 3. FULL NAME VALIDATION TESTS ---')
assert(validateFullName('Samir Alam').valid === true, 'Accepts standard full name')
assert(validateFullName('J. O\'Connor').valid === true, 'Accepts name with apostrophe and period')
assert(validateFullName('A').valid === false, 'Rejects single character name')
assert(validateFullName('').valid === false, 'Rejects empty name')
assert(validateFullName('<script>alert(1)</script>').valid === false, 'Rejects script tags in name')

console.log('\n--- 4. PASSWORD SECURITY & CONSTRAINTS TESTS ---')
assert(validatePassword('short1!').valid === false, 'Rejects password shorter than 8 characters')
assert(validatePassword('allcharacterswithoutnumbers').valid === false, 'Rejects password with no numbers or symbols')
assert(validatePassword('1234567890').valid === false, 'Rejects password with no letters')
assert(validatePassword('P@ssword123').valid === true, 'Accepts strong password meeting all criteria')
assert(validatePassword('trackr2026').valid === true, 'Accepts 10-char alphanumeric password')
assert(validatePassword('P@ssword123').score >= 3, 'Calculates high security score for complex password')

console.log('\n--- 5. OPEN REDIRECT SANITIZATION SIMULATION ---')
function getSafeRedirectUrl(next, fallback = '/dashboard') {
  if (!next || typeof next !== 'string') return fallback
  const trimmed = next.trim()
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//') &&
    !trimmed.startsWith('/\\') &&
    !trimmed.includes('\\')
  ) {
    if (trimmed === '/auth' || trimmed.startsWith('/auth/callback')) {
      return fallback
    }
    return trimmed
  }
  return fallback
}

assert(getSafeRedirectUrl('/dashboard') === '/dashboard', 'Allows safe internal route /dashboard')
assert(getSafeRedirectUrl('/post/123-abc') === '/post/123-abc', 'Allows safe deep link route /post/123-abc')
assert(getSafeRedirectUrl('https://evil.com') === '/dashboard', 'Blocks external absolute URL https://evil.com')
assert(getSafeRedirectUrl('//evil.com/phish') === '/dashboard', 'Blocks protocol-relative attack //evil.com')
assert(getSafeRedirectUrl('/\\evil.com') === '/dashboard', 'Blocks backslash escape /\\evil.com')
assert(getSafeRedirectUrl('javascript:alert(1)') === '/dashboard', 'Blocks javascript pseudo-protocol')
assert(getSafeRedirectUrl('/auth') === '/dashboard', 'Prevents redirect loop to /auth')

console.log('\n--- 6. AUTH ERROR SANITIZATION & USER ENUMERATION PROTECTION ---')
assert(formatAuthError('Invalid login credentials').includes('Incorrect email or password'), 'Maps invalid credentials to generic safe message')
assert(formatAuthError('Email not confirmed').includes('activation link'), 'Handles unconfirmed email with actionable guidance')
assert(formatAuthError('User already registered').includes('already exists'), 'Handles duplicate registration gracefully')
assert(formatAuthError({ status: 429, message: 'rate limit' }).includes('Too many'), 'Handles 429 rate limit with friendly notice')
assert(formatAuthError('Failed to fetch').includes('internet connection'), 'Handles network drop with helpful guidance')

console.log(`\n========================================`)
console.log(`TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
console.log(`========================================\n`)

if (failed > 0) {
  process.exit(1)
}

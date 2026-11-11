/**
 * Trackr Authentication Error Translator
 * Maps raw Supabase / GoTrue auth errors and network faults into clean,
 * friendly, secure messages without leaking internal database schemas or user existence.
 */

export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.'

  const message = typeof error === 'string' ? error : error.message || ''
  const status = error.status || error.code || ''
  const lowerMsg = message.toLowerCase()

  // 1. Invalid credentials
  if (
    lowerMsg.includes('invalid login credentials') ||
    lowerMsg.includes('invalid_grant') ||
    lowerMsg.includes('invalid credentials')
  ) {
    return 'Incorrect email or password. Please double-check your credentials and try again.'
  }

  // 2. Unconfirmed email
  if (
    lowerMsg.includes('email not confirmed') ||
    lowerMsg.includes('email_not_confirmed') ||
    lowerMsg.includes('unconfirmed')
  ) {
    return 'Your email address has not been confirmed yet. Please check your inbox for the activation link.'
  }

  // 3. Duplicate user registration
  if (
    lowerMsg.includes('user already registered') ||
    lowerMsg.includes('already exists') ||
    lowerMsg.includes('email address is already registered')
  ) {
    return 'An account with this email address already exists. Please sign in instead.'
  }

  // 4. Rate limiting / Brute force throttling
  if (
    status === 429 ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('over_email_send_rate_limit') ||
    lowerMsg.includes('too many requests')
  ) {
    return 'Too many login attempts. Please wait a few moments and try again.'
  }

  // 5. Password requirement errors
  if (
    lowerMsg.includes('password should be at least') ||
    lowerMsg.includes('password is too short')
  ) {
    return 'Password must be at least 8 characters long.'
  }

  // 6. Expired or invalid recovery token
  if (
    lowerMsg.includes('token has expired') ||
    lowerMsg.includes('invalid token') ||
    lowerMsg.includes('otp expired') ||
    lowerMsg.includes('token is invalid') ||
    lowerMsg.includes('session missing')
  ) {
    return 'This link is invalid or has expired. Please request a new link.'
  }

  // 7. Network / connection issues
  if (
    lowerMsg.includes('failed to fetch') ||
    lowerMsg.includes('network error') ||
    lowerMsg.includes('networkrequestfailed')
  ) {
    return 'Unable to reach the authentication service. Please check your internet connection and try again.'
  }

  // 8. Signups disabled
  if (lowerMsg.includes('signup is disabled') || lowerMsg.includes('signups not allowed')) {
    return 'Registration is currently disabled. Please contact the administrator.'
  }

  // Default fallback: return clean sanitized message or fallback
  if (message.length > 0 && message.length < 120 && !message.includes('{') && !message.includes('SQL')) {
    return message
  }

  return 'An error occurred during authentication. Please try again later.'
}

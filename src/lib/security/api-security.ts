import crypto from "crypto"

/**
 * Validates administrative secret token using timing-safe comparison.
 * Checks 'Authorization: Bearer <token>' header first, with query param fallback.
 */
export function validateAdminSecret(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET_KEY || process.env.CRON_SECRET

  // If no admin secret is configured in the environment, reject for security
  if (!adminSecret) {
    if (process.env.NODE_ENV === 'development') {
      console.warn("[SECURITY WARN] Neither ADMIN_SECRET_KEY nor CRON_SECRET is configured. Falling back to dev secret.")
      return checkTimingSafeToken(request, 'trackr-dev-secret')
    }
    console.error("[SECURITY ERROR] ADMIN_SECRET_KEY is not configured on the server.")
    return false
  }

  return checkTimingSafeToken(request, adminSecret)
}

function checkTimingSafeToken(request: Request, expectedToken: string): boolean {
  let providedToken: string | null = null

  // 1. Check Authorization header (preferred)
  const authHeader = request.headers.get("authorization")
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    providedToken = authHeader.substring(7).trim()
  }

  // 2. Fallback to query param
  if (!providedToken) {
    try {
      const url = new URL(request.url)
      providedToken = url.searchParams.get("secret")
    } catch {
      providedToken = null
    }
  }

  if (!providedToken) return false

  const providedBuffer = Buffer.from(providedToken, "utf8")
  const expectedBuffer = Buffer.from(expectedToken, "utf8")

  // Length must match to use timingSafeEqual
  if (providedBuffer.length !== expectedBuffer.length) {
    return false
  }

  try {
    return crypto.timingSafeEqual(providedBuffer, expectedBuffer)
  } catch {
    return false
  }
}

/**
 * Validates that an external or user-provided URL has a safe protocol.
 * Rejects javascript:, data:, vbscript:, and relative protocol (//) attacks.
 */
export function isSafeUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false
  const trimmed = urlStr.trim()
  if (trimmed.startsWith('//') || trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:')) {
    return false
  }
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}

/**
 * File validation options for user uploads
 */
export interface FileValidationOptions {
  maxSizeBytes: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
}

export const IMAGE_UPLOAD_CONSTRAINTS: FileValidationOptions = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'webp']
}

export const RESUME_UPLOAD_CONSTRAINTS: FileValidationOptions = {
  maxSizeBytes: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  allowedExtensions: ['pdf', 'doc', 'docx']
}

/**
 * Validates file size, MIME type, and extension
 */
export function validateFileSecurity(
  file: File,
  constraints: FileValidationOptions
): { valid: boolean; error?: string } {
  if (!file) {
    return { valid: false, error: "No file provided" }
  }

  if (file.size > constraints.maxSizeBytes) {
    const maxMb = Math.round(constraints.maxSizeBytes / (1024 * 1024))
    return { valid: false, error: `File size exceeds the ${maxMb}MB limit` }
  }

  const fileType = file.type ? file.type.toLowerCase() : ''
  if (!constraints.allowedMimeTypes.includes(fileType)) {
    return { valid: false, error: "File format is not supported" }
  }

  const parts = file.name.split('.')
  const ext = parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
  if (!constraints.allowedExtensions.includes(ext)) {
    return { valid: false, error: "File extension does not match allowed types" }
  }

  return { valid: true }
}

/**
 * Sanitizes text to prevent control character injection while preserving safe content
 */
export function sanitizeText(text: string, maxLength = 2000): string {
  if (!text) return ''
  return text
    // Remove ASCII control characters except newline and tab
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .slice(0, maxLength)
    .trim()
}

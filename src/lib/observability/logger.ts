/**
 * Production Structured Logger & Observability Utility for Trackr.
 * Automatically redacts sensitive fields (tokens, secrets, credentials).
 */

type LogLevel = 'info' | 'warn' | 'error' | 'security'

const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'access_token',
  'refresh_token',
  'service_role_key',
  'supabase_service_role_key',
  'admin_secret_key'
])

function sanitizeLogData(data: unknown, depth = 0): unknown {
  if (depth > 4) return '[Max Depth]'
  if (!data || typeof data !== 'object') return data

  if (Array.isArray(data)) {
    return data.map(item => sanitizeLogData(item, depth + 1))
  }

  const sanitized: Record<string, unknown> = {}
  for (const [key, val] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizeLogData(val, depth + 1)
    } else {
      sanitized[key] = val
    }
  }
  return sanitized
}

function formatLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const timestamp = new Date().toISOString()
  const payload = {
    timestamp,
    level,
    message,
    ...(meta ? { meta: sanitizeLogData(meta) } : {})
  }

  const jsonStr = JSON.stringify(payload)

  switch (level) {
    case 'error':
    case 'security':
      console.error(jsonStr)
      break
    case 'warn':
      console.warn(jsonStr)
      break
    default:
      if (process.env.NODE_ENV !== 'production') {
        console.log(jsonStr)
      }
      break
  }
}

export const logger = {
  info: (msg: string, meta?: Record<string, unknown>) => formatLog('info', msg, meta),
  warn: (msg: string, meta?: Record<string, unknown>) => formatLog('warn', msg, meta),
  error: (msg: string, meta?: Record<string, unknown>) => formatLog('error', msg, meta),
  security: (msg: string, meta?: Record<string, unknown>) => formatLog('security', `[SECURITY ALERT] ${msg}`, meta),

  /**
   * Measures async function execution duration and logs if exceeding threshold
   */
  measure: async <T>(name: string, fn: () => Promise<T>, slowThresholdMs = 800): Promise<T> => {
    const start = Date.now()
    try {
      const res = await fn()
      const duration = Date.now() - start
      if (duration > slowThresholdMs) {
        formatLog('warn', `Slow operation detected: ${name}`, { durationMs: duration, thresholdMs: slowThresholdMs })
      }
      return res
    } catch (err: any) {
      const duration = Date.now() - start
      formatLog('error', `Operation failed: ${name}`, { durationMs: duration, error: err?.message || 'Unknown error' })
      throw err
    }
  }
}

export function getUserHandle(fullName?: string | null): string {
  if (!fullName) return '@student'
  const clean = fullName.trim()
  if (clean.toLowerCase().includes('samir')) return '@samCPer'
  // Clean handle without duplicate underscores or special characters
  const handle = clean.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  return `@${handle || 'student'}`
}

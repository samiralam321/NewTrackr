# TRACKR — SECURITY ARCHITECTURE & HARDENING SPECIFICATION

## 1. Authentication Architecture

Trackr utilizes **Supabase Authentication** backed by JSON Web Tokens (JWT) stored in HTTP-accessible, partitioned cookies with 30-day persistence (`maxAge: 30 * 24 * 60 * 60`, `sameSite: 'lax'`, `path: '/'`, `secure: true` in production).

### Session Validation Flow
1. **Edge Middleware (`src/proxy.ts` -> `updateSession`)**:
   - Inspects incoming cookies on all requests matching `/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.webmanifest)...)`.
   - Identifies and strips corrupted or legacy URL-encoded session cookies (`sb-${ref}-auth-token`) to prevent GoTrueClient `TypeError` crashes.
   - Refreshes expired sessions transparently via `@supabase/ssr`.
   - Unauthenticated access to protected routes (e.g., `/dashboard`, `/messages`, `/notifications`, `/saved`) triggers an automatic redirect to `/auth`.
2. **Server-Side Validation**:
   - Server Components and API Route Handlers invoke `const { data: { user } } = await supabase.auth.getUser()`.
   - The user context is extracted cryptographically from the verified JWT, **never** trusting client-supplied user IDs from request bodies or parameters.

---

## 2. PostgreSQL Row Level Security (RLS) Matrix

Every public table in Trackr has Row Level Security enabled (`alter table ... enable row level security`). Authorization is enforced at the database boundary:

| Table | SELECT Policy | INSERT Policy | UPDATE Policy | DELETE Policy |
|---|---|---|---|---|
| `profiles` | `true` (Publicly readable) | `auth.uid() = id` | `auth.uid() = id` | Prohibited via CASCADE on `auth.users` |
| `posts` | `true` (Publicly readable) | `auth.uid() = user_id` | `auth.uid() = user_id` | `auth.uid() = user_id` |
| `comments` | `true` (Publicly readable) | `auth.uid() = user_id` | Prohibited | `auth.uid() = user_id` |
| `likes` | `true` (Publicly readable) | `auth.uid() = user_id` | N/A | `auth.uid() = user_id` |
| `bookmarks` | `auth.uid() = user_id` (Private) | `auth.uid() = user_id` | N/A | `auth.uid() = user_id` |
| `follows` | `true` (Publicly readable) | `auth.uid() = follower_id` | N/A | `auth.uid() = follower_id` |
| `messages` | `auth.uid() = sender_id OR auth.uid() = receiver_id` | `auth.uid() = sender_id` | `auth.uid() = receiver_id` (Mark read) | Prohibited |
| `notifications` | `auth.uid() = user_id` (Recipient only) | Authenticated trigger / verified client | `auth.uid() = user_id` (Mark read) | Prohibited |
| `daily_challenges` | `true` (Public) | Service role only | Service role only | Service role only |
| `questions` | `true` (Public) | Service role only | Service role only | Service role only |

---

## 3. API Security & Input Validation

### Administrative Endpoints
- Administrative endpoints (`/api/admin/generate-challenges`, `/api/opportunities/sync`) require an authorization token provided via `Authorization: Bearer <token>`.
- Token comparison is performed in **constant time** using Node.js `crypto.timingSafeEqual` to prevent side-channel timing attacks (`src/lib/security/api-security.ts`).
- Generic error messages are returned on failure; internal database errors, schema details, or stack traces are never exposed to clients.

### Public API Validation
- `/api/opportunities` enforces strict type checking and range limits using Zod:
  - `page`: integer $\ge 1$, max 1000.
  - `limit`: integer bounded between 1 and 50 (prevents unbounded memory consumption).
  - `search`: string truncated to 100 characters with control characters stripped.
  - `category`, `mode`, `location`, `sort`: validated against allowed enum values.

---

## 4. Storage & File Upload Security

Supabase Storage buckets (`avatars`, `post_images`, `resumes`) are protected by multi-tier client and server safeguards:

1. **Client-Side File Inspection**:
   - `validateFileSecurity()` inspects the real browser `File` object before upload:
     - **Size Constraints**: Strictly $\le 5\text{MB}$ limit enforced on all uploads.
     - **MIME Type Allowlist**:
       - Images: `image/jpeg`, `image/png`, `image/webp`.
       - Resumes: `application/pdf`, `application/msword`, `application/vnd.openxmlformats-officedocument.wordprocessingml.document`.
     - **Extension Verification**: Dual-checked against allowed extensions (`jpg, jpeg, png, webp, pdf, doc, docx`).
2. **User Namespace Partitioning**:
   - Upload target paths follow collision-proof naming: `${user.id}-${timestamp}.${ext}` or `${user.id}-resume-${timestamp}.${ext}`.
   - Prevents path traversal (`../`) and prevents unauthorized users from overwriting files belonging to other students.

---

## 5. XSS, Injection & Content Security Policy (CSP)

### Safe Content Rendering
- User-generated post and comment text is rendered through `RichTextRenderer` (`src/components/ui/rich-text-renderer.tsx`).
- Automatic URL linkification parses `http://`, `https://`, and `www.` addresses while strictly rejecting dangerous pseudo-schemes:
  - `javascript:` URLs are sanitized and rendered as non-clickable plain text.
  - `data:` URLs are sanitized and neutralized.
- Outbound hyperlinks include `target="_blank"` and `rel="noopener noreferrer"` to prevent tab-nabbing attacks.

### HTTP Security Headers
Configured in `next.config.ts` for all route patterns (`/:path*`):

```http
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=(), browsing-topics=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://*.supabase.co https://ui-avatars.com https://images.unsplash.com https://*.githubusercontent.com https://*.googleusercontent.com; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.vercel.app; frame-ancestors 'self'; base-uri 'self'; form-action 'self'
```

---

## 6. Secrets & Environment Variable Hygiene

- **Public Variables**: Only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are exposed with the `NEXT_PUBLIC_` prefix.
- **Server Secrets**: `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET_KEY`, and `CRON_SECRET` are strictly kept server-side and never bundled into client scripts.
- **Git Protection**: `.env*` files are ignored in `.gitignore`. A comprehensive `.env.example` file is provided with safe placeholder documentation.
- **Log Sanitation**: `src/lib/observability/logger.ts` automatically redacts sensitive keys (`password, token, secret, authorization, cookie, key`) before emitting log output.

---

## 7. Security Audit Checklist

- [x] RLS enabled on 100% of public database tables.
- [x] Client cannot forge `user_id` on post, like, comment, or bookmark mutations.
- [x] Private direct messages accessible only to verified sender and recipient.
- [x] Constant-time token verification for administrative routes.
- [x] File upload size ($\le 5\text{MB}$) and MIME format validated on all upload components.
- [x] Anti-XSS URL filtering prevents `javascript:` protocol execution.
- [x] Global Content Security Policy and security headers active on Next.js responses.
- [x] No server secrets or service-role keys committed to source control.

# AdPilot Security Audit Report

**Date:** 2026-04-03
**Auditor:** Automated (Claude Code)
**Scope:** Full application security audit of HallyAus/aimarketing

---

## Summary Statistics

| Severity | Found | Fixed | Documented |
|----------|-------|-------|------------|
| CRITICAL | 2     | 2     | 0          |
| HIGH     | 4     | 4     | 0          |
| MEDIUM   | 5     | 0     | 5          |
| LOW      | 4     | 0     | 4          |
| **Total** | **15** | **6** | **9**    |

---

## Findings

### CRITICAL

| ID | Description | File | Line | Status |
|----|-------------|------|------|--------|
| SEC-001 | Signup endpoint leaks email existence via 409 response | `apps/web/src/app/api/auth/signup/route.ts` | 54-57 | **FIXED** |
| SEC-002 | Password reset token logged to console when RESEND_API_KEY not configured | `apps/web/src/app/api/auth/forgot-password/route.ts` | 61 | **FIXED** |

#### SEC-001: Email Enumeration via Signup Endpoint
**Before:** The signup endpoint returned HTTP 409 with "An account with this email already exists" when a duplicate email was submitted.
**Risk:** Allows attackers to enumerate valid email addresses.
**Fix:** Changed to return HTTP 201 with a generic message ("If this email is available, your account has been created. Please try signing in.") for both existing and new accounts.

#### SEC-002: Password Reset Token Logged to Console
**Before:** When `RESEND_API_KEY` was not configured, the password reset token was logged via `console.warn` with the full token value.
**Risk:** Anyone with access to server logs could hijack password resets.
**Fix:** Removed the token from the log message. Now only logs a warning that the API key is not configured.

---

### HIGH

| ID | Description | File | Line | Status |
|----|-------------|------|------|--------|
| SEC-003 | RSS feed API routes lack Zod validation | `apps/web/src/app/api/rss/route.ts` | 25-67 | **FIXED** |
| SEC-004 | UTM link API routes lack Zod validation | `apps/web/src/app/api/utm/route.ts` | 33-62 | **FIXED** |
| SEC-005 | Webhook rules API routes lack Zod validation | `apps/web/src/app/api/webhooks/rules/route.ts` | 26-71 | **FIXED** |
| SEC-006 | Publish-now route uses manual validation instead of Zod | `apps/web/src/app/api/posts/publish-now/route.ts` | 27-41 | **FIXED** |

#### SEC-003 through SEC-006: Missing Zod Input Validation
**Before:** POST/PATCH handlers directly destructured `req.json()` without schema validation, accepting arbitrary fields and types.
**Risk:** Type confusion, unexpected field injection, potential data corruption.
**Fix:** Created proper Zod schemas in `packages/shared/src/validators.ts` (`createRssFeedSchema`, `updateRssFeedSchema`, `createUtmLinkSchema`, `createWebhookRuleSchema`, `updateWebhookRuleSchema`, `publishNowSchema`) and integrated them into each route handler.

---

### MEDIUM

| ID | Description | File | Line | Status |
|----|-------------|------|------|--------|
| SEC-007 | NextAuth Account model stores OAuth tokens unencrypted | `packages/db/prisma/schema.prisma` | 263-264 | DOCUMENTED |
| SEC-008 | In-memory rate limiter does not persist across instances | `apps/web/src/lib/rate-limit.ts` | 1-61 | DOCUMENTED |
| SEC-009 | Facebook pages POST endpoint lacks Zod schema | `apps/web/src/app/api/platforms/facebook/pages/route.ts` | 110-125 | DOCUMENTED |
| SEC-010 | Posts schedule endpoint uses manual validation, not Zod | `apps/web/src/app/api/posts/schedule/route.ts` | 46-86 | DOCUMENTED |
| SEC-011 | CSP allows unsafe-inline for scripts | `apps/web/next.config.ts` | 22 | DOCUMENTED |

#### SEC-007: NextAuth Account Model Stores Tokens Unencrypted
The NextAuth `Account` model stores `access_token` and `refresh_token` as plain strings. The custom `PlatformConnection` and `Page` models correctly encrypt tokens at the application level using AES-256-GCM, but the standard NextAuth Account model (used for OAuth sign-in providers like Google/Microsoft) does not.
**Recommendation:** Add application-level encryption to NextAuth Account adapter or use a custom adapter that encrypts tokens before storage.

#### SEC-008: In-Memory Rate Limiter
The rate limiter uses an in-memory Map, which does not persist across serverless function instances or multi-pod deployments. Under high load with multiple instances, rate limits could be bypassed.
**Recommendation:** Migrate to Redis-backed rate limiting (e.g., `rate-limiter-flexible` with Redis store) for production deployments.

#### SEC-009: Facebook Pages POST Lacks Zod Schema
The POST handler at `/api/platforms/facebook/pages` manually checks for `selectedPages` array but does not validate individual page object shapes with Zod.
**Recommendation:** Add a Zod schema for the selectedPages array items.

#### SEC-010: Posts Schedule Manual Validation
The `/api/posts/schedule` endpoint uses manual if-checks instead of Zod for validation. While the validation is thorough, Zod would provide consistent error formatting and type safety.
**Recommendation:** Migrate to a Zod schema.

#### SEC-011: CSP Allows unsafe-inline for Scripts
The Content-Security-Policy includes `'unsafe-inline'` in the `script-src` directive, which weakens XSS protection. This is common for Next.js apps that inject inline scripts for hydration.
**Recommendation:** Use nonce-based CSP with `next/headers` for stricter protection when Next.js supports it natively.

---

### LOW

| ID | Description | File | Line | Status |
|----|-------------|------|------|--------|
| SEC-012 | CI workflow uses hardcoded placeholder secret | `.github/workflows/ci.yml` | 128 | DOCUMENTED |
| SEC-013 | $executeRawUnsafe used in test factory | `apps/web/tests/factories/index.ts` | 203 | DOCUMENTED |
| SEC-014 | Token revocation error logged with potential context | `apps/web/src/app/api/platforms/[platform]/disconnect/route.ts` | 28 | DOCUMENTED |
| SEC-015 | No CSRF token on state-changing form actions | General | - | DOCUMENTED |

#### SEC-012: CI Placeholder Secret
The GitHub Actions CI workflow uses `NEXTAUTH_SECRET: "ci-build-secret"` for build-time type checking. This is a common pattern and not a production risk since the value is only used in CI.
**Recommendation:** No action needed, but consider using GitHub Actions secrets for consistency.

#### SEC-013: executeRawUnsafe in Test Factory
The test factory file uses `$executeRawUnsafe` for TRUNCATE operations. This is test-only code and not reachable in production.
**Recommendation:** No action needed. The usage is safe (static SQL, no user input).

#### SEC-014: Token Revocation Error Logging
The disconnect route logs the full error object when token revocation fails, which could include token-related context in error messages from the platform.
**Recommendation:** Log only the error message, not the full error object.

#### SEC-015: No CSRF Protection for Form Actions
Next.js server actions and API routes rely on SameSite cookies for CSRF protection. The session uses JWT strategy with HttpOnly cookies (via NextAuth defaults). This is generally sufficient but could be strengthened with explicit CSRF tokens for high-risk operations.
**Recommendation:** Consider adding CSRF tokens for critical mutations (org deletion, billing changes).

---

## Positive Findings

The following security best practices are already implemented:

1. **Password hashing**: bcrypt with cost factor 12 used consistently across all 6 hashing locations
2. **OAuth token encryption**: AES-256-GCM with random IV via `packages/shared/src/encryption.ts` for PlatformConnection and Page models
3. **Org-scoped queries**: All IDOR-vulnerable routes properly scope queries with `orgId` from the session (verified: campaigns, posts, creatives, templates, analytics, organizations, members, pages, RSS, UTM, webhooks)
4. **Role-based access control**: `withRole()` middleware enforces RBAC hierarchy (VIEWER < EDITOR < ADMIN < OWNER) on all protected routes
5. **Security headers**: HSTS, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy, Permissions-Policy, CSP all configured in `next.config.ts`
6. **API rate limiting**: Both auth endpoints (20/min) and API endpoints (100/min) are rate-limited via middleware
7. **No-store cache control**: API routes return `Cache-Control: no-store` via next.config.ts headers
8. **Password reset anti-enumeration**: Forgot-password endpoint returns success regardless of email existence
9. **Token not in responses**: Page and connection API responses exclude `accessToken` fields via Prisma `select`
10. **Input sanitization**: `sanitizeHtml()` applied to user-provided content (post content, campaign names, template content)
11. **Admin route protection**: Middleware enforces `ADMIN`/`SUPER_ADMIN` systemRole for all `/admin` and `/api/admin` routes
12. **HTTPS enforcement**: HSTS with preload, 1-year max-age, includeSubDomains
13. **No hardcoded secrets**: No API keys, tokens, or passwords found in source code (only CI placeholder and test fixtures)
14. **`.env` files gitignored**: `.env`, `.env.local`, `.env.*.local` all in `.gitignore`
15. **No NEXT_PUBLIC_ prefix on secrets**: No server secrets exposed via NEXT_PUBLIC_ environment variables
16. **OAuth state CSRF protection**: OAuth callback validates encrypted state cookie with PKCE code verifier
17. **Zod validation on critical auth routes**: signup, reset-password, forgot-password all use Zod schemas
18. **No SQL injection risk**: No `$queryRawUnsafe` or `$executeRawUnsafe` in production code
19. **Safe dangerouslySetInnerHTML usage**: Only used for JSON-LD structured data via `JSON.stringify()` (no user input)
20. **Webhook signature verification**: Webhook events track `signature` and `verified` fields

---

## Files Modified

| File | Change |
|------|--------|
| `apps/web/src/app/api/auth/signup/route.ts` | Prevent email enumeration on signup |
| `apps/web/src/app/api/auth/forgot-password/route.ts` | Remove token from console log |
| `packages/shared/src/validators.ts` | Add 7 new Zod schemas for RSS, UTM, webhook, publish-now |
| `apps/web/src/app/api/rss/route.ts` | Add Zod validation to POST/PATCH |
| `apps/web/src/app/api/utm/route.ts` | Add Zod validation to POST |
| `apps/web/src/app/api/webhooks/rules/route.ts` | Add Zod validation to POST/PATCH |
| `apps/web/src/app/api/posts/publish-now/route.ts` | Replace manual validation with Zod schema |

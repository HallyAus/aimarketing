# ReachPilot — Audit 1: Security & Penetration

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Do not ask questions — find vulnerabilities, fix them, commit, move on.

---

## CONTEXT

You are performing a security audit and penetration test of **ReachPilot**, an AI-powered marketing automation SaaS. The platform stores OAuth tokens for 9 social media platforms, processes Stripe payments, handles AI content generation via the Anthropic API, and serves multiple tenants (organisations) from a shared database.

**Stack:** Next.js 15 App Router, Prisma, PostgreSQL, Redis, BullMQ, Stripe, Vercel.
**Repo:** `HallyAus/aimarketing`

A security failure here means: one customer reads another's data, an attacker harvests social media tokens, payment data leaks, or AI endpoints get abused.

**Output:** Create `docs/security/SECURITY-AUDIT.md` with every finding, severity rating (CRITICAL/HIGH/MEDIUM/LOW), and fix status. Fix every CRITICAL and HIGH issue directly. Document MEDIUM and LOW issues with recommended fixes.

---

## PHASE 1: SECRETS & ENVIRONMENT

### 1.1 — Hardcoded Secrets Scan

```bash
# Search for API keys, tokens, passwords in source code
grep -rn "sk-ant-\|sk_live_\|sk_test_\|whsec_\|re_\|Bearer \|password\s*[:=]\s*['\"]" \
  --include="*.ts" --include="*.tsx" --include="*.js" --include="*.json" \
  src/ prisma/ 2>/dev/null | grep -v node_modules | grep -v "process\.env" | grep -v "test\|mock\|fake\|example\|placeholder"

# Check for .env files in git
git ls-files --cached | grep -E "\.env"

# Verify .gitignore
cat .gitignore | grep -E "env"
```

**Fix any finding immediately.** Rotate any key that was ever committed to git history.

### 1.2 — Environment Variable Audit

- Verify NO secret uses the `NEXT_PUBLIC_` prefix (this exposes it to the client bundle)
- Verify every secret is accessed via `process.env.VARIABLE_NAME` server-side only
- Create/verify `.env.example` lists every required variable with descriptions but no values
- Check Vercel environment configuration: are production secrets separated from preview/development?

### 1.3 — Dependency Vulnerabilities

```bash
npm audit
npm audit --audit-level=critical
```

- Fix ALL critical and high vulnerabilities
- Document any unfixable vulnerabilities with justification
- Check for known CVEs in: Next.js version, Prisma version, BullMQ version, ioredis version
- Check if any dependency is abandoned (no updates in 12+ months)

---

## PHASE 2: AUTHENTICATION & SESSION MANAGEMENT

### 2.1 — Session Security

For every session implementation (cookies, JWTs, database sessions), verify:

- [ ] Session cookie flags: `httpOnly: true`, `secure: true`, `sameSite: 'lax'` or `'strict'`
- [ ] Session token is cryptographically random (min 128 bits of entropy)
- [ ] Sessions expire (customer: 24-72 hours, admin: 8 hours max)
- [ ] Sessions are invalidated on: logout, password change, email change, account suspension
- [ ] Session token is rotated after authentication (prevent session fixation)
- [ ] Old sessions are cleaned up (expired sessions deleted from DB)
- [ ] Concurrent session limit (optional but recommended: max 5 active sessions per user)

### 2.2 — Password Security

- [ ] Passwords hashed with bcrypt (cost 12+) or argon2
- [ ] NEVER logged, even partially
- [ ] Minimum 8 characters enforced at validation layer
- [ ] Password reset tokens: single-use, expire in 1 hour, cryptographically random
- [ ] Password reset does not reveal whether email exists (same response for known/unknown emails)

### 2.3 — Brute Force Protection

- [ ] Login: max 5 attempts per 15 minutes per IP
- [ ] Login: max 10 attempts per hour per email
- [ ] Signup: max 10 per hour per IP
- [ ] Password reset: max 3 per hour per email
- [ ] Admin login: max 3 attempts per 15 minutes per IP
- [ ] All rate limit responses return 429 with `Retry-After` header
- [ ] Rate limiting uses `x-forwarded-for` correctly behind Vercel's proxy

---

## PHASE 3: AUTHORIZATION & ACCESS CONTROL

### 3.1 — IDOR (Insecure Direct Object Reference)

**For EVERY route with a dynamic `[id]` parameter, verify the handler checks ownership.**

```bash
# Find all dynamic routes
find src/app -name "[*" -type d | sort
```

For each:
- Does the handler verify the resource belongs to the authenticated user's org?
- Can a user access the resource by guessing/enumerating the UUID?
- Is the ownership check BEFORE the database query (to prevent timing attacks)?

**Pattern every route MUST follow:**
```typescript
const resource = await prisma.post.findFirst({
  where: {
    id: params.id,
    orgId: currentUser.orgId,  // MUST be present
  },
});
if (!resource) return notFound(); // 404, not 403 (prevents enumeration)
```

### 3.2 — Privilege Escalation

- [ ] Regular users cannot access `/admin/*` routes
- [ ] Regular users cannot call `/api/admin/*` endpoints
- [ ] ORG MEMBER cannot perform ORG ADMIN actions (changing billing, inviting members, changing org settings)
- [ ] ORG ADMIN cannot perform SUPER_ADMIN actions (impersonation, system settings)
- [ ] A user cannot change their own role via API (role changes require admin action)
- [ ] `OrgMember.role` changes are validated server-side (user can't POST `role: "OWNER"`)

### 3.3 — Multi-Tenancy Isolation

Scan EVERY Prisma query in the codebase:

```bash
grep -rn "prisma\." src/ --include="*.ts" --include="*.tsx" \
  | grep -E "\.(findMany|findFirst|findUnique|update|delete|updateMany|deleteMany|aggregate|count)" \
  > /tmp/all-queries.txt
```

For each query on a tenant-scoped model (Post, ConnectedAccount, Campaign, Team, etc.):
- Does it filter by `orgId` or `accountId`?
- If not, can Tenant A's data leak to Tenant B?
- Document EVERY violation with file path, line number, and fix

---

## PHASE 4: INPUT VALIDATION & INJECTION

### 4.1 — Input Validation

For EVERY API route and server action that accepts user input:

- [ ] Request body validated with Zod (not just type assertions)
- [ ] String inputs have max length (prevent megabyte payloads)
- [ ] UUIDs validated as UUID format before passing to Prisma
- [ ] Enum values validated against whitelist
- [ ] Numeric inputs have min/max bounds
- [ ] Date inputs validated as ISO 8601
- [ ] File uploads (if any): type whitelist, size limit, malware scanning
- [ ] Array inputs have max length

### 4.2 — SQL Injection

```bash
grep -rn "\$queryRaw\|\$executeRaw" src/ --include="*.ts" --include="*.tsx"
```

- `$queryRawUnsafe` or `$executeRawUnsafe` → **CRITICAL.** Replace with parameterized `$queryRaw` using `Prisma.sql` tagged templates. No exceptions.
- Even in `$queryRaw`, verify no string interpolation of user input
- Check for any ORM bypass patterns

### 4.3 — XSS (Cross-Site Scripting)

```bash
grep -rn "dangerouslySetInnerHTML" src/ --include="*.tsx" --include="*.ts"
grep -rn "innerHTML" src/ --include="*.tsx" --include="*.ts"
```

- Any `dangerouslySetInnerHTML`: is the content sanitized? (DOMPurify or similar)
- User-generated content (post content, campaign names, org names): always rendered via React's built-in escaping, never `innerHTML`
- Markdown rendering: uses a sanitizing renderer (e.g., `remark` with `rehype-sanitize`)
- Rich text / HTML emails: sanitized before rendering in any admin preview

### 4.4 — SSRF (Server-Side Request Forgery)

If any endpoint accepts URLs from users (webhook URLs, media URLs, avatar URLs):
- Validate URL scheme (only `https://`, never `file://`, `ftp://`, `gopher://`)
- Block requests to internal IPs (10.x, 172.16-31.x, 192.168.x, 127.x, 169.254.x, `localhost`)
- Block requests to metadata endpoints (169.254.169.254 on cloud providers)
- Set timeouts on outbound requests (max 10 seconds)

### 4.5 — CSRF (Cross-Site Request Forgery)

- [ ] All state-changing endpoints (POST/PUT/PATCH/DELETE) verify the request origin
- [ ] If using cookies for auth: implement CSRF tokens on forms, or use `sameSite: 'strict'` cookies
- [ ] API routes check `Origin` or `Referer` header matches the app's domain
- [ ] Stripe webhook endpoint is exempt from CSRF checks (uses signature verification instead)

---

## PHASE 5: OAUTH TOKEN SECURITY

### 5.1 — Token Storage

- [ ] Access tokens and refresh tokens are encrypted at rest in the database (not stored as plaintext)
- [ ] Encryption uses AES-256-GCM or similar authenticated encryption
- [ ] Encryption key is stored in environment variables, NOT in the database or code
- [ ] Separate encryption keys per environment (dev/staging/prod)

If tokens are stored as plaintext:
**FIX IMMEDIATELY.** Create an encryption module:
```typescript
// src/lib/encryption.ts
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.TOKEN_ENCRYPTION_KEY!, 'hex'); // 32 bytes

export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

export function decrypt(ciphertext: string): string {
  const [ivHex, tagHex, encrypted] = ciphertext.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
```

Migrate all existing plaintext tokens to encrypted format.

### 5.2 — Token Exposure

- [ ] Access tokens are NEVER included in API responses to the frontend
- [ ] Access tokens are NEVER logged (check all logger calls)
- [ ] Access tokens are NEVER included in error messages or stack traces
- [ ] Admin dashboard shows token status (healthy/expired) but NEVER the token value

---

## PHASE 6: STRIPE SECURITY

- [ ] Webhook endpoint verifies Stripe signature on EVERY request (not just some paths)
- [ ] Webhook handler rejects invalid signatures with 400 (not 500)
- [ ] Webhook processing is idempotent (same event processed twice produces same result)
- [ ] Stripe secret key is never exposed to the client
- [ ] All Stripe API calls use `idempotency_key` for write operations
- [ ] Billing portal sessions are generated server-side, not client-side
- [ ] Subscription tier checks happen server-side (client-side checks can be bypassed)

---

## PHASE 7: SECURITY HEADERS

Verify in `next.config.js`:

```javascript
{
  source: '/(.*)',
  headers: [
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
    { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
    { key: 'Content-Security-Policy', value: '...' }, // see below
  ],
}
```

**CSP must restrict:**
- `default-src 'self'`
- `script-src 'self'` (add `'unsafe-inline'` only if required by Next.js)
- `connect-src 'self' https://api.stripe.com https://api.anthropic.com` (and social platform APIs)
- `frame-src https://js.stripe.com` (Stripe Elements)
- `img-src 'self' data: https:` (for user-uploaded media)

---

## PHASE 8: API SECURITY

- [ ] All API routes have rate limiting appropriate to their function
- [ ] API responses never include: `passwordHash`, `accessToken`, `refreshToken`, `stripeCustomerId`, `keyHash`
- [ ] Error responses never include: stack traces, file paths, SQL queries, internal error details
- [ ] Request body size limited to 2MB (or appropriate per-route limit)
- [ ] CORS configured restrictively (same-origin for web, specific origins for API consumers)
- [ ] API keys (for external API access) use bcrypt-hashed storage, not plaintext
- [ ] Webhook endpoints from external services (Stripe, social platforms) verify signatures

---

## EXECUTION RULES

1. **Fix CRITICAL and HIGH issues immediately.** Don't just document — fix and commit.
2. **Commit after each fix.** Use `security:` prefix in commit messages.
3. **Document everything** in `docs/security/SECURITY-AUDIT.md` with severity ratings.
4. **Test after every fix.** Run `npm run build` to verify no regressions.
5. **Never weaken security for convenience.** If a fix breaks functionality, note it — but don't skip the fix.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)

🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — ReachPilot / Agentic Consciousness — April 2026*

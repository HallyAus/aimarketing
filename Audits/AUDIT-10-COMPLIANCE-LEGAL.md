# ReachPilot — Audit 10: Compliance & Legal

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Implement compliance features, create policy pages, commit, move on.

---

## CONTEXT

ReachPilot is a global SaaS handling user data, social media credentials, and payment information. Multiple regulations apply: GDPR (EU), CCPA (California), Australian Privacy Act, and platform-specific Terms of Service. This audit ensures technical compliance and creates the required policy infrastructure.

**Important:** Claude Code is not a lawyer. This audit implements technical compliance controls and creates policy page templates. The actual legal text should be reviewed by a qualified legal professional before going live. Mark all generated legal text as `[DRAFT — REQUIRES LEGAL REVIEW]`.

**Output:** `docs/compliance/COMPLIANCE-AUDIT.md`, updated policy pages, and technical compliance features.

---

## PHASE 1: DATA RIGHTS (GDPR + CCPA)

### 1.1 — Right to Access (Data Export)

Users must be able to download ALL their data. Build a data export feature:

Create `POST /api/account/export`:
- Authenticated endpoint, rate-limited (1 export per 24 hours)
- Queues a BullMQ job that:
  1. Collects all user data: profile, org membership, posts, analytics, connected accounts (without tokens), campaigns, audit logs
  2. Formats as JSON (machine-readable) and optionally CSV
  3. Packages into a ZIP file
  4. Stores in temporary storage (signed URL, expires in 72 hours)
  5. Sends email to the user with download link
- Show in user settings: "Export My Data" button with status indicator

### 1.2 — Right to Erasure (Account Deletion)

Users must be able to delete ALL their data. Build an account deletion flow:

Create `/settings/account/delete` page:
1. Confirmation step: "This will permanently delete your account and all associated data. This cannot be undone."
2. Require password re-entry
3. Show what will be deleted: profile, posts, analytics, connected accounts, team memberships
4. Show what will NOT be deleted: invoices (required for tax records, anonymized), audit logs older than 30 days (anonymized)
5. On confirmation: queue deletion job

Create `POST /api/account/delete`:
- Queue a BullMQ job that:
  1. Revokes all OAuth tokens on platforms
  2. Cancels Stripe subscription
  3. Deletes all posts, campaigns, connected accounts
  4. Anonymizes audit log entries (replace user ID/email with "deleted-user-{hash}")
  5. Anonymizes invoice records (keep amount/date for accounting, remove PII)
  6. Removes user from all orgs/teams
  7. Hard-deletes the User record
  8. Sends confirmation email: "Your account has been deleted"
- Grace period: 7-day cooling-off period before hard deletion. User can reactivate by logging in during this window.
- Admin notification: log the deletion in the admin audit log

### 1.3 — Right to Rectification

Users can already edit their profile. Verify:
- [ ] Name, email, timezone, locale are all editable in settings
- [ ] Changes are reflected across the entire app immediately (no stale caches)
- [ ] Email changes require re-verification

### 1.4 — Data Portability

The data export (1.1) satisfies this. Ensure the export format is:
- JSON (machine-readable)
- Includes all user-generated content (posts, campaigns)
- Does NOT include platform data that belongs to the social networks (engagement metrics are retained as they were collected by ReachPilot)

---

## PHASE 2: CONSENT MANAGEMENT

### 2.1 — Cookie Consent

Create a cookie consent banner component:

```typescript
// src/components/cookie-consent.tsx
// Shows on first visit, remembers choice in localStorage
// Options: "Accept All", "Essential Only", "Customize"
// Essential: session cookies, CSRF tokens (always on, not toggleable)
// Analytics: Vercel Analytics, usage tracking (optional)
// Marketing: tracking pixels, third-party embeds (optional)
```

- Banner must appear BEFORE any non-essential cookies are set (GDPR requirement)
- Store preference in a cookie: `reachpilot_consent={essential:true,analytics:false,marketing:false}`
- If consent not given: do NOT load Vercel Analytics, Google Analytics, or any tracking
- Consent must be revocable: add "Cookie Preferences" link in footer

### 2.2 — Terms Acceptance

- On signup: checkbox "I agree to the [Terms of Service] and [Privacy Policy]" (required)
- Store `termsAcceptedAt: DateTime` and `termsVersion: String` on the User model
- When terms are updated: show a banner to existing users asking them to accept the new version
- Block app access until new terms are accepted (with option to delete account)

---

## PHASE 3: PRIVACY POLICY PAGE

Create/update `/privacy` page with comprehensive content:

**Required sections:**
1. **What we collect:** personal info (name, email), social media data (via OAuth), usage data, payment data (via Stripe), AI-generated content data
2. **How we collect it:** directly from users, via OAuth from social platforms, automatically (cookies, analytics)
3. **Why we collect it:** to provide the service, to process payments, to improve the product, to send transactional emails
4. **Who we share it with:** list all subprocessors (see Phase 5)
5. **Data retention:** how long each data type is kept, what happens after account deletion
6. **Your rights:** access, rectification, erasure, portability, objection, restriction (GDPR), "Do Not Sell" (CCPA)
7. **International transfers:** data processed by Vercel (US), Stripe (US), Anthropic (US), social platforms (various)
8. **Security:** encryption, access controls, incident response
9. **Children:** no data collected from under-16s
10. **Contact:** data protection officer email, complaint procedure
11. **Changes:** how users are notified of policy updates

Mark every section: `[DRAFT — REQUIRES LEGAL REVIEW]`

---

## PHASE 4: TERMS OF SERVICE PAGE

Create/update `/terms` page with comprehensive content:

**Required sections:**
1. **Service description:** what ReachPilot is and does
2. **Account terms:** registration, accuracy of information, account security
3. **Acceptable use:** prohibited content, prohibited behavior, platform ToS compliance
4. **Subscription & billing:** payment terms, automatic renewal, price changes, refund policy
5. **Cancellation:** how to cancel, what happens to data, refund eligibility
6. **Intellectual property:** user owns their content, ReachPilot owns the platform, AI-generated content ownership (user owns it, but with a license for ReachPilot to process it)
7. **AI-generated content disclaimer:** content is generated by AI and should be reviewed before publishing; ReachPilot is not responsible for AI-generated content that violates platform ToS or laws
8. **Third-party platforms:** ReachPilot connects to third-party platforms but is not responsible for their outages, API changes, or policy changes
9. **Limitation of liability:** standard SaaS limitations
10. **Uptime commitment:** target uptime (99.9%), what constitutes a service credit
11. **Governing law:** jurisdiction
12. **Dispute resolution:** procedure
13. **Changes:** how users are notified of terms updates

Mark every section: `[DRAFT — REQUIRES LEGAL REVIEW]`

---

## PHASE 5: SUBPROCESSOR LIST

Create `/privacy/subprocessors` or include in the privacy policy:

| Subprocessor | Purpose | Data Processed | Location |
|-------------|---------|----------------|----------|
| Vercel | Hosting, edge functions | All app data in transit | US (global edge) |
| PostgreSQL (provider) | Database | All stored data | [depends on provider] |
| Redis (provider) | Caching, job queues | Cached data, job payloads | [depends on provider] |
| Stripe | Payment processing | Billing info, email, subscription data | US |
| Anthropic | AI content generation | Post content, prompts | US |
| Resend | Transactional email | Email addresses, email content | US |
| Facebook/Meta | Social publishing | Post content, page data, analytics | US |
| Instagram (Meta) | Social publishing | Post content, analytics | US |
| TikTok (ByteDance) | Social publishing | Post content, analytics | US/Singapore |
| LinkedIn (Microsoft) | Social publishing | Post content, analytics | US |
| Twitter/X | Social publishing | Post content, analytics | US |
| YouTube (Google) | Social publishing | Video content, analytics | US |
| Pinterest | Social publishing | Post content, analytics | US |
| Snapchat | Social advertising | Ad content, analytics | US |
| Google Ads | Advertising | Ad content, analytics | US |

---

## PHASE 6: PLATFORM ToS COMPLIANCE

For each social platform, verify ReachPilot's usage complies with their developer Terms of Service:

### 6.1 — Key Restrictions to Verify

**Facebook/Instagram (Meta Platform Policy):**
- [ ] Not storing user data longer than 90 days without re-consent
- [ ] Not selling user data
- [ ] Displaying "powered by" attribution if required
- [ ] Handling data deletion callbacks from Meta

**Twitter/X API Terms:**
- [ ] Respecting automation rules (no spam, no fake engagement)
- [ ] Disclosing automated posting to users
- [ ] Not exceeding tweet limits for automation

**TikTok Developer Terms:**
- [ ] Content moderation: not posting prohibited content via API
- [ ] Not bypassing TikTok's content moderation

**LinkedIn API Terms:**
- [ ] Not scraping beyond API-provided data
- [ ] Respecting member privacy settings

**YouTube API Terms (Google):**
- [ ] Complying with YouTube API Services Terms
- [ ] Displaying required attribution
- [ ] Not manipulating YouTube metrics

### 6.2 — AI Content Disclosure

Some jurisdictions and platforms require labeling AI-generated content:
- EU AI Act: "AI-generated" label may be required
- Platform-specific: some platforms require disclosure of automated posting

**Implementation:**
- Add an option per post: "Label as AI-generated" toggle (default: on for AI-created posts)
- When enabled: append a subtle disclosure to the post (e.g., "#AIGenerated" or platform-specific label)
- Make this configurable per org in settings

---

## PHASE 7: DATA BREACH NOTIFICATION

### 7.1 — Incident Response Plan

Create `docs/compliance/INCIDENT-RESPONSE.md`:

1. **Detection:** How breaches are detected (monitoring, alerts, user reports)
2. **Assessment:** Severity classification (personal data affected, scope, impact)
3. **Containment:** Immediate actions (revoke tokens, patch vulnerability, block access)
4. **Notification timeline:**
   - GDPR: notify supervisory authority within 72 hours, notify affected users "without undue delay"
   - Australian NDB scheme: notify OAIC and affected individuals "as soon as practicable"
   - CCPA: notify affected California residents "in the most expedient time possible"
5. **Notification content:** What happened, what data was affected, what we're doing about it, what users should do
6. **Post-incident:** Root cause analysis, prevention measures, documentation

### 7.2 — Technical Controls

- [ ] Audit log captures all admin access and data exports
- [ ] Failed login attempts are logged with IP addresses
- [ ] Unusual data access patterns trigger alerts (e.g., admin exporting 1000+ user records)
- [ ] All API responses that return PII are logged (for breach scope assessment)

---

## PHASE 8: SECURITY PAGE

Create/update `/security` page:

1. **Infrastructure:** where data is hosted, encryption at rest and in transit
2. **Authentication:** password hashing, session management, MFA (planned)
3. **Authorization:** role-based access, multi-tenancy isolation
4. **Data encryption:** AES-256-GCM for OAuth tokens, TLS 1.3 in transit
5. **Monitoring:** structured logging, error tracking, uptime monitoring
6. **Vulnerability disclosure:** responsible disclosure policy, contact email (security@reachpilot.com.au)
7. **Compliance:** GDPR, CCPA, Australian Privacy Act, SOC 2 (aspirational)
8. **Regular audits:** dependency scanning, code review, penetration testing (planned)

---

## EXECUTION RULES

1. Technical implementations (data export, account deletion, cookie consent) are highest priority.
2. Policy page content is important but mark everything as `[DRAFT — REQUIRES LEGAL REVIEW]`.
3. Commit with `compliance:` or `feat:` prefix.
4. Run `npm run build` after every phase.
5. Do NOT provide legal advice — implement technical controls and create policy templates.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — ReachPilot / Agentic Consciousness — April 2026*

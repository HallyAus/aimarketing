# AdPilot — Audit 8: Onboarding & User Experience

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Fix issues, commit, move on.

---

## CONTEXT

Signup-to-first-post conversion rate determines whether AdPilot grows or dies. If users don't connect an account and publish within the first session, they probably never will. This audit maps the entire user journey, fixes friction points, and builds the onboarding flow.

**Output:** `docs/ux/ONBOARDING-AUDIT.md`

---

## PHASE 1: SIGNUP FLOW AUDIT

### 1.1 — Current Flow
Map every step from landing page to first dashboard view:
1. How many fields on the signup form?
2. Is a credit card required? (It shouldn't be for the Free tier)
3. Is email verification required before access? (It shouldn't block — let them in, verify later)
4. What happens immediately after signup? (Redirect to where?)
5. How many clicks/minutes from signup to seeing the dashboard?

### 1.2 — Fixes
- Signup form: name, email, password only (3 fields max). No company name, no phone, no industry — collect later.
- Timezone: auto-detected silently (no field shown)
- After signup: redirect directly to `/onboarding` (not dashboard — empty dashboard is confusing)
- Email verification: send the email, but let the user into the app immediately. Show a dismissible banner: "Please verify your email" with resend link.
- No credit card for Free tier. Ever.

---

## PHASE 2: ONBOARDING WIZARD

### 2.1 — Build the Wizard

Create `/onboarding` with a multi-step flow:

**Step 1: "Welcome to AdPilot" (5 seconds)**
- Personalized: "Hey [name], let's get your marketing on autopilot."
- One CTA: "Let's go →"

**Step 2: "Connect your first account" (30 seconds)**
- Grid of 9 platform icons (Facebook, Instagram, TikTok, etc.)
- Each is a button that starts the OAuth flow
- "Which platform do you want to start with?" — single selection
- On successful OAuth: auto-advance to step 3
- Skip option: "I'll do this later" (but strongly discouraged — show why connecting matters)

**Step 3: "Select your page" (10 seconds)**
- After OAuth, if the user has multiple pages/accounts on that platform, show the page selector
- Pre-select the first one
- "This is where your posts will go."

**Step 4: "Create your first post" (60 seconds)**
- Pre-populated AI-generated post based on the page's existing content (if available from ingestion)
- Or: a simple text field with AI assist button: "Need inspiration? Let AI write something →"
- "Publish now" or "Schedule for the best time" (AI picks the time)
- The user should feel they've accomplished something within 2 minutes

**Step 5: "You're all set!" (5 seconds)**
- Celebration moment (confetti animation or similar — tasteful)
- Summary: "Your [Platform] page [Page Name] is connected. Your first post is [scheduled/published]."
- CTA: "Go to Dashboard →"
- Secondary: "Connect another account"

### 2.2 — Onboarding State

Add to User model:
```prisma
model User {
  onboardingStep    Int       @default(0)  // 0 = not started, 5 = complete
  onboardingComplete Boolean  @default(false)
}
```

- If `onboardingComplete === false`, redirect to `/onboarding` from any `/dashboard` route
- After completing step 5, set `onboardingComplete = true`
- Users can skip onboarding but get a persistent "Finish setup" banner on the dashboard

---

## PHASE 3: EMPTY STATES

Every page with dynamic content needs a helpful empty state — not a blank screen.

### 3.1 — Audit Every Page
```bash
find src/app -name "page.tsx" | xargs grep -L "empty\|no data\|No \|nothing\|get started" | head -20
```

### 3.2 — Empty State Content

**Dashboard (no connected accounts):**
- Illustration + "Connect your first social account to start managing your marketing."
- Big CTA: "Connect Account →"

**Dashboard (account connected but no posts):**
- "You're connected! Create your first post to get started."
- CTA: "Create Post →" + "Let AI write one for you →"

**Content Calendar (no scheduled posts):**
- "Your calendar is empty. Schedule your first post."
- Show suggested posting times based on the platform

**Analytics (no data yet):**
- "Analytics will appear here once your posts start getting engagement."
- If ingestion is running: "Importing your history... [progress bar]"

**Team Members (only you):**
- "You're the only one here. Invite your team to collaborate."
- CTA: "Invite Team Member →"

**Blog (no posts):**
- "No blog posts yet. Check back soon!"

---

## PHASE 4: UPGRADE PROMPTS

When a FREE user hits a limit, the upgrade path must be clear and frictionless:

### 4.1 — Soft Limits
- When approaching 80% of post limit: subtle badge on the post counter "24/30 posts this month"
- When at 100%: modal: "You've reached your monthly post limit. Upgrade to Pro for unlimited posts." [Upgrade →] [Maybe later]
- When trying to connect a 4th platform: "Free plans support 3 platforms. Upgrade to connect all 9." [Upgrade →]
- When trying to invite a 2nd team member: "Free plans include 1 user. Upgrade to Pro for up to 5." [Upgrade →]

### 4.2 — Feature Gates
- AI Content Studio locked on Free: show the UI but with a "Pro" badge and blur overlay. "Upgrade to unlock AI-powered content generation."
- Advanced Analytics locked: show sample data with blur, "Upgrade to see your full analytics."
- Webhook Automation locked: settings page shows the feature with a lock icon and upgrade CTA

### 4.3 — Upgrade Page
- Redirect to `/pricing` with the user's current plan highlighted
- Pre-select the recommended plan (Pro for most users, Agency for teams)
- Show what they'll gain: clear comparison of their current limits vs the new plan
- Stripe Checkout: one-click upgrade, pre-filled billing info if they've paid before

---

## PHASE 5: CHURN PREVENTION

### 5.1 — Cancellation Flow
When a user clicks "Cancel Subscription":

1. **Why are you leaving?** (required, single-select radio buttons)
   - Too expensive
   - Missing features I need
   - Not using it enough
   - Switching to a competitor
   - Other (free text)

2. **Based on their answer:**
   - "Too expensive" → Offer 20% discount for 3 months: "Stay for $39/mo instead of $49/mo?"
   - "Not using it enough" → Offer a pause: "Pause your subscription for 1-3 months instead of canceling?"
   - "Missing features" → "Tell us what you need and we'll prioritize it. Stay on your current plan while we build it?"
   - "Switching to competitor" → "Can you tell us who? We'd love to learn what they do better."

3. **Final confirmation:**
   - Show what they'll lose (connected accounts, scheduled posts, team access, analytics history)
   - "Cancel at end of billing period" (default) or "Cancel immediately"
   - "Your data will be preserved for 30 days after cancellation in case you change your mind."

### 5.2 — Win-Back
- 7 days after cancellation: email "We miss you — here's what's new" with recent feature updates
- 30 days after cancellation: email "Your data will be permanently deleted in 7 days. Reactivate now to keep everything."

---

## PHASE 6: HELP & SUPPORT

### 6.1 — Contextual Help
- Tooltip help icons (?) next to complex features (Smart Scheduling, Audience Timezone, Approval Workflow)
- First-use tooltips: when a user visits a section for the first time, show a brief walkthrough tooltip
- Keyboard shortcut: `?` opens a help panel anywhere in the app

### 6.2 — Support Access
- Help link in the app sidebar/footer: links to `/docs`
- "Contact Support" in the user menu: links to `/contact` or opens a support form modal
- In-app feedback: "How's your experience?" micro-survey after the first week

---

## PHASE 7: MOBILE EXPERIENCE

- Is the full app (not just marketing site) usable on mobile?
- Can users create and schedule posts from their phone?
- Is the page switcher usable on small screens?
- Are the content calendar and analytics charts responsive?
- Test at 375px, 414px (iPhone), and 768px (iPad) widths

---

## EXECUTION RULES

1. Onboarding wizard (Phase 2) is the highest-impact deliverable.
2. Empty states (Phase 3) are second — they prevent user confusion.
3. Commit with `feat:` or `ux:` prefix.
4. Run `npm run build` after every phase.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — AdPilot / Agentic Consciousness — April 2026*

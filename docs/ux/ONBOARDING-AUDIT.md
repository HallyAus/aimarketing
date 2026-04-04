# ReachPilot Onboarding UX Audit

> Based on AUDIT-08-ONBOARDING-UX.md -- findings and implementation status.

---

## Current State (as of April 2026)

### Signup Flow
- Signup form: name, email, password (3 fields). No credit card required for Free tier.
- After signup, users are directed through org creation then into the dashboard.
- Email verification is sent but does not block access.
- `/onboarding` page exists with a 4-step checklist (create org, connect platform, create campaign, upgrade plan).

### Onboarding State
- `onboardingComplete` field exists on the User model (Prisma schema).
- The `/onboarding` page queries `platformConnection`, `campaign`, and `organization` to determine progress.
- No forced redirect from `/dashboard` to `/onboarding` -- users can reach the dashboard directly.

### Empty States
- A reusable `EmptyState` component exists (`components/empty-state.tsx`) with icon, title, description, and action slot.
- The dashboard tabs (scheduled/recent) have basic inline empty states but no strong CTAs.

---

## Implemented (this audit cycle)

### 1. Empty State Components
Three purpose-built empty state components were created under `components/empty-states/`:

| Component | File | Message | CTA |
|-----------|------|---------|-----|
| `NoPosts` | `no-posts.tsx` | "No posts yet. Create your first post with AI." | Create Post + Let AI Write One |
| `NoCampaigns` | `no-campaigns.tsx` | "No campaigns yet." | Create Campaign |
| `NoConnections` | `no-connections.tsx` | "Connect your social accounts to get started." | Connect Account |

All components reuse the existing `EmptyState` base component and design system CSS variables. Each includes a contextual SVG icon, helpful description, and a primary CTA button linking to the appropriate page.

### 2. Onboarding Checklist
`components/onboarding-checklist.tsx` -- a client component that:
- Shows three steps: Connect account, Select page, Create first post.
- Accepts `hasConnection`, `hasPage`, and `hasPost` boolean props (server component resolves these from DB).
- Displays a progress bar (N of 3 complete).
- Each incomplete step links to the relevant settings/creation page.
- Completed steps show a green checkmark with strikethrough text.
- Dismissible via X button; dismissal persists in localStorage.
- Automatically hides when all steps are complete.

### 3. Upgrade Prompt
`components/upgrade-prompt.tsx` -- a client component with two display modes:
- **Banner**: inline alert with usage progress bar, message, and Upgrade CTA. Suitable for embedding in dashboards or list pages.
- **Modal**: centered overlay with backdrop blur for hard-limit enforcement.
- Configurable via props: `current`, `limit`, `resource` name, `targetPlan`, `variant`.
- Only renders when usage is at or above 80% of the limit.
- Dismissible; calls optional `onDismiss` callback.

---

## Remaining Work (not yet implemented)

### High Priority
1. **Onboarding wizard** (`/onboarding` multi-step flow) -- Steps: Welcome, Connect Account (OAuth), Select Page, Create First Post (AI-assisted), Celebration. The current `/onboarding` page is a static checklist; a guided step-by-step wizard would increase first-session conversion.
2. **Dashboard integration** -- Wire the `OnboardingChecklist` into the dashboard page for users with `onboardingComplete === false`. Wire `NoConnections` empty state for users with zero platform connections.
3. **Upgrade prompt integration** -- Query post count vs plan limit on the dashboard and campaigns pages; render `UpgradePrompt` banner when approaching 80%.
4. **Feature gates** -- Blur overlay + "Pro" badge for AI Content Studio, Advanced Analytics, and Webhook Automation on Free plans.

### Medium Priority
5. **Cancellation flow** -- Reason survey, conditional offers (discount, pause), data loss summary, confirmation.
6. **Win-back emails** -- 7-day and 30-day post-cancellation email sequences.
7. **Contextual help tooltips** -- First-use tooltips for Smart Scheduling, Audience Timezone, Approval Workflow.
8. **Keyboard shortcut help panel** -- `?` key opens help overlay.

### Lower Priority
9. **Mobile UX audit** -- Test all dashboard pages at 375px, 414px, 768px widths.
10. **In-app feedback micro-survey** -- "How's your experience?" prompt after first week.
11. **Empty states for remaining pages** -- Analytics (with ingestion progress), Team Members, Content Calendar, Blog.

---

## Design System Notes

All new components use existing CSS variables:
- Backgrounds: `--bg-primary`, `--bg-secondary`, `--bg-tertiary`, `--bg-elevated`
- Text: `--text-primary`, `--text-secondary`, `--text-tertiary`
- Accents: `--accent-blue`, `--accent-emerald`, `--accent-amber`, `--accent-red`, `--accent-purple` (with `-muted` variants)
- Borders: `--border-primary`, `--border-secondary`
- Buttons: `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`

# AdPilot WCAG 2.1 AA Accessibility Audit

**Date:** April 3, 2026
**Scope:** Full application (marketing site, dashboard, admin, auth forms)
**Standard:** WCAG 2.1 Level AA

---

## Summary

AdPilot's codebase had a solid accessibility foundation. This audit identified and fixed 12 high-impact issues across keyboard navigation, screen reader support, form labeling, and motion preferences. The remaining items are lower priority and documented below for future work.

---

## Fixes Applied

### 1. Sidebar Navigation — `aria-current="page"` on Active Items
**File:** `apps/web/src/app/(dashboard)/components/sidebar-nav.tsx`
- Added `aria-current="page"` to the active nav link so screen readers announce which page the user is on.
- Added `aria-label` to collapsed sidebar nav links (icon-only state) so each link is identifiable without visible text.

### 2. Marketing Navbar — Mobile Menu Accessibility
**File:** `apps/web/src/components/marketing/navbar.tsx`
- Changed `aria-label` from vague "Toggle menu" to context-aware "Open navigation menu" / "Close navigation menu".
- Added `aria-expanded` attribute to the hamburger button.
- Added `aria-controls="mobile-nav-drawer"` linking the button to the drawer.
- Changed mobile drawer from `<div>` to `<nav>` with `role="navigation"` and `aria-label="Mobile navigation"`.
- Added `aria-hidden="true"` to the mobile overlay backdrop.
- Added `aria-label="Main navigation"` to the desktop `<nav>` element.
- Added Escape key handler to close the mobile drawer.

### 3. Admin Create User Form — Label/Input Association
**File:** `apps/web/src/app/admin/users/create/create-user-form.tsx`
- Added `htmlFor`/`id` pairs to all form fields: email, name, system role, organization search, organization select, organization role, password.
- Wrapped password mode radio buttons in a `<fieldset>` with `<legend>` for proper grouping.
- Added `aria-label` to the organization select dropdown.
- Added `role="alert"` to the error banner and `role="status"` to the success banner.

### 4. Decorative SVG Icons — `aria-hidden="true"`
**Files:** `top-bar.tsx`, `signin/page.tsx`, `contact-form.tsx`, `signup-form.tsx`
- Added `aria-hidden="true"` to decorative SVGs that sit next to text labels (admin cog icon, magic link email icon, passkey fingerprint icon, Google/Microsoft OAuth icons, success checkmark icons).

### 5. Reduced Motion — Global Safety Net
**File:** `apps/web/src/app/globals.css`
- Added global `@media (prefers-reduced-motion: reduce)` rule that disables all animations and transitions for users who prefer reduced motion.
- This supplements the existing marketing-specific reduced motion rules in `marketing.css`.

---

## Already Compliant (No Changes Needed)

| Item | Status | Location |
|------|--------|----------|
| `<html lang="en">` | Present | `layout.tsx` |
| Skip-to-content link | Present (both root and dashboard layouts) | `layout.tsx`, `(dashboard)/layout.tsx` |
| `#main-content` landmark target | Present | `(dashboard)/layout.tsx` |
| Focus-visible styles (global) | Present (2px blue outline, 2px offset) | `globals.css` |
| `.focus-ring` utility class | Present | `globals.css` |
| Form focus styles (input/textarea/select) | Present (blue border + box-shadow) | `globals.css` |
| Page titles (unique per page) | Present via Next.js `metadata.title` | All page files |
| Heading hierarchy (marketing homepage) | Correct: single h1, sequential h2 > h3 | Marketing components |
| Heading hierarchy (dashboard pages) | Correct: `PageHeader` renders h1, sub-sections use h2+ | `page-header.tsx` |
| Sidebar mobile hamburger | Has `aria-label`, `aria-expanded`, `aria-controls` | `sidebar-nav.tsx` |
| Notification bell | Has `aria-label="Notifications"` | `top-bar.tsx` |
| User menu button | Has `aria-label`, `aria-expanded`, `aria-haspopup` | `top-bar.tsx` |
| Publishing toggle | Has `aria-label` (context-aware) | `top-bar.tsx` |
| Search button | Has `aria-label="Search (coming soon)"` | `top-bar.tsx` |
| Page switcher | Has `aria-expanded`, `aria-haspopup="listbox"`, `aria-label`, role="listbox" | `page-switcher.tsx` |
| Account selector | Has `aria-expanded`, `aria-haspopup`, `aria-label`, role="listbox/option" | `account-selector.tsx` |
| Timezone selector | Has `aria-expanded`, `aria-haspopup`, `aria-label`, role="listbox/option" | `timezone-selector.tsx` |
| Sidebar nav icons | Have `aria-hidden="true"` | `sidebar-nav.tsx` |
| Sign-in form inputs | Have proper `<label htmlFor>` + `id` | `signin/page.tsx` |
| Contact form inputs | Have proper `<label htmlFor>` + `id` | `contact-form.tsx` |
| Signup form inputs | Have proper `<label htmlFor>` + `id` | `signup-form.tsx` |
| Error banners (auth) | Have `role="alert"` | `signin/page.tsx` |
| Minimum touch targets | 44x44px on mobile buttons | Multiple components |
| Marketing reduced motion | Existing rules in `marketing.css` | `marketing.css` |
| User menu dropdown | Has `role="menu"`, items have `role="menuitem"` | `top-bar.tsx` |
| Sidebar collapse button | Has `aria-label` (context-aware) | `sidebar-nav.tsx` |
| Sign-out link | Has `aria-hidden="true"` on decorative icon | `top-bar.tsx` |

---

## Remaining Items (Future Work)

### Priority: Medium

1. **Keyboard trap in mobile drawers** — When mobile nav drawer is open, Tab focus can escape to content behind the overlay. Consider implementing a focus trap using `inert` attribute on background content or a focus-trap library.

2. **Page switcher keyboard navigation** — Arrow keys do not currently move between options in the dropdown. Consider adding `onKeyDown` handler for ArrowUp/ArrowDown/Enter/Escape pattern with `aria-activedescendant`.

3. **Admin data tables** — Tables in admin pages use div-based layouts. Consider migrating to semantic `<table>` with `<th scope="col">` and `<th scope="row">` for screen reader row/column announcements. Add `aria-sort` to sortable column headers.

4. **Color not sole indicator** — Token health indicators (green/yellow/red dots) in the page switcher `StatusDot` component rely on color alone. Consider adding a text label or distinct icon shape.

5. **Aria-live regions for dynamic content** — Dashboard widgets and analytics loading states could benefit from `aria-live="polite"` regions to announce content updates to screen readers.

6. **Error summary for forms** — When form validation fails, consider adding an error summary at the top of the form with links to each errored field (WCAG 3.3.1).

### Priority: Low

7. **Chart accessibility** — If Recharts is used for analytics, add text alternative data tables or `aria-label` summaries on chart containers.

8. **Pagination landmarks** — Admin paginated lists should wrap pagination controls in `<nav aria-label="Pagination">` with `aria-current="page"` on the active page number.

9. **Color contrast audit** — A systematic contrast ratio check of all text/background combinations has not been performed. Consider running Lighthouse or axe-core automated scans.

10. **Touch target spacing** — While individual touch targets meet the 44x44px minimum, adjacent targets in dense areas (sidebar nav when expanded) may benefit from additional spacing (8px gap minimum per WCAG 2.5.8).

---

## Testing Recommendations

- Run `npx axe-core` or Lighthouse accessibility audits on each major page
- Test with VoiceOver (macOS), NVDA (Windows), and TalkBack (Android)
- Verify all flows are completable with keyboard only (no mouse)
- Test at 200% browser zoom to verify no content clipping or horizontal scroll
- Verify at 320px viewport width for reflow compliance

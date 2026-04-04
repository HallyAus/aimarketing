# ReachPilot — Audit 3: Accessibility (WCAG 2.1 AA)

> **For use in Claude Code against the `HallyAus/aimarketing` repo**
> Run autonomously. Fix issues, commit, move on.

---

## CONTEXT

ReachPilot is a global SaaS platform. Accessibility is a legal requirement (ADA, EU Accessibility Act 2025, Australian DDA) and a moral one. This audit brings the entire application to WCAG 2.1 AA compliance.

**Output:** `docs/accessibility/WCAG-AUDIT.md` — findings, fixes, remaining issues.

---

## PHASE 1: AUTOMATED SCAN

### 1.1 — Install Tooling
```bash
npm install -D axe-core @axe-core/react eslint-plugin-jsx-a11y
```

### 1.2 — ESLint Accessibility Rules
Add `plugin:jsx-a11y/recommended` to the ESLint config. Run:
```bash
npx eslint . --ext .ts,.tsx --plugin jsx-a11y --rule '{"jsx-a11y/alt-text": "error", "jsx-a11y/anchor-is-valid": "error", "jsx-a11y/label-has-associated-control": "error"}' 2>&1 | head -100
```
Fix every error.

### 1.3 — Scan Every Page
For every page in `src/app/`, check:
- Heading hierarchy: one `<h1>` per page, sequential `<h2>`→`<h3>`→`<h4>` (no skipping levels)
- Landmark regions: `<main>`, `<nav>`, `<header>`, `<footer>`, `<aside>` used correctly
- Language attribute: `<html lang="en">` in root layout
- Page titles: every page has a unique, descriptive `<title>`

---

## PHASE 2: KEYBOARD NAVIGATION

Test every interactive element:

- [ ] All links, buttons, inputs, selects, checkboxes reachable via Tab key
- [ ] Tab order is logical (left-to-right, top-to-bottom, follows visual layout)
- [ ] Focus is visible on every interactive element (3px outline, offset 2px, high-contrast color)
- [ ] Escape closes modals, dropdowns, and popover menus
- [ ] Enter/Space activates buttons and links
- [ ] Arrow keys navigate within components (dropdown options, tab panels, radio groups)
- [ ] Skip-to-content link: add `<a href="#main-content" class="sr-only focus:not-sr-only">Skip to content</a>` as the first focusable element in the layout

**Page switcher dropdown:** Must be fully keyboard-navigable — arrow keys move between options, Enter selects, Escape closes, focus returns to the trigger button.

**Admin data tables:** Must support keyboard navigation of rows and sortable column headers.

---

## PHASE 3: SCREEN READER SUPPORT

### 3.1 — ARIA Labels
- Every icon-only button needs `aria-label` (e.g., close buttons, settings cogs, platform icons)
- Navigation links in the sidebar need `aria-current="page"` on the active item
- Page switcher: `aria-haspopup="listbox"`, `aria-expanded`, `aria-activedescendant`
- Modals: `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to the title
- Toast notifications: `role="alert"` or use `aria-live="polite"` region
- Loading states: `aria-busy="true"` on the container, `aria-live="polite"` for status updates
- Ingestion progress: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

### 3.2 — Form Accessibility
For every form in the app:
- Every `<input>`, `<select>`, `<textarea>` has a visible `<label>` associated via `htmlFor`
- Required fields marked with `aria-required="true"` and visible indicator
- Error messages use `aria-describedby` linked to the input
- Error summary at the top of the form with links to each errored field
- Submit button disabled state communicates via `aria-disabled` not just visual opacity

### 3.3 — Dynamic Content
- Content that updates without page navigation (analytics loading, post status changes, ingestion progress) uses `aria-live` regions
- Page transitions managed with focus: when navigating to a new page, focus moves to the main content area or page heading

---

## PHASE 4: COLOR & CONTRAST

### 4.1 — Text Contrast
Audit every text/background combination:
- Body text on background: minimum 4.5:1 ratio
- Large text (18px+ or 14px+ bold) on background: minimum 3:1 ratio
- Placeholder text: minimum 4.5:1 (many designs fail here)
- Disabled text: exempt from contrast requirements but should still be distinguishable

### 4.2 — UI Component Contrast
- Button borders and backgrounds against surrounding content: minimum 3:1
- Form input borders: minimum 3:1 against background
- Focus indicators: minimum 3:1 against adjacent colors
- Status badges (green/yellow/red): ensure text inside meets 4.5:1

### 4.3 — Color Not Sole Indicator
- Token health (green/yellow/red): also use icons or text labels — not just color
- Form errors: use icon + text + border change — not just red text
- Subscription status badges: include text label alongside the color

---

## PHASE 5: MOTION & RESPONSIVE

### 5.1 — Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```
- Apply globally in the root CSS
- Verify: all entrance animations, hover transitions, loading spinners, and scroll effects respect this

### 5.2 — Touch Targets
- All interactive elements: minimum 44x44px touch target on mobile
- Spacing between adjacent touch targets: minimum 8px gap
- Small inline links in text: add padding to meet the minimum

### 5.3 — Zoom & Reflow
- Content must be usable at 200% browser zoom
- No horizontal scrolling at 320px viewport width
- Text must reflow — no fixed-width containers that clip at zoom

---

## PHASE 6: ADMIN DASHBOARD ACCESSIBILITY

The admin backend has unique accessibility challenges with dense data tables and complex interactions:

- Data tables: use `<table>` with `<th scope="col">` and `<th scope="row">` — not div-based grids
- Sortable columns: `aria-sort="ascending|descending|none"`, activated via keyboard
- Pagination: `nav` with `aria-label="Pagination"`, current page indicated with `aria-current="page"`
- Filters: form inputs with labels, applied filters listed as removable chips with `aria-label="Remove filter: Status Active"`
- Charts (Recharts): provide text alternatives — data table toggle or `aria-label` with summary
- Bulk actions: checkbox selection with `aria-label="Select user [name]"`, select-all checkbox

---

## EXECUTION RULES

1. Fix every issue directly in the code. Commit with `a11y:` prefix.
2. Keyboard navigation and screen reader fixes are highest priority.
3. Run `npx eslint . --plugin jsx-a11y` after each batch of fixes.
4. Run `npm run build` after every phase.

---

☕ [Buy Me a Coffee](https://buymeacoffee.com/printforge)
🛰️ Here's one free month of Starlink service! Starlink high-speed internet is great for streaming.

*Generated for Daniel Hall — ReachPilot / Agentic Consciousness — April 2026*

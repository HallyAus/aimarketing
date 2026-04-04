# ReachPilot Compliance Audit

> **[DRAFT — REQUIRES LEGAL REVIEW]**
> Generated: April 3, 2026
> This document is a technical compliance assessment and does not constitute legal advice.

---

## 1. GDPR Compliance Status (EU/EEA)

| Requirement | Status | Implementation |
|---|---|---|
| Right to Access (Art. 15) | Implemented | `POST /api/account/export` — self-service JSON data export |
| Right to Rectification (Art. 16) | Implemented | Users can edit profile, email, timezone, locale in settings |
| Right to Erasure (Art. 17) | Implemented | `POST /api/account/delete` — 7-day grace period, then hard deletion |
| Right to Data Portability (Art. 20) | Implemented | Data export returns machine-readable JSON |
| Right to Restriction (Art. 18) | Partial | Users can disconnect platforms; full restriction workflow needs manual support |
| Right to Object (Art. 21) | Partial | Analytics opt-out via cookie consent; marketing emails have unsubscribe |
| Consent Management | Implemented | Cookie consent banner with granular opt-in (essential/analytics/marketing) |
| Privacy Policy | Implemented (DRAFT) | `/privacy` page with all required GDPR sections |
| Data Processing Records | Partial | Audit logs track data access and exports; formal ROPA document needed |
| Data Breach Notification (72h) | Not implemented | Incident response plan needed |
| DPO Appointment | Not assessed | May be required depending on data volume and processing activities |
| DPIA | Not conducted | Required for high-risk processing (AI content generation may qualify) |

**Overall GDPR Status: Substantially compliant (technical controls). Formal legal review and DPIA required.**

---

## 2. CCPA Compliance Status (California)

| Requirement | Status | Implementation |
|---|---|---|
| Right to Know | Implemented | Data export API provides all collected personal information |
| Right to Delete | Implemented | Account deletion API with 7-day grace period |
| Right to Opt-Out of Sale | Compliant | ReachPilot does not sell personal data |
| Right to Non-Discrimination | Compliant | No service degradation for exercising privacy rights |
| Privacy Policy Disclosure | Implemented (DRAFT) | `/privacy` page includes CCPA section |
| "Do Not Sell" Link | N/A | ReachPilot does not sell data; disclosure included in privacy policy |
| Financial Incentive Notice | N/A | No financial incentives offered for data collection |

**Overall CCPA Status: Substantially compliant. Formal legal review required.**

---

## 3. Australian Privacy Act Compliance

| Requirement (APP) | Status | Implementation |
|---|---|---|
| APP 1 — Open and Transparent Management | Implemented (DRAFT) | Privacy policy published at `/privacy` |
| APP 3 — Collection of Solicited Information | Implemented | Only necessary data collected; consent obtained |
| APP 4 — Unsolicited Information | N/A | No unsolicited data collection |
| APP 5 — Notification of Collection | Implemented | Privacy policy and consent flows |
| APP 6 — Use or Disclosure | Implemented | Data used only for stated purposes |
| APP 7 — Direct Marketing | Partial | Transactional emails sent; marketing emails have unsubscribe |
| APP 8 — Cross-border Disclosure | Implemented (DRAFT) | International transfers disclosed in privacy policy |
| APP 10 — Quality of Personal Information | Implemented | Users can correct their data in settings |
| APP 11 — Security of Personal Information | Implemented | AES-256-GCM encryption, TLS 1.3, access controls |
| APP 12 — Access to Personal Information | Implemented | Self-service data export |
| APP 13 — Correction of Personal Information | Implemented | Self-service profile editing |
| Notifiable Data Breach (NDB) | Not implemented | Incident response plan and OAIC notification process needed |

**Overall Australian Privacy Act Status: Substantially compliant. NDB scheme compliance and formal legal review required.**

---

## 4. Items Requiring Legal Review

The following items require review by a qualified legal professional before production use:

### High Priority
1. **Privacy Policy** — All sections marked [DRAFT — REQUIRES LEGAL REVIEW]
2. **Terms of Service** — All sections marked [DRAFT — REQUIRES LEGAL REVIEW]
3. **AI Content Liability** — Review the AI-generated content disclaimer for adequacy under Australian consumer law and EU AI Act
4. **Data Processing Agreements (DPAs)** — Formal DPAs needed with all subprocessors
5. **Standard Contractual Clauses (SCCs)** — Required for EU-to-US data transfers

### Medium Priority
6. **DPIA for AI Processing** — Data Protection Impact Assessment for AI content generation
7. **Cookie Consent Implementation** — Verify compliance with ePrivacy Directive and Australian requirements
8. **Account Deletion Flow** — Verify 7-day grace period meets "without undue delay" requirement (Art. 17 GDPR)
9. **Data Retention Periods** — Legal review of all stated retention periods
10. **Incident Response Plan** — Create and review data breach notification procedures

### Lower Priority
11. **Terms Acceptance Versioning** — Implement re-acceptance flow when terms change
12. **Age Verification** — Consider whether current "must be 18" declaration is sufficient
13. **Jurisdiction-Specific Requirements** — Review requirements for other target markets
14. **Platform ToS Compliance** — Audit against each social platform's developer terms

---

## 5. Subprocessor List

| Subprocessor | Purpose | Data Processed | Location |
|---|---|---|---|
| Vercel | Hosting, edge functions, analytics | All app data in transit, deployment logs | US (global edge) |
| Neon | PostgreSQL database hosting | All stored data (encrypted at rest) | US |
| Stripe | Payment processing | Billing info, email, subscription data | US |
| Anthropic | AI content generation (Claude) | Post content, prompts, brand voice data | US |
| Resend | Transactional email delivery | Email addresses, email content | US |
| PostHog | Product analytics, feature flags | Usage events, feature flag evaluations (with consent) | US/EU |
| Facebook / Meta | Social publishing | Post content, page data, engagement analytics | US |
| Instagram (Meta) | Social publishing | Post content, engagement analytics | US |
| TikTok (ByteDance) | Social publishing | Post content, engagement analytics | US/Singapore |
| LinkedIn (Microsoft) | Social publishing | Post content, engagement analytics | US |
| X / Twitter | Social publishing | Post content, engagement analytics | US |
| YouTube (Google) | Video publishing | Video content, engagement analytics | US |
| Pinterest | Social publishing | Post content, engagement analytics | US |
| Google Ads | Advertising management | Ad content, targeting data, analytics | US |

---

## 6. Technical Compliance Controls Implemented

### Data Rights APIs
- **Data Export**: `POST /api/account/export` — authenticated, rate-limited (1/24h), audit logged
- **Account Deletion**: `POST /api/account/delete` — 7-day grace period, revokes platform tokens, audit logged

### Consent Management
- **Cookie Consent Banner**: `cookie-consent.tsx` — shows before non-essential scripts load
- **Granular Consent**: Essential (always on), Analytics (PostHog), Marketing (optional)
- **Consent Storage**: `reachpilot-consent` cookie with 1-year expiry
- **Revocable Consent**: "Cookie Preferences" link in footer
- **Conditional Loading**: PostHog only initialized when analytics consent is given

### Data Security
- OAuth tokens encrypted at rest (AES-256-GCM)
- TLS 1.3 for all data in transit
- HSTS headers enforced
- Session-based authentication with JWT
- Role-based access control (RBAC)
- Multi-tenancy isolation via organization scoping

### Audit Trail
- All data exports logged to `AuditLog` table
- All account deletion requests logged
- Admin actions logged with IP address and user agent

---

## 7. Remaining Work

1. [ ] Implement data breach notification system and incident response plan
2. [ ] Create formal Data Processing Agreements (DPAs) for all subprocessors
3. [ ] Conduct DPIA for AI content generation processing
4. [ ] Implement terms acceptance versioning (store `termsAcceptedAt` on User)
5. [ ] Add "Do Not Sell My Personal Information" link for CCPA (even though we don't sell data)
6. [ ] Implement data deletion cron job to hard-delete accounts past 7-day grace period
7. [ ] Create formal Record of Processing Activities (ROPA)
8. [ ] Add confirmation email for account deletion requests (Resend integration)
9. [ ] Audit each social platform's developer ToS for compliance
10. [ ] Obtain legal review of all DRAFT policy documents

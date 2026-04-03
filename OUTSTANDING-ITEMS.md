# AdPilot — Outstanding Items Requiring Owner Input

## API Keys & Services

| Item | Status | Action Required |
|------|--------|----------------|
| Resend API Key | Set on Vercel | **Rotate key** — it was shared in chat. Generate new at resend.com/api-keys |
| Resend Custom Domain | Not configured | Add custom domain (e.g., adpilot.com.au) in Resend dashboard to send from branded email |
| Stripe Secret Key | Not on Vercel | Add `STRIPE_SECRET_KEY` to Vercel env vars |
| Stripe Webhook Secret | Not on Vercel | Add `STRIPE_WEBHOOK_SECRET` — configure webhook endpoint in Stripe dashboard |
| Stripe Price IDs | Not on Vercel | Create products/prices in Stripe, add `STRIPE_PRICE_PRO_MONTHLY`, `STRIPE_PRICE_PRO_ANNUAL`, `STRIPE_PRICE_AGENCY_MONTHLY`, `STRIPE_PRICE_AGENCY_ANNUAL` |
| Anthropic API Key | On Vercel | Verify it's working for AI content generation |
| Facebook App Review | Unknown | Check Meta developer dashboard — app may need review for production access |
| Custom Domain | Not configured | Point a domain (e.g., app.adpilot.com.au) to Vercel |

## Vercel Configuration

| Item | Action Required |
|------|----------------|
| Vercel Pro Plan | Consider upgrading ($20/mo) to remove 100 deploys/day limit |
| Custom Domain | Add in Vercel project settings |
| Environment Variables | Verify all prod vars are set (run `npx vercel env ls`) |

## Legal & Compliance (Audit 10)

| Item | Action Required |
|------|----------------|
| Privacy Policy | Currently draft — needs legal review before going public |
| Terms of Service | Currently draft — needs legal review |
| Cookie Consent | Implementation ready — needs legal sign-off on cookie categories |
| Data Processing Agreement | Required if processing EU personal data |
| ABN/Business Registration | Needed for Australian privacy compliance |

## Content & Branding

| Item | Action Required |
|------|----------------|
| Real Testimonials | Currently placeholder/beta CTA — add real user testimonials when available |
| OG Image | Using icon-1024.png — create proper 1200x630 social share image |
| Logo Variants | Currently text-based "AdPilot" — create proper logo files if desired |
| Blog Content | 5 seed posts exist — decide on content publishing cadence |

## Platform Connections

| Item | Action Required |
|------|----------------|
| Facebook App | Verify app is in Live mode (not Development) |
| Instagram | Requires Facebook Page linked to Instagram Business account |
| TikTok | Need TikTok for Business app approval |
| LinkedIn | Need Marketing Developer Platform access |
| Twitter/X | Need API access tier (Basic $100/mo or Pro $5000/mo) |
| YouTube | Need YouTube Data API quota approval |
| Google Ads | Need developer token approval (can take weeks) |
| Pinterest | Need Pinterest API v5 access |
| Snapchat | Need Snap Marketing API approval |

## Database

| Item | Status |
|------|--------|
| Neon Production DB | Running (bitter-recipe-25138172) |
| Schema up to date | All 39 tables migrated manually via Neon MCP |
| Prisma Migrations | Not using formal migration files — using db push. Consider setting up proper migrations |
| Backups | Verify Neon automated backups are enabled |

## Infrastructure

| Item | Action Required |
|------|----------------|
| Redis | Add `REDIS_URL` to Vercel if not set — needed for caching and BullMQ |
| BullMQ Worker | Not running on Vercel (serverless). Need Proxmox worker deployment or alternative |
| CRON_SECRET | Verify set on Vercel for scheduled post publishing |
| Monitoring | Consider adding Sentry or similar for error tracking |

---

*Last updated: April 3, 2026*

## 2026-07-05T03:17:10Z

Build a multi-tenant SaaS platform for cafes ("Regulr") featuring:
- A customer-facing storefront (`{cafeslug}.regulr.in`) with digital menus, cart, checkout, local payment processing (Razorpay Route, direct UPI, and Cash/Counter), rewards, a gamified wheel/scratch card reward draw, and real-time order tracking.
- An owner dashboard (`app.regulr.in`) for live order management, menu CRUD (with CSV import), growth tools (loyalty, streaks, referrals, QR generator), and billing.
- A superadmin portal (`admin.regulr.in`) to onboard cafes, view system analytics, manage operations, and impersonate owner accounts for support.

Working directory: C:\Users\sumit\.gemini\antigravity\scratch\regulr
Integrity mode: development

Note: The user has run `/goal` on this task. Be extremely thorough, perform detailed validation and audits at every stage, and use browser search to source premium, modern UI designs to make the product feel high-end (visual excellence, smooth micro-animations, curated color palettes, elegant typography like Bricolage Grotesque/Inter, and custom layouts).

## Requirements

### R1. Multi-tenant Subdomain Routing
Implement host-based routing via Next.js middleware:
- `regulr.in` / `www.regulr.in`: Marketing brand page with landing copy and call-to-actions.
- `app.regulr.in`: Owner/staff dashboard.
- `admin.regulr.in`: Superadmin platform operations panel.
- `{slug}.regulr.in`: Customer storefront.
Support local testing via `?__cafe=slug` query param overrides and `*.localhost:3000` subdomains.

### R2. Premium Customer Storefront (Mobile-First)
Build a visually rich, mobile-first experience using Inter and Bricolage Grotesque fonts:
- Sticky bottom cart bar, items list with customization options sheets.
- An interactive gamified reward screen (Scratch / Spin to win) with custom canvas/CSS animations and confetti bursts.
- Live order tracker timeline (Received -> Preparing -> Ready -> Completed) polling status.

### R3. Owner Dashboard & Staff Console
Provide a feature-rich admin experience for owners:
- Kanban board queue with browser sound alerts and desktop notifications for new orders.
- CRM profiles showing points, tiers (Bronze/Silver/Gold), streak calendar heat-strips, and manual reward triggers.
- Sub-10s fast Manual Billing terminal for walk-ins with auto-generated invoices.
- Menu CSV import/export utility and growth settings panel.

### R4. Superadmin Central Operations
Deploy global platform settings:
- Cafe onboarding wizard (Basics -> Branding -> Menu template -> Payments -> Growth -> Launch) with automatic QR pack PDF compilation.
- Impersonation session switch allowing admins to audit-log inspect a cafe's panel.
- Global dashboard showing cohort retention tables, direct-order shares, and platform-wide MRR/churn metrics.

### R5. Scoped Repository Layer & Core Services
All database transactions must filter strictly by `cafeId` via a repository layer:
- **Pricing Engine**: Process calculations server-side in paise: `Subtotal -> Flash -> Coupon -> Tier perk -> Inclusive GST -> Grand Total`.
- **NextAuth.js**: Centralized session provider utilizing a wildcard domain cookie (`.regulr.in` / `.localhost`) matching all roles.
- **Dynamic PDF QR Packs**: Generates print-ready PDFs of tables and branding tags using `qrcode` and `@react-pdf/renderer`.

## Acceptance Criteria

### Technical & Quality Gating
- [ ] Next.js 14 (App Router) + Tailwind CSS v3 project compiled with strict TypeScript and zero compiler errors.
- [ ] Database access strictly isolated; verification tests prove Cafe A cannot read/write data for Cafe B under any API route.
- [ ] Single wildcard authentication cookie (`next-auth.session-token`) allows correct cross-domain checks on all subdomains.

### UI & Performance
- [ ] No default templates; color tokens (Coral primary, Slate/Ink text, Curated Tier badges) and typography styled precisely to specification.
- [ ] Frame rates of animations (spin/scratch) maintain smooth rendering at 60fps.
- [ ] Customer storefront implements skeleton loaders; full-page loaders are avoided.

### Verification & E2E Flow
- [ ] Seed script (`npm run seed:demo`) creates the idempotent demo database with rich charts data.
- [ ] Pricing engine unit tests pass for inclusive GST tax carve-outs, coupon caps, and loyalty tier percentages.
- [ ] E2E flows (Playwright/manual) verify user checkouts (Razorpay mock/UPI claim) triggering the post-payment rewards engine, loyalty tier increments, and invoice PDF generations.

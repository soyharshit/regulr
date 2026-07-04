# Original User Request

## Initial Request — 2026-07-05T03:17:10Z

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

## Follow-up — 2026-07-05T03:58:33Z

Complete the **Regulr** multi-tenant SaaS platform for Indian cafes. The project scaffold already exists at `C:\Users\sumit\.gemini\antigravity\scratch\regulr`. The marketing landing page and foundational scaffolding (middleware, Prisma schema, repository stubs, design tokens) are complete. The remaining work is building out all three portals and the supporting service layer.

Working directory: C:\Users\sumit\.gemini\antigravity\scratch\regulr
Integrity mode: development

## Context & Existing State

The project is Next.js 14 (App Router) + Tailwind CSS v3 + TypeScript + SQLite (via Prisma + better-sqlite3).

**Already built:**
- `src/middleware.ts` — host-based subdomain routing (supports `?__cafe=slug` override, `*.localhost` subdomains)
- `src/app/(marketing)/marketing/page.tsx` — full premium marketing landing page
- `src/app/globals.css` — complete design token system (Coral primary `#FF6B4A`, Inter + Bricolage Grotesque fonts, skeleton shimmer, press-scale, tier progress, etc.)
- `prisma/schema.prisma` — Cafe, User, Customer, MenuItem, Order, OrderItem, Referral models
- `src/lib/repositories/` — customer.ts, menuItem.ts, order.ts, referral.ts, user.ts stubs
- `prisma/seed.ts` — partial seed (cafes, users, menu items)
- Dependencies installed: next-auth, recharts, canvas-confetti, @react-pdf/renderer, qrcode, lucide-react, csv-parser, vitest, playwright

**Needs building (stubs only):**
- `src/app/(app)/app/page.tsx` — Owner Dashboard (stub, 13 lines)
- `src/app/(admin)/admin/page.tsx` — Superadmin Portal (stub, 13 lines)
- `src/app/(store)/[slug]/page.tsx` — Customer Storefront (stub, 18 lines)
- `src/lib/` — missing pricing engine, services (PDF/QR), auth config
- `prisma/seed.ts` — needs rich demo data for charts and analytics
- `tests/` — no tests written yet

**Routing convention (MUST follow):**
- Root domain → rewrites to `/marketing/*`
- `app` subdomain → rewrites to `/dashboard/*` (NOT `/app/*`)
- `admin` subdomain → rewrites to `/admin/*`
- Cafe slug → rewrites to `/store/{slug}/*`

## Requirements

### R1. Premium Customer Storefront (Mobile-First)

Build a visually rich, production-quality mobile-first customer storefront at `src/app/(store)/[slug]/page.tsx` and related routes:

- Menu browsing with category tabs, skeleton loaders, and sticky bottom cart bar showing item count + subtotal. No full-page loaders.
- Item detail sheet (bottom sheet on mobile) with customization options (size, add-ons).
- Checkout flow: select payment method (Cash/Counter, UPI Direct, Razorpay mock). Pricing engine applied server-side.
- After successful checkout: live order tracker timeline (`Received → Preparing → Ready → Completed`) polling `/api/orders/[orderId]/status` every 3 seconds.
- Post-checkout gamified reward screen: either a **Scratch Card** (canvas scratch-off) or **Spin Wheel** (CSS/canvas animation) with confetti burst on win. Award loyalty points on completion. Only shown once per order.
- Customer can view their loyalty points, tier badge (Bronze/Silver/Gold/Platinum), and streak calendar (heat-strip of active days).

### R2. Owner Dashboard & Staff Console

Build the owner dashboard portal at `src/app/(app)/` and `src/app/dashboard/`:

- **Live Order Kanban Board**: Columns for `Pending`, `Preparing`, `Ready`, `Completed`. Cards show order items, customer name, time elapsed. Drag or button to advance status. Poll every 5s. Play a browser audio alert (use Web Audio API, no external files) and fire a desktop notification (Notification API) for new incoming orders.
- **CRM Profiles**: Customer list with search. Each profile shows points, tier badge, streak calendar heat-strips (last 90 days), order history. Manual point adjustment (+/- input with confirm). Manual reward trigger button.
- **Manual Billing Terminal**: Fast walk-in billing UI. Search/add menu items, see live total (pricing engine), generate and download invoice PDF (via @react-pdf/renderer). Target under 10 seconds from open to invoice.
- **Menu Management**: Full CRUD for menu items. CSV import (validate headers, show inline errors for malformed rows) and CSV export.
- **Growth Settings**: Toggle loyalty program on/off, set points-per-rupee multiplier, manage coupon codes, configure streak milestones.
- Side navigation with icons. Dashboard home shows today's revenue, order count, popular items chart (recharts), and hourly order volume.

### R3. Superadmin Central Operations

Build the superadmin portal at `src/app/(admin)/` and `src/app/admin/`:

- **Cafe Onboarding Wizard**: 6-step wizard (Basics → Branding → Menu Template → Payments → Growth → Launch). Creates cafe record, seeds initial menu from template. On Launch step, generate and offer download of a QR Pack PDF (A4, table QR codes for tables 1–10, each with cafe branding, table number, and QR code linking to `{slug}.regulr.in`).
- **Global Analytics Dashboard**: MRR trend line chart, churn rate gauge, cohort retention heatmap table (using seeded demo data), direct-order share donut chart, platform-wide order volume. Use recharts.
- **Impersonation Switch**: Admin can click "Impersonate" on any cafe owner → session switches to that owner's context → audit log entry written to DB. Banner visible at top when impersonating. "End Impersonation" button reverts session.
- Cafe list with status (active/inactive), slug, MRR contribution, action buttons.

### R4. Core Services & Pricing Engine

Implement the service layer in `src/lib/`:

- **Pricing Engine** (`src/lib/pricing/pricingEngine.ts`): All arithmetic in integer paise. Pipeline: `Subtotal → Flash Discount → Coupon Discount → Tier Perk → add Inclusive GST (carve-out from subtotal, not added on top) → Grand Total`. Export `calculateOrderTotal(input: PricingInput): PricingResult`.
- **NextAuth** (`src/lib/auth.ts` + `src/app/api/auth/[...nextauth]/route.ts`): Credentials provider. Roles: SUPERADMIN, OWNER, STAFF, CUSTOMER. Wildcard cookie domain (`.regulr.in` or `.localhost`). Role-based session.
- **QR Generator** (`src/lib/services/qrGenerator.ts`): `generateTableQRPack(cafeId, tablesCount): Promise<Buffer>` — PDF output using @react-pdf/renderer + qrcode.
- **Order Status API** (`src/app/api/orders/[orderId]/status/route.ts`): GET returns current order status, POST (owner-only) updates status.
- **Repository completions**: Fill in all CRUD methods in the repository stubs under `src/lib/repositories/` using the scoped-by-cafeId pattern. No direct Prisma imports in components.

### R5. Data, Tests & Verification

- **Rich Demo Seed** (`prisma/seed.ts`): Replace existing minimal seed with an idempotent, rich seed (`npm run seed:demo` script). Must create: 3 cafes, 2+ owners, 5+ customers per cafe with varied tier/streak data, 15+ menu items per cafe, 90 days of order history (varied amounts for MRR/cohort charts), a superadmin user. Passwords: `password123`.
- **Pricing Unit Tests** (`tests/unit/pricingEngine.test.ts`): Cover inclusive GST carve-out math, flash discount exceeding subtotal (floor at 0), coupon cap, tier perk stacking. Tests must pass via `npm test`.
- **Multi-tenant Isolation Test** (`tests/unit/isolation.test.ts`): Verify repository functions return empty/null when queried with a cafeId that doesn't own the resource.
- **E2E Smoke Tests** (`tests/e2e/`): At minimum: routing spec (marketing page loads, slug routes to storefront, invalid slug returns 404), storefront spec (menu loads, add to cart, cash checkout creates order), owner dashboard spec (login as owner, Kanban visible).

## Acceptance Criteria

### Core Application
- [ ] `npm run build` completes with zero TypeScript errors and zero ESLint errors
- [ ] `npm run seed:demo` runs without errors and populates all demo data idempotently (running twice doesn't duplicate)
- [ ] `npm test` (vitest) passes all unit tests including pricing engine and isolation tests

### Feature Completeness
- [ ] Customer storefront renders menu items from DB for `?__cafe=starbucks`, shows skeleton loaders, allows add-to-cart, and completes a cash checkout that creates an order record in the DB
- [ ] Post-checkout reward screen (scratch or spin) renders and awards points visible in customer profile
- [ ] Owner dashboard Kanban board shows orders created in the storefront and allows status advancement to `COMPLETED`
- [ ] Manual billing terminal generates a downloadable invoice PDF
- [ ] Superadmin onboarding wizard completes all 6 steps and generates a QR pack PDF download
- [ ] Impersonation switch creates an audit log entry and shows the impersonation banner

### Technical Quality
- [ ] No direct Prisma client usage in React components or page files — all DB access through repository layer
- [ ] Pricing engine: `calculateOrderTotal` with 5% GST on ₹200 subtotal returns `gstAmount = 952` paise (inclusive carve-out: `200*100 * 0.05/1.05 = 952.38 → 952`)
- [ ] Wildcard auth cookie domain is `.localhost` in development (enabling session sharing across subdomains)

### UI Quality
- [ ] Consistent use of design tokens from `globals.css` (Coral primary, Bricolage Grotesque for headings, Inter for body)
- [ ] Skeleton loaders used on storefront and dashboard data-loading states (no full-page spinners)
- [ ] Mobile viewport (375px width) renders storefront without horizontal scroll

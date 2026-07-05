# Original User Request

## Initial Request — 2026-07-05T00:33:36Z

# Teamwork Project Prompt — Regulr SaaS Completion

> Status: Launched

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

---
**CRITICAL**: The user has marked this task with `/goal`, indicating that this task is intended to run for a long time without user input (e.g. overnight). You should be extra thorough and only stop when you are confident the goal has been completely fulfilled. The system will force you to continue execution, prompting you to audit your work until completion. 

When you are fully finished, please provide instructions and a preview link to view the running application!

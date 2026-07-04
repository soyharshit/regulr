# Master Implementation Plan: Regulr Cafe SaaS

## Phase 0: Project Initialization & Test Infra Setup

### Step 1: Framework & DB Initialization (Implementation Track)
- **Role**: Worker
- **Task**: Run `npx create-next-app@14` (or similar bootstrap), set up TypeScript, Tailwind CSS v3, Prisma with SQLite. Install required dependencies: `@prisma/client`, `next-auth`, `qrcode`, `@react-pdf/renderer`, `canvas-confetti`, `lucide-react`, `recharts`, `csv-parser`. Add standard developer tools.
- **Verification**: Run `npm run build` and ensure compilation is error-free.

### Step 2: E2E Test Suite Framework (Testing Track)
- **Role**: E2E Testing Orchestrator -> Worker
- **Task**: Set up Playwright test framework. Define directories under `tests/`. Draft `TEST_INFRA.md` outlining the feature inventory and Tier 1-4 test coverage thresholds. Write basic test scripts for URL routing and multi-tenant isolation verification.
- **Verification**: Execute `npx playwright test` to verify a dummy test passes and the runner works.

---

## Phase 1: Core Foundation & Subdomain Routing (Milestone 1)

### Step 3: Database Schema & Repository Layer
- **Role**: Worker
- **Task**: Write `prisma/schema.prisma` with models for `Cafe`, `User`, `Customer`, `MenuItem`, `Order`, `Referral`, `Payment`. Create `src/lib/repositories/` folder enforcing `cafeId` filtering.
- **Verification**: Write unit tests showing a query for Cafe A cannot return Cafe B data.

### Step 4: Wildcard NextAuth & Routing Middleware
- **Role**: Worker
- **Task**: Configure NextAuth session provider to set a wildcard domain cookie (`.localhost` or `.regulr.in`). Write `src/middleware.ts` to inspect request headers and map subdomains to internal paths. Support `?__cafe=slug` query param overrides.
- **Verification**: Run local tests simulating host request headers to verify routing and wildcard sessions.

---

## Phase 2: Superadmin central operations & onboarding (Milestone 2)

### Step 5: Cafe Onboarding & QR Packs
- **Role**: Worker
- **Task**: Build the onboarding wizard page on `admin.regulr.in`. Implement the PDF generator using `@react-pdf/renderer` and `qrcode` to generate printable branding cards.
- **Verification**: Verify that onboarding a new cafe creates the database entries and outputs a valid table QR PDF.

### Step 6: Operations Dashboard & Impersonation
- **Role**: Worker
- **Task**: Build analytics dashboards on `admin.regulr.in` (cohort retention matrix, MRR/churn tracking). Implement owner impersonation sessions using specialized admin cookie overrides.
- **Verification**: Verify that superadmin can transition to an owner dashboard view via audit-logged impersonation.

---

## Phase 3: Owner Dashboard & Staff Console (Milestone 3)

### Step 7: Live Order Kanban Queue
- **Role**: Worker
- **Task**: Build live order management on `app.regulr.in` using React state (with REST/SSE polling). Add sound alerts (HTML5 Audio) and Desktop Notification alerts when new orders arrive.
- **Verification**: Simulate a customer order and verify the Kanban board updates in real-time, playing sound.

### Step 8: CRM & Walk-in billing terminal
- **Role**: Worker
- **Task**: Build the loyalty profile details (Bronze/Silver/Gold) with the calendar streak heat-strip. Design the walked-in billing panel (optimized for keyboard use, < 10s checkout) with PDF invoice output.
- **Verification**: Perform a walk-in billing transaction, verify CRM stats update and PDF invoice generates.

---

## Phase 4: Customer Storefront & Gamified Rewards (Milestone 4)

### Step 9: Storefront Shell & Pricing Engine
- **Role**: Worker
- **Task**: Build customer storefront UI at `{slug}.regulr.in` (mobile-first, sticky cart, item customizations sheet). Implement the pricing engine calculations in paise (Subtotal -> Flash discount -> Coupon -> Tier perk -> Inclusive GST -> Grand Total).
- **Verification**: Test pricing engine calculations with a robust unit test suite covering coupon caps and tax carve-outs.

### Step 10: Payment Mock & Reward Draw
- **Role**: Worker
- **Task**: Set up UPI verification code / Razorpay mockup payment screen. Integrate with rewards engine: once payment is accepted, render a Canvas/CSS-animated Scratch card or Spin Wheel. Explode confetti on rewards.
- **Verification**: Complete checkout flow, claim code, trigger wheel animation, verify points are added to profile.

---

## Phase 5: Testing & Hardening (Milestone 5)

### Step 11: Idempotent Demo Seeder
- **Role**: Worker
- **Task**: Create `prisma/seed.ts` containing realistic seed data (many historical orders, cohort retention records, MRR progression) so dashboards display rich charts.
- **Verification**: Run `npm run seed:demo` and verify database entries.

### Step 12: E2E and Adversarial Hardening (Tier 5)
- **Role**: Challenger -> Worker -> Reviewer
- **Task**: Run Playwright suite targeting all subdomains. Reviewers run lint and build verification. Challengers write custom white-box tests to uncover untested gaps and potential race conditions in payment state handling.
- **Verification**: E2E test suite reports 100% pass rate.

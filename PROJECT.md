# Project: Regulr (Multi-tenant Cafe SaaS Platform)

## Architecture
Regulr is a multi-tenant Next.js 14 platform where tenants (cafes) are routed dynamically via their subdomain (`{slug}.regulr.in` or via query override `?__cafe=slug`). The app uses a single database instance with strict `cafeId` filtering enforced at the repository layer. Wildcard authentication cookies enable seamless session sharing across all subdomains.

### Data Flow
1. **Authentication**: Users authenticate centrally on `app.regulr.in` or customer storefronts. NextAuth writes a wildcard cookie `.regulr.in` (or `.localhost` for local development).
2. **Subdomain Routing**: `middleware.ts` extracts the host header and re-routes requests internally to tenant-specific folders.
3. **Repository Layer**: All data operations (menu CRUD, order processing, CRM, billing) pass through a scoped repository layer that injects and validates `cafeId`.
4. **Pricing & Rewards Engine**: Calculates order totals server-side in paise and triggers loyalty points/rewards upon payment confirmation.

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|--------------|--------|
| 1 | M1: Project Setup & Repo Layer | Next.js init, SQLite database setup, scoped repository layer, host-based routing middleware, NextAuth wildcard session provider. | None | PLANNED |
| 2 | M2: Superadmin Operations | Cafe onboarding wizard, automatic QR PDF pack generator, global MRR/churn and cohort retention analytics, impersonation switch. | M1 | PLANNED |
| 3 | M3: Owner Dashboard & Console | Live Kanban board queue (sound & browser notifications), CRM profiles (streaks calendar, loyalty points), walk-in manual billing terminal, menu CSV import/export. | M1 | PLANNED |
| 4 | M4: Storefront & Rewards | Customer mobile-first storefront, pricing engine in paise, gamified reward draw (Spin/Scratch animations), live order tracker timeline. | M1, M3 | PLANNED |
| 5 | M5: E2E Integration & Verification | Final E2E test passes, coverage hardening, demo seed script `npm run seed:demo`. | M2, M3, M4 | PLANNED |

---

## Interface Contracts

### 1. Scoped Repository Layer (`src/lib/repositories`)
All queries to the database must be routed through repositories that accept a `cafeId` parameter or context. Direct Prisma client imports in application components are strictly forbidden.
- `menuItemRepository.list(cafeId: string): Promise<MenuItem[]>`
- `orderRepository.create(cafeId: string, orderData: CreateOrderInput): Promise<Order>`
- `orderRepository.getById(cafeId: string, orderId: string): Promise<Order | null>`
- `customerRepository.getByUserId(cafeId: string, userId: string): Promise<Customer | null>`

### 2. Pricing Engine (`src/lib/pricing/pricingEngine.ts`)
Processes prices server-side in paise to avoid floating-point issues.
- `calculateOrderTotal(input: PricingInput): PricingResult`
```typescript
interface PricingInput {
  subtotal: number; // in paise
  flashDiscount?: number; // in paise
  couponCode?: string;
  loyaltyTierPointsApplied?: number;
  gstRate: number; // e.g. 0.05 for 5%
}

interface PricingResult {
  subtotal: number;
  flashDiscount: number;
  couponDiscount: number;
  tierDiscount: number;
  gstAmount: number; // inclusive GST
  grandTotal: number;
}
```

### 3. QR Pack Generation (`src/lib/services/qrGenerator.ts`)
Generates branding materials and table QR codes.
- `generateTableQRPack(cafeId: string, tablesCount: number): Promise<Buffer>` // PDF output

---

## Code Layout
```
/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Idempotent demo seeder (npm run seed:demo)
├── src/
│   ├── middleware.ts       # Wildcard subdomain router & auth guard
│   ├── app/
│   │   ├── (marketing)/    # regulr.in / www.regulr.in
│   │   ├── (app)/          # app.regulr.in (Owner dashboard)
│   │   ├── (admin)/        # admin.regulr.in (Superadmin central operations)
│   │   └── (store)/        # [slug] customer storefront
│   ├── components/         # Shared shadcn components and layout parts
│   ├── lib/
│   │   ├── db.ts           # DB connection
│   │   ├── repositories/   # Scoped repo files
│   │   ├── pricing/        # Pricing calculation engine
│   │   ├── services/       # PDF generators, Razorpay Route / UPI mock handlers
│   │   └── utils.ts
│   └── types/              # Type definitions
└── tests/
    ├── e2e/                # Playwright E2E tests
    └── unit/               # Jest/Vitest unit tests
```

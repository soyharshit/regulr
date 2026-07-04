# Scope: Milestone 1: Project Setup & Repo Layer

## Architecture
- **Multi-Tenant Schema**: Extend `prisma/schema.prisma` to cover Cafe, User, Customer, MenuItem, Order, Referral, and any necessary tracking fields (e.g. LoyaltyTiers, Streaks, points, etc.) with correct relationships.
- **Strict Repository Layer**: Implement repositories in `src/lib/repositories` for MenuItems, Orders, Customers, and Users. Every database read/write query must filter by `cafeId` to guarantee tenant isolation. Direct access via `db` or `prisma` inside Next.js components/routes is forbidden.
- **Host-Based Middleware Routing**: Adapt `src/middleware.ts` to route requests to appropriate page groups based on the hostname and query overrides (`?__cafe=slug`). Support `regulr.in`, `app.regulr.in`, `admin.regulr.in`, and `{slug}.regulr.in` (and their `.localhost` equivalents).
- **Wildcard NextAuth Cookies**: Configure NextAuth to write wildcard cookies (`.localhost` in development and `.regulr.in` in production) so users can sign in once and have their session shared across all tenant subdomains.
- **Unit Tests**: Implement unit tests (using Jest or Vitest) checking that Cafe A cannot read/write/access Cafe B's data under any condition. Ensure that the project builds successfully.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1.1: Database Schema | Extend `prisma/schema.prisma` with Cafe, User, Customer, MenuItem, Order, and Referral models. | None | PLANNED |
| 2 | M1.2: Repository Layer | Create scoped repository layer files under `src/lib/repositories/` enforcing `cafeId` filter. | M1.1 | PLANNED |
| 3 | M1.3: Middleware Routing | Support wildcard subdomains, host matching, and `__cafe` query overrides in middleware. | None | PLANNED |
| 4 | M1.4: Centralized Auth | Set up NextAuth configuration and wildcard cookie overrides. | None | PLANNED |
| 5 | M1.5: Verification | Set up test environment, write unit tests for repositories, and verify build. | M1.2, M1.4 | PLANNED |

## Interface Contracts

### 1. Scoped Repository Layer (`src/lib/repositories`)
All queries to the database must be routed through repositories that accept a `cafeId` parameter or context. Direct Prisma client imports in application components are strictly forbidden.

#### MenuItem Repository (`src/lib/repositories/menuItem.ts`)
- `list(cafeId: string): Promise<MenuItem[]>`
- `getById(cafeId: string, id: string): Promise<MenuItem | null>`
- `create(cafeId: string, data: Omit<Prisma.MenuItemCreateInput, 'cafe'>): Promise<MenuItem>`
- `update(cafeId: string, id: string, data: Omit<Prisma.MenuItemUpdateInput, 'cafe'>): Promise<MenuItem>`
- `delete(cafeId: string, id: string): Promise<MenuItem>`

#### Order Repository (`src/lib/repositories/order.ts`)
- `list(cafeId: string): Promise<Order[]>`
- `getById(cafeId: string, id: string): Promise<Order | null>`
- `create(cafeId: string, data: Omit<Prisma.OrderCreateInput, 'cafe'>): Promise<Order>`
- `updateStatus(cafeId: string, id: string, status: string): Promise<Order>`

#### Customer Repository (`src/lib/repositories/customer.ts`)
- `getByUserId(cafeId: string, userId: string): Promise<Customer | null>`
- `getById(cafeId: string, id: string): Promise<Customer | null>`
- `create(cafeId: string, data: Omit<Prisma.CustomerCreateInput, 'cafe'>): Promise<Customer>`
- `updatePoints(cafeId: string, id: string, points: number): Promise<Customer>`

#### Referral Repository (`src/lib/repositories/referral.ts`)
- `list(cafeId: string): Promise<Referral[]>`
- `create(cafeId: string, referrerId: string, referredId: string): Promise<Referral>`
- `complete(cafeId: string, id: string, pointsAwarded: number): Promise<Referral>`

## Code Layout
```
/
├── prisma/
│   ├── schema.prisma       # Database schema
├── src/
│   ├── middleware.ts       # Wildcard subdomain router & auth guard
│   ├── app/
│   │   ├── (marketing)/    # regulr.in / www.regulr.in
│   │   ├── (app)/          # app.regulr.in (Owner dashboard)
│   │   ├── (admin)/        # admin.regulr.in (Superadmin central operations)
│   │   └── (store)/        # [slug] customer storefront
│   ├── lib/
│   │   ├── db.ts           # DB connection
│   │   ├── auth.ts         # Centralized auth configuration
│   │   └── repositories/   # Scoped repo files
│   │       ├── menuItem.ts
│   │       ├── order.ts
│   │       ├── customer.ts
│   │       └── referral.ts
└── tests/
    └── unit/               # Jest/Vitest unit tests
        └── repositories.test.ts
```

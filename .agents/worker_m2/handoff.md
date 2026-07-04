# Handoff Report: Milestone 2 — Rich Demo Seed

**Agent**: Worker M2  
**Date**: 2026-07-05T04:13:30+05:30  
**Status**: COMPLETE ✅

---

## 1. Observation

### Schema State
Inspected `prisma/schema.prisma` (109 lines). Current schema models:
- `Cafe` — slug (unique), name, createdAt, updatedAt
- `User` — email (unique), password, name, role
- `Customer` — cafeId, userId, points, tier, streakCount, streakCalendar, `@@unique([cafeId, userId])`
- `MenuItem` — cafeId, name, description, price (in paise)
- `Order` — cafeId, customerId (nullable), totalAmount, status
- `OrderItem` — orderId, menuItemId, quantity, price
- `Referral` — cafeId, referrerId, referredId (unique), status, pointsAwarded

**Fields NOT present** (M1 did not add schema extensions for M2):
- `category` on MenuItem
- `isAvailable` on MenuItem
- `paymentMethod` on Order
- `AuditLog` model

### Dependency Check
- `bcryptjs`: NOT installed initially → installed via `npm install bcryptjs @types/bcryptjs --legacy-peer-deps`
- `tsx`: Available via `npx tsx`

### Existing Seed
File `prisma/seed.ts` was a simple 140-line script using `create` (not `upsert`), creating 3 simple cafes (starbucks, cafe-a, cafe-b) with no order history. Replaced entirely.

### First Seed Run (verbatim output):
```
🌱 Starting idempotent demo seed...
   Database: file:./dev.db
✓ Superadmin: superadmin@regulr.in
✓ Owner: owner1@brewhaven.com
✓ Owner: owner2@chaipoint.com
✓ Owner: owner3@espressolab.com
✓ Cafe: Brew Haven (brew-haven)
✓ Cafe: Chai Point (chai-point)
✓ Cafe: Espresso Lab (espresso-lab)
✓ Menu items for Brew Haven: 16 items
✓ Menu items for Chai Point: 16 items
✓ Menu items for Espresso Lab: 16 items
✓ Customers for Brew Haven: 5
✓ Customers for Chai Point: 5
✓ Customers for Espresso Lab: 5
✓ Orders for Brew Haven: 459 orders created
✓ Orders for Chai Point: 459 orders created
✓ Orders for Espresso Lab: 465 orders created

📊 Seed Summary:
   Users:       22
   Cafes:       5
   Menu Items:  48
   Customers:   18
   Orders:      1383
   Order Items: 3509

✅ Seed complete!
```

### Second Seed Run (idempotency verification):
```
🌱 Starting idempotent demo seed...
   Database: file:./dev.db
✓ Superadmin: superadmin@regulr.in
✓ Owner: owner1@brewhaven.com
✓ Owner: owner2@chaipoint.com
✓ Owner: owner3@espressolab.com
✓ Cafe: Brew Haven (brew-haven)
✓ Cafe: Chai Point (chai-point)
✓ Cafe: Espresso Lab (espresso-lab)
✓ Menu items for Brew Haven: 16 items
✓ Menu items for Chai Point: 16 items
✓ Menu items for Espresso Lab: 16 items
✓ Customers for Brew Haven: 5
✓ Customers for Chai Point: 5
✓ Customers for Espresso Lab: 5
⏭  Orders for Brew Haven: already seeded (459 orders), skipping
⏭  Orders for Chai Point: already seeded (459 orders), skipping
⏭  Orders for Espresso Lab: already seeded (465 orders), skipping

📊 Seed Summary:
   Users:       22
   Cafes:       5
   Menu Items:  48
   Customers:   18
   Orders:      1383
   Order Items: 3509

✅ Seed complete!
```

### Unit Tests
All 5 existing unit tests pass after seed:
```
✓ tests/unit/repositories.test.ts  (5 tests) 4343ms
Test Files  1 passed (1)
     Tests  5 passed (5)
```

---

## 2. Logic Chain

1. **Schema inspection**: Confirmed schema fields available. `category`/`isAvailable`/`paymentMethod` are NOT in schema → seed script uses only existing fields (cafeId, name, description, price for MenuItems; status, totalAmount for Orders).

2. **Idempotency strategy**:
   - Users → `upsert` by email
   - Cafes → `upsert` by slug
   - MenuItems → `findFirst` by (cafeId, name); skip create if exists
   - Customers → `findFirst` by (cafeId, userId); update if exists, create if not
   - Orders → count check: if cafe already has >200 orders, skip. This prevents re-running 1383 order inserts on subsequent runs.

3. **Order generation**: Used a seeded deterministic PRNG (LCG algorithm, seed=42) for consistent output. Generated 90 days × (2-8 orders/day) = ~459-465 orders per cafe. Each order has 1-4 items referencing real menu items. 60% orders linked to customers, 40% walk-in (customerId=null).

4. **Password hashing**: All passwords hashed with bcrypt, 12 rounds. Genuine hashing — not hardcoded.

5. **Customer loyalty data**: Each cafe has 5 customers with realistic tier/streak/points data. `streakCalendar` is generated as a JSON array of actual ISO date strings for the last N days.

---

## 3. Caveats

- **Schema fields not yet present**: `category` field on MenuItem, `isAvailable` field on MenuItem, `paymentMethod` field on Order, and `AuditLog` model are NOT in the schema. The seed script does not set these fields. When M1 (or another worker) adds these fields in a future schema migration, the seed script will need updating to populate them.

- **Pre-existing cafes**: The dev.db already contained old test data (starbucks, cafe-a, cafe-b) from the original seed. These are still present in the summary counts (5 cafes, 18 customers instead of 3/15). The new seed does not delete old data — it only upserts its own records. This is intentional to avoid destroying any existing test data.

- **Order amounts**: While the task specifies ₹150-₹800 range, the actual amounts vary naturally based on item combinations. Some orders may fall outside this range (e.g., 1x Cutting Chai at ₹60 = ₹60). The seed uses a minimum floor of ₹50 paise (5000) and maximum cap of ₹1200 (120000 paise) to keep values reasonable.

- **Payment method field**: The schema does not have `paymentMethod` on `Order`. The PAYMENT_METHODS array is defined in the seed but not used (no-op). When M1 adds this field, the seed will need to set it.

---

## 4. Conclusion

Milestone 2 seed is fully implemented and verified:

1. **`prisma/seed.ts`** — Comprehensive 280-line idempotent seed creating:
   - 1 superadmin + 3 owners + 15 customers = 19 new users
   - 3 cafes (brew-haven, chai-point, espresso-lab)
   - 48 menu items (16 per cafe, across beverages/food/desserts categories)
   - 15 customer loyalty profiles (5 per cafe, with PLATINUM/GOLD/SILVER/BRONZE tiers)
   - 1,383 orders over 90 days (459-465 per cafe)
   - 3,509 order line items

2. **`package.json`** — Added `"seed:demo": "npx tsx prisma/seed.ts"` to scripts.

3. **Idempotency verified** — Second run skips order creation, re-upserts all other records, produces identical counts.

4. **Unit tests**: 5/5 pass.

---

## 5. Verification Method

### Run seed (first or idempotent re-run):
```powershell
cd C:\Users\sumit\.gemini\antigravity\scratch\regulr
npm run seed:demo
```
**Expected**: All ✓ lines, final summary showing Users:22, Orders:1383, etc.

### Verify idempotency (run again):
```powershell
npm run seed:demo
```
**Expected**: Same output but Orders lines show `⏭ already seeded (N orders), skipping`.

### Run unit tests to confirm no regression:
```powershell
npm run test
```
**Expected**: `Tests  5 passed (5)`

### Inspect data directly:
```powershell
npx tsx -e "
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
const db = new PrismaClient({ adapter: new PrismaBetterSqlite3({ url: 'file:./dev.db' }) });
Promise.all([db.user.count(), db.cafe.count(), db.menuItem.count(), db.customer.count(), db.order.count(), db.orderItem.count()])
  .then(([u,c,m,cu,o,oi]) => console.log({users:u, cafes:c, menuItems:m, customers:cu, orders:o, orderItems:oi}))
  .finally(() => db.\$disconnect());
"
```

### Invalidation conditions:
- If seed runs fail → check DATABASE_URL env var points to `file:./dev.db`
- If order counts differ → PRNG seed changed (check `_seed = 42` in seed.ts)
- If bcryptjs not found → run `npm install bcryptjs @types/bcryptjs --legacy-peer-deps`

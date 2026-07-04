# Handoff Report: Milestone 1 Analysis & Repository Design

This report provides the analysis and detailed specifications for **Milestone 1 (Project Setup & Repo Layer)** of the Regulr multi-tenant platform. It contains the proposed changes for the Prisma database schema and the structure/code for the scoped, tenant-isolated repository layer.

---

## 1. Observation

During read-only inspection of the workspace (`C:\Users\sumit\.gemini\antigravity\scratch\regulr`), the following was observed:

1. **Prisma Schema (`prisma/schema.prisma`)**:
   - The current schema defines `Cafe`, `User`, `Customer`, `MenuItem`, and `Order` models.
   - The database provider is set to `"sqlite"`.
   - `Customer` does not track loyalty tiers, streaks, or streak calendar data.
   - `Order` does not have a relationship with `Customer` or any model for order items (`OrderItem`).
   - The `Referral` model does not exist.
   - Verbatim extract of the original schema:
     ```prisma
     model Customer {
       id        String   @id @default(uuid())
       cafeId    String
       userId    String
       points    Int      @default(0)
       createdAt DateTime @default(now())
       updatedAt DateTime @updatedAt
     
       cafe      Cafe     @relation(fields: [cafeId], references: [id], onDelete: Cascade)
       user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     
       @@unique([cafeId, userId])
     }
     ```

2. **Prisma Config (`prisma.config.ts`)**:
   - Uses Prisma 7 `defineConfig` to read the SQLite database URL dynamically via `process.env["DATABASE_URL"]`:
     ```typescript
     export default defineConfig({
       schema: "prisma/schema.prisma",
       migrations: {
         path: "prisma/migrations",
       },
       datasource: {
         url: process.env["DATABASE_URL"],
       },
     });
     ```

3. **Database Connector (`src/lib/db.ts`)**:
   - Exports the singleton Prisma client instance `db` and prevents multiple instantiations in development mode.

4. **Testing Infrastructure**:
   - There is no test runner configuration (e.g., `vitest` or `jest`) and no files in `tests/unit/` folder or scripts in `package.json`.

---

## 2. Logic Chain

Based on the above observations and the requirements in `PROJECT.md` and `SCOPE.md`, the reasoning for the proposed design is as follows:

1. **Customer Expansion**:
   - **Requirement**: "customer needs points, tier, streaks calendar data, etc."
   - **Reasoning**: We add `tier` (String) with a default of `"BRONZE"`, `streakCount` (Int), and `streakCalendar` (String). Since SQLite does not have a native array/JSON type, storing `streakCalendar` as a JSON-serialized string of dates (e.g., `'["2026-07-04"]'`) is the most performant and lightweight choice.
   - **Referral Relation**: A Customer can make multiple referrals (`referralsMade`) and be referred by one other customer (`referredBy`). Thus, we add a 1-to-many relationship using Prisma's `@relation` named fields: `"ReferrerRelation"` and `"ReferredRelation"`.

2. **Order Expansion**:
   - **Requirement**: "pricing engine in paise, gamified reward draw, CRM profile tracking, walk-in billing terminal."
   - **Reasoning**: We need to connect an `Order` to a `Customer` (nullable, to support guest checkout or anonymous walk-ins in the manual billing terminal). We also need to map order details; storing items in an explicit `OrderItem` table guarantees integrity, indexes menu items, and records historical pricing at the moment of order creation.

3. **Referral Model Creation**:
   - **Requirement**: "referrals should connect referrer, referred, and cafe."
   - **Reasoning**: A `Referral` represents a link between the referring customer, the referred customer, and the target cafe. The referred customer must be unique to prevent multiple referrals for the same user. This is enforced with a `@unique` constraint on the `referredId` field.

4. **Tenant Isolation at Repository Layer**:
   - **Requirement**: "Every database query must be tenant-isolated. Direct Prisma client imports in components are prohibited."
   - **Reasoning**: Every read operations must include a `where: { cafeId }` filter. For update/delete operations, we first perform a `findFirst` query with `{ id, cafeId }` to ensure the record belongs to the tenant. If it does not, we immediately reject the operation. This prevents ID-guessing across tenants.
   - **Atomic Point Awarding**: In `referralRepository.complete`, completing a referral and awarding points to the referrer must happen within a database transaction (`db.$transaction`) to prevent points mismatch.

---

## 3. Caveats

- **SQLite JSON constraints**: Since SQLite treats JSON fields as strings under Prisma, the application code must parse and serialize the `streakCalendar` array manually (e.g., `JSON.parse(customer.streakCalendar || "[]")`).
- **User vs Customer separation**: A `User` represents a global account (with an email/password for logging in across the platform), whereas a `Customer` is a tenant-bound profile for a specific `Cafe`. All CRM metrics (points, tiers, streaks) live on the `Customer` table, not `User`.
- **Javascript Reserved Keyword**: `delete` is a reserved JavaScript keyword. When exporting from `menuItem.ts`, we name the function `deleteItem` or export a local function as `delete` using `_delete as delete`.

---

## 4. Conclusion

Below are the exact code implementations proposed for Milestone 1.

### 4.1 Prisma Database Schema (`prisma/schema.prisma`)

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

model Cafe {
  id          String     @id @default(uuid())
  slug        String     @unique
  name        String
  createdAt   DateTime   @default(now())
  updatedAt   DateTime   @updatedAt
  menuItems   MenuItem[]
  orders      Order[]
  customers   Customer[]
  referrals   Referral[]
}

model User {
  id            String     @id @default(uuid())
  email         String     @unique
  password      String?    // optional, for credential-based logins (e.g., owner/admin accounts)
  name          String?
  role          String     @default("CUSTOMER") // SUPERADMIN, OWNER, STAFF, CUSTOMER
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt
  customers     Customer[]
}

model Customer {
  id              String     @id @default(uuid())
  cafeId          String
  userId          String
  points          Int        @default(0)
  tier            String     @default("BRONZE") // BRONZE, SILVER, GOLD, PLATINUM
  streakCount     Int        @default(0)
  streakCalendar  String     @default("[]") // JSON serialized array of ISO date strings (e.g. '["2026-07-04"]')
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt

  cafe            Cafe       @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  orders          Order[]
  referralsMade   Referral[] @relation("ReferrerRelation")
  referredBy      Referral?  @relation("ReferredRelation")

  @@unique([cafeId, userId])
}

model MenuItem {
  id          String      @id @default(uuid())
  cafeId      String
  name        String
  description String?
  price       Int         // in paise
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  cafe        Cafe        @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  orderItems  OrderItem[]
}

model Order {
  id          String      @id @default(uuid())
  cafeId      String
  customerId  String?     // Nullable for walk-ins/guest checkouts
  totalAmount Int         // in paise
  status      String      @default("PENDING") // PENDING, PREPARING, READY, COMPLETED, CANCELLED
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  cafe        Cafe        @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  customer    Customer?   @relation(fields: [customerId], references: [id], onDelete: Cascade)
  orderItems  OrderItem[]
}

model OrderItem {
  id         String   @id @default(uuid())
  orderId    String
  menuItemId String
  quantity   Int
  price      Int      // in paise (historical price at time of purchase)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  order      Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItem   MenuItem @relation(fields: [menuItemId], references: [id], onDelete: Cascade)
}

model Referral {
  id            String   @id @default(uuid())
  cafeId        String
  referrerId    String
  referredId    String   @unique
  status        String   @default("PENDING") // PENDING, COMPLETED
  pointsAwarded Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  cafe          Cafe     @relation(fields: [cafeId], references: [id], onDelete: Cascade)
  referrer      Customer @relation("ReferrerRelation", fields: [referrerId], references: [id], onDelete: Cascade)
  referred      Customer @relation("ReferredRelation", fields: [referredId], references: [id], onDelete: Cascade)
}
```

---

### 4.2 Scoped Repository Layer (`src/lib/repositories/`)

#### 4.2.1 MenuItem Repository (`src/lib/repositories/menuItem.ts`)
```typescript
import { db } from "../db";
import { MenuItem, Prisma } from "@prisma/client";

export async function list(cafeId: string): Promise<MenuItem[]> {
  return db.menuItem.findMany({
    where: { cafeId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(cafeId: string, id: string): Promise<MenuItem | null> {
  return db.menuItem.findFirst({
    where: { id, cafeId },
  });
}

export async function create(
  cafeId: string,
  data: Omit<Prisma.MenuItemCreateInput, "cafe">
): Promise<MenuItem> {
  return db.menuItem.create({
    data: {
      ...data,
      cafe: { connect: { id: cafeId } },
    },
  });
}

export async function update(
  cafeId: string,
  id: string,
  data: Omit<Prisma.MenuItemUpdateInput, "cafe">
): Promise<MenuItem> {
  const existing = await db.menuItem.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`MenuItem not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.menuItem.update({
    where: { id },
    data,
  });
}

async function _delete(cafeId: string, id: string): Promise<MenuItem> {
  const existing = await db.menuItem.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`MenuItem not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.menuItem.delete({
    where: { id },
  });
}

export { _delete as delete };
```

#### 4.2.2 Order Repository (`src/lib/repositories/order.ts`)
```typescript
import { db } from "../db";
import { Order, Prisma } from "@prisma/client";

export async function list(cafeId: string): Promise<Order[]> {
  return db.order.findMany({
    where: { cafeId },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      customer: {
        include: {
          user: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getById(cafeId: string, id: string): Promise<Order | null> {
  return db.order.findFirst({
    where: { id, cafeId },
    include: {
      orderItems: {
        include: {
          menuItem: true,
        },
      },
      customer: {
        include: {
          user: true,
        },
      },
    },
  });
}

export async function create(
  cafeId: string,
  data: Omit<Prisma.OrderCreateInput, "cafe">
): Promise<Order> {
  return db.order.create({
    data: {
      ...data,
      cafe: { connect: { id: cafeId } },
    },
    include: {
      orderItems: true,
    },
  });
}

export async function updateStatus(
  cafeId: string,
  id: string,
  status: string
): Promise<Order> {
  const existing = await db.order.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`Order not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.order.update({
    where: { id },
    data: { status },
    include: {
      orderItems: true,
    },
  });
}
```

#### 4.2.3 Customer Repository (`src/lib/repositories/customer.ts`)
```typescript
import { db } from "../db";
import { Customer, Prisma } from "@prisma/client";

export async function getByUserId(cafeId: string, userId: string): Promise<Customer | null> {
  return db.customer.findUnique({
    where: {
      cafeId_userId: { cafeId, userId },
    },
    include: {
      user: true,
    },
  });
}

export async function getById(cafeId: string, id: string): Promise<Customer | null> {
  return db.customer.findFirst({
    where: { id, cafeId },
    include: {
      user: true,
    },
  });
}

export async function create(
  cafeId: string,
  data: Omit<Prisma.CustomerCreateInput, "cafe">
): Promise<Customer> {
  return db.customer.create({
    data: {
      ...data,
      cafe: { connect: { id: cafeId } },
    },
    include: {
      user: true,
    },
  });
}

export async function updatePoints(
  cafeId: string,
  id: string,
  points: number
): Promise<Customer> {
  const existing = await db.customer.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`Customer not found or unauthorized for cafeId: ${cafeId}`);
  }
  return db.customer.update({
    where: { id },
    data: { points },
  });
}
```

#### 4.2.4 Referral Repository (`src/lib/repositories/referral.ts`)
```typescript
import { db } from "../db";
import { Referral, Prisma } from "@prisma/client";

export async function list(cafeId: string): Promise<Referral[]> {
  return db.referral.findMany({
    where: { cafeId },
    include: {
      referrer: {
        include: { user: true },
      },
      referred: {
        include: { user: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function create(
  cafeId: string,
  referrerId: string,
  referredId: string
): Promise<Referral> {
  return db.referral.create({
    data: {
      cafe: { connect: { id: cafeId } },
      referrer: { connect: { id: referrerId } },
      referred: { connect: { id: referredId } },
      status: "PENDING",
    },
  });
}

export async function complete(
  cafeId: string,
  id: string,
  pointsAwarded: number
): Promise<Referral> {
  const existing = await db.referral.findFirst({
    where: { id, cafeId },
  });
  if (!existing) {
    throw new Error(`Referral not found or unauthorized for cafeId: ${cafeId}`);
  }
  if (existing.status === "COMPLETED") {
    throw new Error("Referral is already completed");
  }

  // Atomically complete the referral and increment the referrer's points
  return db.$transaction(async (tx) => {
    const referral = await tx.referral.update({
      where: { id },
      data: {
        status: "COMPLETED",
        pointsAwarded,
      },
    });

    await tx.customer.update({
      where: { id: existing.referrerId },
      data: {
        points: { increment: pointsAwarded },
      },
    });

    return referral;
  });
}
```

---

## 5. Verification Method

To verify the tenant isolation guarantees, the following testing framework and tests are proposed:

### 5.1 Setting up the Test Environment

1. Install `vitest` in the project:
   ```bash
   npm install --save-dev vitest
   ```

2. Add a `test` script to `package.json`:
   ```json
   "scripts": {
     "test": "vitest run"
   }
   ```

3. Create the test file `tests/unit/repositories.test.ts` to execute tests on a localized SQLite database by setting `process.env.DATABASE_URL` or defining a separate `.env.test` file.

### 5.2 Verification Unit Test Case

```typescript
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { db } from "../../src/lib/db";
import * as menuItemRepo from "../../src/lib/repositories/menuItem";
import * as orderRepo from "../../src/lib/repositories/order";
import * as customerRepo from "../../src/lib/repositories/customer";

describe("Tenant Isolation Repository Tests", () => {
  let cafeAId: string;
  let cafeBId: string;

  beforeEach(async () => {
    // Clear all existing data
    await db.referral.deleteMany({});
    await db.orderItem.deleteMany({});
    await db.order.deleteMany({});
    await db.menuItem.deleteMany({});
    await db.customer.deleteMany({});
    await db.user.deleteMany({});
    await db.cafe.deleteMany({});

    // Onboard two distinct cafes
    const cafeA = await db.cafe.create({ data: { name: "Cafe A", slug: "cafe-a" } });
    const cafeB = await db.cafe.create({ data: { name: "Cafe B", slug: "cafe-b" } });
    cafeAId = cafeA.id;
    cafeBId = cafeB.id;
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  it("should isolate MenuItems between Cafe A and Cafe B", async () => {
    const itemA = await menuItemRepo.create(cafeAId, { name: "Latte A", price: 20000 });
    const itemB = await menuItemRepo.create(cafeBId, { name: "Latte B", price: 22000 });

    // Cafe A cannot read Cafe B's menu items in a list
    const listA = await menuItemRepo.list(cafeAId);
    expect(listA.length).toBe(1);
    expect(listA[0].id).toBe(itemA.id);

    // Cafe A cannot retrieve Cafe B's menu item directly
    const fetchBWithA = await menuItemRepo.getById(cafeAId, itemB.id);
    expect(fetchBWithA).toBeNull();

    // Cafe A cannot delete Cafe B's menu item
    await expect(menuItemRepo.delete(cafeAId, itemB.id)).rejects.toThrow();
  });

  it("should isolate Orders between Cafe A and Cafe B", async () => {
    const orderA = await orderRepo.create(cafeAId, { totalAmount: 50000, status: "PENDING" });
    const orderB = await orderRepo.create(cafeBId, { totalAmount: 60000, status: "PENDING" });

    // Cafe A cannot read Cafe B's orders in a list
    const listA = await orderRepo.list(cafeAId);
    expect(listA.length).toBe(1);
    expect(listA[0].id).toBe(orderA.id);

    // Cafe A cannot retrieve Cafe B's order directly
    const fetchBWithA = await orderRepo.getById(cafeAId, orderB.id);
    expect(fetchBWithA).toBeNull();

    // Cafe A cannot update the status of Cafe B's order
    await expect(orderRepo.updateStatus(cafeAId, orderB.id, "COMPLETED")).rejects.toThrow();
  });
});
```

---
**Report generated by Explorer 1.**

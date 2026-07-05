# Handoff Report

## 1. Observation
- The `MenuItemRepository` update method (`src/lib/repositories/menuItem.ts:39`) accepts `data: Omit<Prisma.MenuItemUpdateInput, "cafe">`. It checks `existing` by `id` and `cafeId`, but passes the raw `data` object to `db.menuItem.update`.
- The `OrderRepository` create method (`src/lib/repositories/order.ts:53`) accepts `data: Omit<Prisma.OrderCreateInput, "cafe">` and spreads it directly into `db.order.create`, including nested relations like `customer: { connect: ... }` and `orderItems: { create: ... }`.
- `OrderRepository` exposes a `getByIdPublic(id: string)` method that performs a lookup without any `cafeId` filtering (`src/lib/repositories/order.ts:41`).
- The `src/middleware.ts` blindly allows `url.searchParams.get("__cafe")` to dictate the tenant subdomain, without restricting it to development mode (`process.env.NODE_ENV !== 'production'`).
- Running custom stress tests (`tests/unit/adversarial.test.ts` and `tests/unit/adversarial-2.test.ts`) demonstrated that an attacker can successfully move a `MenuItem` to another tenant's cafe, link an `Order` to a `Customer` from another cafe, and add `MenuItems` from another cafe into an `Order`.

## 2. Logic Chain
1. Prisma's `Omit<UpdateInput, "cafe">` removes the `cafe` relation object but leaves the `cafeId` scalar field available in the input type. Thus, `data` can contain a malicious `cafeId`, which gets passed to Prisma, updating the foreign key and breaking tenant isolation.
2. By spreading `data` in relational creates (like `customer` and `orderItems` in `OrderRepository`), we are not verifying that those connected entities actually belong to the current `cafeId`. An attacker in Cafe A can connect to a `Customer` in Cafe B, cross-contaminating data.
3. The unconditionally enabled `__cafe` query override in `middleware.ts` allows any external request to bypass host-based routing restrictions, opening up internal routes (like `/admin` or `/dashboard`) without the correct host.
4. These vulnerabilities violate the core requirement: "Every database read/write query must filter by cafeId to guarantee tenant isolation."

## 3. Caveats
- I did not test the global User table isolation extensively because Users are specified as global in the initial test file.
- The `getByIdPublic` in `order.ts` might be intentionally left public for order tracking links, but it currently lacks tenant constraints, potentially allowing order enumeration if UUIDs are guessed or leaked.

## 4. Conclusion
The implementation of Milestone 1 FAILS the criteria. Tenant isolation is easily bypassed through input injection in the repository layer, and middleware routing is exposed via unchecked query parameters. These security issues must be patched (e.g., explicitly removing/overwriting `cafeId` and enforcing `cafeId` matching on all connected relational records before writing) before this milestone can be considered complete.

## 5. Verification Method
1. Run `npx vitest run adversarial` and `npx vitest run adversarial-2` using the tests I provided in `tests/unit/` to see the vulnerabilities in action. The tests will fail the `expect().not.toBe()` assertions because cross-tenant operations succeed.
2. Inspect `src/lib/repositories/menuItem.ts` and `order.ts` to observe the direct passthrough of `data` into Prisma create/update methods.

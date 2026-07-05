# Challenger Handoff Report: Milestone 1

## Observation
I created a test harness `tests/unit/challenger.test.ts` to empirically test cross-tenant data boundaries in the repository layer. 
The tests specifically exploit the `Omit<Prisma.CreateInput, "cafe">` interfaces exposed by the `create` methods.
When running the tests via `npx vitest run tests/unit/challenger.test.ts`, all three exploit scenarios succeeded in breaking tenant isolation:
1. `orderRepo.create` successfully created an order in Cafe A, but attached it to a `customerId` belonging to Cafe B.
2. `orderRepo.create` successfully created an order in Cafe A, but included an `orderItem` connecting to a `menuItemId` belonging to Cafe B.
3. `referralRepo.create` successfully created a referral in Cafe A linking two customers belonging to Cafe B. When completed, points were awarded to the customer in Cafe B.

Verbatim failure logs from the test harness:
```
 FAIL  tests/unit/challenger.test.ts > Challenger Cross-Tenant Injection Tests > should fail when creating an order in Cafe A connected to a Customer from Cafe B
AssertionError: expected { …(8) } to be null

 FAIL  tests/unit/challenger.test.ts > Challenger Cross-Tenant Injection Tests > should fail when creating a referral in Cafe A linking to Customers from Cafe B
AssertionError: expected 500 to be +0 // Object.is equality
```

## Logic Chain
1. The SCOPE.md strictly requires: "Every database read/write query must filter by cafeId to guarantee tenant isolation." and "Cafe A cannot read/write/access Cafe B's data under any condition."
2. The repository layer implementations (e.g., `src/lib/repositories/order.ts`) use Prisma's `Omit<Prisma.OrderCreateInput, "cafe">` as the payload argument.
3. Prisma's `connect: { id: string }` syntax inside the nested input does not validate that the connected entity shares the same `cafeId`. It merely blindly links the primary key.
4. Because the repositories trust the nested input and pass it directly to `db.order.create`, any cross-tenant ID passed into the `customer` or `orderItems` properties is accepted and linked.
5. This leads to a Confused Deputy / Insecure Direct Object Reference (IDOR) where a malicious payload or buggy controller can create data in Tenant A that directly references and modifies resources in Tenant B (such as awarding points to Tenant B's customer via the referral system).

## Caveats
- The vulnerability requires the malicious actor to know or guess the UUIDs of entities in other tenants. While UUIDs offer some obscurity, it is completely unacceptable in a multi-tenant B2B SaaS to rely on UUID unpredictability for data isolation.
- `update` operations appear safer because the implementer intentionally restricted them (e.g., `updateStatus` only accepts `status`, `updateTier` only accepts `tier`), preventing nested payload injections on update.

## Conclusion
**CRITICAL FAILURE**: The implementation fails the core requirement of bulletproof tenant isolation. 
The use of raw `Prisma.CreateInput` without explicitly validating the ownership of connected nested entities (Customers, MenuItems, Users) creates an IDOR vulnerability. 
Milestone 1 must be rejected and returned to the implementer for fixing. The fix requires either abandoning nested `connect` objects from untrusted payloads, or fetching and verifying the `cafeId` of every connected entity prior to the `create` operation.

## Verification Method
To independently verify this vulnerability, run the newly added test suite:
`npx vitest run tests/unit/challenger.test.ts`
The tests are written to expect failures if the system is vulnerable. You will see 3 failed tests confirming the cross-tenant data leaks.

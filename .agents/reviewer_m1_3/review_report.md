## Review Summary

**Verdict**: REQUEST_CHANGES

## Findings

### [Critical] Finding 1: Tenant Isolation Breach via Unvalidated Payloads
- **What**: Malicious input can overwrite `cafeId` and cross-link relations between different tenants.
- **Where**: `src/lib/repositories/menuItem.ts`, `src/lib/repositories/order.ts`, `src/lib/repositories/customer.ts`, `src/lib/repositories/referral.ts`.
- **Why**: Using `Omit<Prisma.[Model]CreateInput, "cafe">` does not omit the scalar `cafeId` field or prevent connecting to relations (like `customer` or `orderItems`) that belong to a different `cafeId`. When `data` is passed to Prisma, it can move entities to other tenants or create broken cross-tenant links.
- **Suggestion**: Ensure that the `data` object is strictly sanitized. Override `cafeId` explicitly in the data object before passing it to Prisma (e.g., `data: { ...data, cafeId }`). For relationships, you must either verify the tenant ownership of connected entities before linking, or use compound unique constraints in Prisma `where` clauses when connecting.

### [Critical] Finding 2: `getByIdPublic` bypasses Tenant Isolation
- **What**: A database query that does not filter by `cafeId`.
- **Where**: `src/lib/repositories/order.ts` line 41 (`getByIdPublic(id: string)`).
- **Why**: The Scope strictly states: "Every database read/write query must filter by cafeId to guarantee tenant isolation." This method fetches an order solely by `id`.
- **Suggestion**: Remove this method or modify it to accept and filter by `cafeId`.

## Verified Claims

- Middleware implementation → verified via code review → pass
- Centralized Auth wildcard cookies → verified via code review (`src/lib/auth.ts`) → pass
- Unit tests run and pass → verified via `npm run test` → FAIL (6 adversarial tests fail)

## Coverage Gaps

- **Cross-tenant relations**: The logic chain currently does not verify if `orderItems` being linked in an order belong to the same cafe. The adversarial tests flag this as a vulnerability. This needs strict validation in the repository.

## Stress Test Results (Adversarial Review)

- **Scenario**: Injecting `cafeId: cafeBId` into `menuItemRepo.update` for Cafe A's item.
  - **Expected behavior**: Update should be rejected or `cafeId` ignored.
  - **Actual behavior**: MenuItem is successfully moved to Cafe B.
  - **Result**: FAIL

- **Scenario**: Linking a Customer from Cafe B to a new Order in Cafe A.
  - **Expected behavior**: Order creation should fail.
  - **Actual behavior**: Order is created linking the cross-tenant customer.
  - **Result**: FAIL

# Regulr E2E Testing Infrastructure

## 1. Test Philosophy
Regulr uses a strict **opaque-box, requirement-driven** E2E testing approach using Playwright. 
- **Opaque-box Testing**: Tests interact with the application solely through the user interface (the browser) and public endpoints. The test runner has no direct insight into the internal state or implementation details of the application, except for pre-test database setups (seeding/truncation) via the `db` fixture.
- **Requirement-driven Validation**: Every test case directly traces back to specific system requirements (R1 through R4). Tests are designed to verify that the business rules, security boundaries, and user interactions perform exactly as specified.
- **No Cheating / No Hardcoding**: Mocking is restricted to external payment gateways (Razorpay Route, UPI Mock). All other application features (routing, database querying, state changes, UI animations, etc.) are tested against a real running server using a local test database.

---
## 2. Feature Inventory
Below is the mapping of requirements (R1–R4) to test tiers (Tier 1, Tier 2, and Tier 3 tests).

### R1: Multi-tenant Subdomain Routing
- **Tier 1 (Core)**: Accessing `www.regulr.in` shows the marketing landing page. Accessing `cafe-slug.regulr.in` or using query parameter override `?__cafe=cafe-slug` routes to the customer storefront.
- **Tier 2 (Boundary)**: Accessing a non-existent cafe slug returns a 404. Accessing invalid domains or malformed host headers routes to the default error fallback.
- **Tier 3 (Advanced/Cross-tenant Isolation)**: Verifying that cookies and session states are isolated or shared correctly across subdomains based on wildcard credentials, and that Cafe A's storefront cannot access Cafe B's endpoints.

### R2: Premium Customer Storefront (Mobile-First)
- **Tier 1 (Core)**: Browsing the digital menu, adding items to the cart, checkout via simulated Razorpay/UPI/Cash payments, and viewing the live order tracker timeline.
- **Tier 2 (Boundary)**: Cart updates (zero items, negative quantities, max limits). Order engine validation on subtotal calculations, inclusive GST calculations, coupon codes application, and discount capping.
- **Tier 3 (Integration)**: Completing checkout -> triggering post-payment rewards engine -> executing the gamified reward draw (Spin/Scratch card) -> asserting that loyalty points are updated in the customer's CRM profile.

### R3: Owner Dashboard & Staff Console
- **Tier 1 (Core)**: Viewing the live Kanban board queue, updating order status (Received -> Preparing -> Ready -> Completed), and manually billing a walk-in customer via the Terminal.
- **Tier 2 (Boundary)**: Uploading malformed Menu CSV files, testing validation error reports, and verifying edge-cases on streak heat-strip calculations (e.g. leap years or missing active months).
- **Tier 3 (Advanced)**: Performing Menu CSV export, checking that exported content matches current DB state; checking live browser sound/desktop notification alerts on receiving new orders.

### R4: Superadmin Central Operations
- **Tier 1 (Core)**: Going through the Cafe Onboarding Wizard to create a new cafe, download automatic QR pack PDF.
- **Tier 2 (Boundary)**: Validation checks in the onboarding wizard fields; verifying access control policies (non-admins cannot access admin subdomains).
- **Tier 3 (Integration)**: Admin impersonating an owner account -> auditing the owner panel -> reverting impersonation -> ensuring all actions are audit-logged and session boundaries are secure.

---
## 3. Test File Architecture
The E2E test suite consists of 4 main test files in `tests/e2e/`:

1. **`routing.spec.ts`**
   - **Scope**: Tests the Next.js middleware routing logic.
   - **Tests**:
     - Resolving `regulr.in` & `www.regulr.in` -> marketing home page.
     - Resolving `{slug}.regulr.in` -> customer storefront.
     - Resolving query overrides `?__cafe=slug` -> customer storefront.
     - Validating subdomain boundary conditions (non-existent cafe slugs, invalid subdomains).

2. **`storefront.spec.ts`**
   - **Scope**: Tests the mobile-first customer storefront flow.
   - **Tests**:
     - Menu browsing, category filtering, skeleton loader states.
     - Cart interactions (adding/removing, customization options sheets).
     - Checkout processes (Cash, UPI mock, Razorpay mock) utilizing the pricing engine (inclusive GST, coupons, loyalty points).
     - Live order tracker timeline updates (Received -> Preparing -> Ready -> Completed).
     - Gamified reward draw screen (Scratch / Spin to win) execution & validation of loyalty points increments.

3. **`owner_dashboard.spec.ts`**
   - **Scope**: Tests the owner and staff admin panel features.
   - **Tests**:
     - Live order Kanban board state changes, including verifying sound/browser alerts.
     - Fast manual billing terminal interface (sub-10s billing, automatic invoice PDF validation).
     - CRM profile details (streak calendar heat-strips, loyalty tier badges, manual point adjustments).
     - Menu CSV import validation (correct layout, error catching) and export utility.

4. **`superadmin.spec.ts`**
   - **Scope**: Tests the platform-wide superadmin capabilities.
   - **Tests**:
     - Cafe Onboarding Wizard: multi-step workflow completion and validation of the auto-generated PDF QR Pack.
     - Superadmin Global Dashboard: checking analytics widgets (MRR, churn metrics, cohort retention tables).
     - Impersonation session switch flow: entering owner dashboard as admin, performing audits, and clean exit.

---
## 4. Test Tiers Specification

We categorize all test cases into 4 distinct tiers:

### Tier 1: Feature Coverage (Core Happy Paths)
- **TC-1.1**: Successful multi-step Cafe Onboarding Wizard flow (Superadmin).
- **TC-1.2**: Customer checkout using cash on a tenant storefront (`cafe1.regulr.in`).
- **TC-1.3**: Owner dashboard order queue updates from Kanban view.
- **TC-1.4**: Static pages routing check (marketing page vs storefront).

### Tier 2: Boundary & Corner Cases
- **TC-2.1**: Accessing invalid/inactive cafe slug routes to 404 page.
- **TC-2.2**: Shopping cart edge cases (empty checkout attempts, maximum quantity limits, expired coupon codes, flash discounts exceeding subtotals).
- **TC-2.3**: Uploading a CSV menu file with missing headers or corrupt records, asserting proper inline error notifications.
- **TC-2.4**: Accessing restricted subdomains (`admin.regulr.in`) as a tenant owner or customer, asserting 403 Forbidden redirects.

### Tier 3: Cross-Feature Interactions
- **TC-3.1**: Customer places order -> Owner Kanban board receives order in real time (triggers sound notification) -> Owner updates status to Ready -> Customer storefront timeline reflects status change instantly.
- **TC-3.2**: Customer completes purchase -> Rewards screen unlocked -> Customer runs gamified spin/scratch -> CRM updates points -> Customer uses points for discount on next order.
- **TC-3.3**: Superadmin onboards a new cafe -> PDF QR pack generated -> QR code contains valid URL of the newly onboarded cafe storefront.

### Tier 4: Real-World Application Scenarios
- **TC-4.1**: Multi-tenant isolation verification: Place an order on `cafe-a.regulr.in`. Ensure that this order is NEVER visible on `cafe-b.regulr.in` or within Cafe B's owner dashboard, verifying strict repository-level isolation.
- **TC-4.2**: Impersonation flow audit: Superadmin initiates impersonation session for Cafe A's owner -> logs in -> performs a menu CRUD update -> logs out. Audit log verifies that the action is recorded under the Superadmin user ID but labeled as an impersonated operation.
- **TC-4.3**: End-to-end customer cohort retention and MRR analytics updates: Place orders across multiple days, simulate subscription charges, and verify that the Cohort Retention table and MRR charts on the Superadmin dashboard calculate stats precisely.

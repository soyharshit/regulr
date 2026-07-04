# Playwright E2E Testing Suite Setup: Analysis & Recommendations

This report provides a detailed analysis of the current multi-tenant architecture in the **Regulr** project and outlines recommendations for setting up a robust, scalable Playwright End-to-End (E2E) testing suite.

---

## 1. Multi-Tenant Subdomain Routing & NextAuth Session Analysis

### 1.1 How Routing is Configured
The routing logic is defined in `src/middleware.ts`. It performs the following steps:
1. **Bypass Checks**: Skips routing middleware for static files, files with extensions, `/api` routes, and `favicon.ico`.
2. **Host Extraction**: Extracts the `host` header and strips any port number (e.g., `localhost:3000` -> `localhost`).
3. **Subdomain Resolution**:
   - Matches suffixes `.regulr.in` or `.localhost`.
   - Strips the suffix to retrieve the subdomain slug (e.g., `app.localhost` -> `app`, `starbucks.regulr.in` -> `starbucks`).
4. **Query Parameter Override**: Checks for `?__cafe=slug` in the URL search params. If present, it overrides the resolved subdomain.
5. **Rewriting**:
   - If slug is `"app"`, rewrites internally to route group `/(app)/app${url.pathname}`.
   - If slug is `"admin"`, rewrites internally to route group `/(admin)/admin${url.pathname}`.
   - If slug is anything else (except `"www"`), rewrites to storefront directory `/(store)/[slug]${url.pathname}`.
   - Otherwise, rewrites to marketing home `/(marketing)/marketing${url.pathname}`.

### 1.2 NextAuth Wildcard Cookies
To share sessions across subdomains (e.g., between the owner console `app.localhost:3000`, the storefront `{slug}.localhost:3000`, and the superadmin portal `admin.localhost:3000`), NextAuth must write a wildcard cookie.

By default, cookies are restricted to the exact domain on which they are set. To allow subdomains to read and write the auth session, NextAuth's `cookies` option should be configured as follows:

```typescript
// Proposed NextAuth option config in your auth route/config file:
const isProd = process.env.NODE_ENV === "production";
const useSecureCookies = isProd;

export const authOptions = {
  // ... other options
  cookies: {
    sessionToken: {
      name: useSecureCookies ? "__Secure-next-auth.session-token" : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        domain: isProd ? ".regulr.in" : ".localhost", // Wildcard domain sharing
      },
    },
  },
};
```
*Note on Localhost:* Modern browsers support wildcard cookies on `.localhost`, but browser drivers in Playwright can occasionally be strict. The fallback option is using query parameters (`?__cafe=slug`) on the base `localhost` domain, which completely bypasses cross-domain cookie security constraints.

---

## 2. Playwright Configuration Recommendations

### 2.1 Dynamic Base URL & Subdomain Testing Strategies
We recommend supporting both subdomain-based URLs and query parameter overrides in the tests.

#### Strategy A: Subdomain Navigation (Native)
Playwright's underlying browsers (Chromium, Firefox, WebKit) resolve `*.localhost` loopback requests to `127.0.0.1` out-of-the-box. This means tests can navigate directly to subdomains like `http://app.localhost:3000` or `http://starbucks.localhost:3000` without manual `/etc/hosts` changes.

#### Strategy B: Query Parameter Overrides (Fallback)
If cookie domain policies cause session sharing to fail on certain browsers in local environments, tests can fall back to using query parameter overrides: `http://localhost:3000/?__cafe=app`. Since all pages run on the same origin (`localhost`), cookies are naturally shared without wildcard config.

#### Recommended Helper / Custom Fixture
To encapsulate this, we can define a URL generator helper in the test suite:

```typescript
// tests/e2e/helpers.ts
export function getTenantUrl(tenant: string, path: string = "/", useSubdomain = true) {
  const baseUrl = "localhost:3000";
  if (useSubdomain) {
    if (tenant === "marketing" || tenant === "www") {
      return `http://${baseUrl}${path}`;
    }
    return `http://${tenant}.${baseUrl}${path}`;
  } else {
    const separator = path.includes("?") ? "&" : "?";
    return `http://${baseUrl}${path}${separator}__cafe=${tenant}`;
  }
}
```

### 2.2 Recommended Playwright Config File (`playwright.config.ts`)
```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Set to false to avoid SQLite write lock conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Keep at 1 for SQLite simple setup, or see Section 3 for parallel worker setup
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: "file:./test.db", // Use a separate DB for tests
      NODE_ENV: "test",
    },
  },
});
```

---

## 3. Database Setup, Reset, and Isolation Lifecycle

Running E2E tests directly on the development database `dev.db` is unsafe as it corrupts local development data. Therefore, we propose executing tests against a separate `test.db` SQLite file.

### 3.1 Global Test Setup (`tests/e2e/global-setup.ts`)
To ensure a clean database state before the test run starts, configure a Playwright global setup file.

```typescript
// tests/e2e/global-setup.ts
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function globalSetup() {
  console.log("Setting up E2E test database...");

  // Override database path
  const dbPath = path.join(process.cwd(), "prisma", "test.db");
  
  // 1. Delete previous test database if it exists
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  // Delete WAL files if SQLite was left in an unclean state
  if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
  if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);

  // 2. Deploy schema migrations onto the new test database
  console.log("Running migrations...");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    stdio: "inherit",
  });

  // 3. Seed demo data (e.g. create cafes, default users)
  console.log("Seeding test database...");
  execSync("npx prisma db seed", {
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    stdio: "inherit",
  });
}

export default globalSetup;
```
Register this in `playwright.config.ts`:
```typescript
  globalSetup: require.resolve("./tests/e2e/global-setup"),
```

### 3.2 Test Isolation (Resetting Between Tests)
Since SQLite supports fast writes but doesn't handle multiple concurrent database connections well (due to file-locking), we can isolate tests using one of two patterns:

#### Pattern A: Sequential Runs with Truncate Hook (Recommended for simplicity)
Configure Playwright to run tests sequentially (`workers: 1`). Before each test, run a helper to clean up dynamic tables (e.g., `Order` and `Customer` states) while keeping the seeded static data (`Cafe`, `User` credentials, `MenuItem`).

```typescript
// tests/e2e/fixtures.ts
import { test as base } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: "file:./prisma/test.db" }
  }
});

export const test = base.extend({
  db: async ({}, use) => {
    // Before test: Clean up mutable tables
    await prisma.order.deleteMany({});
    await prisma.customer.deleteMany({});
    
    await use(prisma);
    
    // After test cleanup (optional)
  },
});
```

#### Pattern B: Parallel Worker-Scoping (Advanced)
If you must run tests in parallel, configure each test worker to use its own separate SQLite file using the `TEST_WORKER_INDEX` env variable provided by Playwright.

```typescript
// In playwright.config.ts:
const workerIndex = process.env.TEST_WORKER_INDEX || "1";
const testDbUrl = `file:./prisma/test-${workerIndex}.db`;

// Pass this variable to the webServer environment and tests:
process.env.DATABASE_URL = testDbUrl;
```
During a custom worker setup hook, you can copy a pre-migrated, pre-seeded template database file (e.g., `test-template.db`) to `test-${workerIndex}.db` in a fraction of a millisecond, giving each worker a completely clean, isolated database instantly.

---

## 4. Implementation Checklist for Later Milestones

1. **Install devDependencies**:
   ```bash
   npm install --save-dev @playwright/test cross-env
   ```
2. **Add test scripts to `package.json`**:
   ```json
   "scripts": {
     ...
     "test:e2e": "cross-env DATABASE_URL=\"file:./prisma/test.db\" playwright test"
   }
   ```
3. **Configure NextAuth**: Add cookie-sharing options with wildcard domain matching.
4. **Build Seeder script (`prisma/seed.ts`)**: Ensure it contains default onboarding configurations for marketing, app dashboard, and storefront tests.

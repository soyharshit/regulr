## 2026-07-05T03:31:18Z

We need to set up the E2E testing infrastructure for Playwright and create the initial `TEST_INFRA.md` file.

Please perform the following steps:
1. Install `@playwright/test` and `cross-env` as devDependencies:
   Command: `npm install --save-dev @playwright/test cross-env`
2. Add the following E2E test script to your `package.json` scripts:
   `"test:e2e": "cross-env DATABASE_URL=\"file:./prisma/test.db\" playwright test"`
3. Create `playwright.config.ts` in the project root with the following configuration:
```typescript
import { defineConfig, devices } from "@playwright/test";
import path from "path";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  globalSetup: require.resolve("./tests/e2e/global-setup"),
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
      DATABASE_URL: "file:./prisma/test.db",
      NODE_ENV: "test",
    },
  },
});
```
4. Create the `tests/e2e` directory if it does not exist.
5. Create `tests/e2e/global-setup.ts` to handle clean SQLite test database creation, running migrations, and running the seed script:
```typescript
import { execSync } from "child_process";
import fs from "fs";
import path from "path";

async function globalSetup() {
  console.log("Setting up E2E test database...");
  const dbPath = path.join(process.cwd(), "prisma", "test.db");
  
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }
  if (fs.existsSync(`${dbPath}-wal`)) fs.unlinkSync(`${dbPath}-wal`);
  if (fs.existsSync(`${dbPath}-shm`)) fs.unlinkSync(`${dbPath}-shm`);

  console.log("Running migrations...");
  execSync("npx prisma migrate deploy", {
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    stdio: "inherit",
  });

  console.log("Seeding test database...");
  execSync("npx prisma db seed", {
    env: { ...process.env, DATABASE_URL: `file:${dbPath}` },
    stdio: "inherit",
  });
}

export default globalSetup;
```
6. Create `tests/e2e/helpers.ts` containing the URL builder for tenant subdomains:
```typescript
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
7. Create `tests/e2e/fixtures.ts` to handle Prisma database truncation cleanups before/after tests:
```typescript
import { test as base } from "@playwright/test";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: {
    db: { url: "file:./prisma/test.db" }
  }
});

export const test = base.extend({
  db: async ({}, use) => {
    // Before test: Clean up dynamic transaction tables
    // Ensure all references are wiped clean
    try {
      await prisma.order.deleteMany({});
      await prisma.customer.deleteMany({});
    } catch (e) {
      console.warn("Failed to truncate tables in test setup:", e);
    }
    
    await use(prisma);
  },
});
```
8. Write the `TEST_INFRA.md` file at the project root (`C:\Users\sumit\.gemini\antigravity\scratch\regulr\TEST_INFRA.md`). It should contain:
- Test Philosophy (opaque-box, requirement-driven)
- Feature Inventory mapping R1-R4 to Tier 1, Tier 2, and Tier 3 tests
- Descriptions of the planned 4 test files (`routing.spec.ts`, `storefront.spec.ts`, `owner_dashboard.spec.ts`, `superadmin.spec.ts`)
- The 4 tiers of test case specifications (Feature Coverage, Boundary & Corner, Cross-Feature, Real-World Application)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Please report your progress and write your handoff report to C:\Users\sumit\.gemini\antigravity\scratch\regulr\.agents\teamwork_preview_worker_e2e_setup\handoff.md.

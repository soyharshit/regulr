import { defineConfig, devices } from "@playwright/test";

const e2ePort = Number(process.env.E2E_PORT || 3100);
const e2eBaseUrl = process.env.PLAYWRIGHT_BASE_URL || `http://localhost:${e2ePort}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: "html",
  globalSetup: require.resolve("./tests/e2e/global-setup"),
  use: {
    baseURL: e2eBaseUrl,
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
    command: `npx next dev -p ${e2ePort}`,
    url: e2eBaseUrl,
    reuseExistingServer: false,
    timeout: 120 * 1000,
    env: {
      DATABASE_URL: "file:./prisma/test.db",
      NODE_ENV: "test",
      PLAYWRIGHT_BASE_URL: e2eBaseUrl,
    },
  },
});

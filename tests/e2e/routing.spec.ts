import { test } from "./fixtures";
import { expect } from "@playwright/test";
import { getTenantUrl } from "./helpers";

test.describe("Subdomain and Query Parameter Routing (R1)", () => {
  test("marketing homepage routing", async ({ page }) => {
    await page.goto(getTenantUrl("marketing", "/", false));
    await expect(page.locator("h1")).toContainText("Regulr");
  });

  test("owner dashboard routing via override", async ({ page }) => {
    await page.goto(getTenantUrl("app", "/", false));
    await expect(page.locator("h1")).toContainText("Haku's Coffeehouse");
  });

  test("superadmin portal routing via override", async ({ page }) => {
    await page.goto(getTenantUrl("admin", "/", false));
    await expect(page.locator("h1")).toContainText("Regulr Admin");
  });

  test("customer storefront routing via override", async ({ page }) => {
    await page.goto(getTenantUrl("brew-haven", "/", false));
    await expect(page.locator("h1")).toContainText("Brew Haven");
  });

  test("invalid/inactive cafe slug routes to 404 page (TC-2.1)", async ({ page }) => {
    await page.goto(getTenantUrl("this-cafe-does-not-exist", "/", false));
    // The requirement says routes to 404 page
    await expect(page.locator("text=404")).toBeVisible();
  });

  test("accessing restricted subdomains as a tenant owner or customer asserts 403 or redirect (TC-2.4)", async ({ page }) => {
    // Attempt to access admin dashboard
    await page.goto(getTenantUrl("admin", "/settings", false));
    // Next.js middleware should redirect or return 403
    const content = await page.content();
    const has403 = content.includes("403") || content.includes("Forbidden") || content.includes("Sign In");
    expect(has403).toBeTruthy();
  });
});


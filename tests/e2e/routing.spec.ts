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
});

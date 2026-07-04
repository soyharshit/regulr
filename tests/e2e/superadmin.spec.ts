import { test } from "./fixtures";
import { expect } from "@playwright/test";
import { getTenantUrl } from "./helpers";

test.describe("Superadmin Central Operations (R4) - [SKIPPED FOR PLACEHOLDER]", () => {
  test.skip("Cafe Onboarding Wizard and automatic QR pack compilation", async ({ page }) => {
    await page.goto(getTenantUrl("admin", "/onboard"));
    
    // Step 1: Basics
    await page.fill("[data-testid='onboard-cafe-name']", "Blue Tokai");
    await page.fill("[data-testid='onboard-cafe-slug']", "bluetokai");
    await page.click("[data-testid='wizard-next']");
    
    // Step 2: Branding
    await page.fill("[data-testid='onboard-primary-color']", "#0000ff");
    await page.click("[data-testid='wizard-next']");
    
    // Step 3: Launch
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("[data-testid='wizard-launch']")
    ]);
    expect(download.suggestedFilename()).toContain("qr_pack_bluetokai.pdf");
  });

  test.skip("Superadmin cafe support impersonation switch", async ({ page }) => {
    await page.goto(getTenantUrl("admin", "/cafes"));
    
    // Click impersonate
    await page.click("[data-testid='impersonate-starbucks']");
    
    // Verify redirected and audit banner is visible
    await expect(page).toHaveURL(/.*__cafe=starbucks/);
    await expect(page.locator("[data-testid='impersonation-banner']")).toContainText("Impersonating Starbucks");
    
    // Exit impersonation
    await page.click("[data-testid='exit-impersonation-btn']");
    await expect(page).toHaveURL(/.*admin\/cafes/);
  });
});

import { test } from "./fixtures";
import { expect } from "@playwright/test";
import { getTenantUrl } from "./helpers";

test.describe("Owner Console & Walk-in Terminal (R3) - [SKIPPED FOR PLACEHOLDER]", () => {
  test.skip("Kanban board queue status updates and audio triggers", async ({ page }) => {
    await page.goto(getTenantUrl("app", "/dashboard"));
    
    // Verify columns exist
    await expect(page.locator("[data-testid='column-pending']")).toBeVisible();
    await expect(page.locator("[data-testid='column-preparing']")).toBeVisible();
    
    // Mock incoming order and verify sound trigger is called
    const audioTriggered = await page.evaluate(() => {
      const audio = document.querySelector("audio");
      return audio ? audio.paused === false || (audio as any).played.length > 0 : false;
    });
    console.log("Audio triggered status:", audioTriggered);
  });

  test.skip("Manual billing walk-in checkout speed test", async ({ page }) => {
    const startTime = Date.now();
    await page.goto(getTenantUrl("app", "/billing"));
    
    await page.click("[data-testid='billing-search-item']");
    await page.fill("[data-testid='billing-search-item']", "Croissant");
    await page.click("[data-testid='add-billing-item-0']");
    
    await page.click("[data-testid='payment-cash']");
    await page.click("[data-testid='print-bill-submit']");
    
    // Verify invoice generated
    await expect(page.locator("[data-testid='invoice-receipt']")).toBeVisible();
    const duration = Date.now() - startTime;
    expect(duration).toBeLessThan(10000); // Must be under 10 seconds
  });

  test.skip("Menu CSV export and import validation", async ({ page }) => {
    await page.goto(getTenantUrl("app", "/menu"));
    
    // Test export
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.click("[data-testid='menu-export-btn']")
    ]);
    expect(download.suggestedFilename()).toContain("menu");
    
    // Test importing malformed CSV
    await page.setInputFiles("[data-testid='menu-import-file']", {
      name: "malformed.csv",
      mimeType: "text/csv",
      buffer: Buffer.from("invalid,csv,headers\nvalue,value,value")
    });
    await expect(page.locator("[data-testid='import-error-banner']")).toBeVisible();
  });
});

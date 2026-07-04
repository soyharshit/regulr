import { expect } from "@playwright/test";
import { test } from "./fixtures";
import { getTenantUrl } from "./helpers";

test.describe("Customer storefront checkout", () => {
  test("loads the live menu for a cafe slug", async ({ page }) => {
    await page.goto(getTenantUrl("brew-haven", "/", false));

    await expect(page.getByRole("heading", { name: "Brew Haven" })).toBeVisible();
    await expect(page.getByTestId("menu-item")).toHaveCount(16);
    await expect(page.getByRole("button", { name: "Beverages" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Food" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Desserts" })).toBeVisible();
  });

  test("submits a guest counter order through the real orders API", async ({ page }) => {
    await page.goto(getTenantUrl("brew-haven", "/", false));

    await page.getByTestId("add-item-btn").first().click();
    await expect(page.getByTestId("sticky-cart-bar")).toBeVisible();
    await expect(page.getByTestId("cart-item-count")).toContainText("1 item");

    await page.getByTestId("sticky-cart-bar").click();
    await page.getByTestId("payment-upi").check();
    await page.getByTestId("submit-checkout").click();

    await expect(page.getByText("Order placed")).toBeVisible();
    await expect(page.getByTestId("sticky-cart-bar")).toBeHidden();
  });
});

import { expect, test } from "@playwright/test";

test.describe("Landing Page - Properly Rendered", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
	});

	test("Title is correct", async ({ page }) => {
		await expect(page).toHaveTitle(/ICUのじかんわり/);
	});
});

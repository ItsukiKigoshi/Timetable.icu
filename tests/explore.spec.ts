import { expect, test } from "@playwright/test";

test.describe("Explore Interface - Search and Reset Flow", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/explore");
		await page.waitForLoadState("networkidle");
	});

	test("should update results on search and return to initial on reset", async ({
		page,
	}) => {
		// --- Step 1: 初期状態の確認 ---
		// role="heading" を持つ要素などで特定
		const firstCourseHeader = page.locator("h2").first();
		await expect(firstCourseHeader).toBeVisible();
		const initialCourseName = await firstCourseHeader.innerText();

		// --- Step 2: 検索の実行 ---
		// aria-label を使って入力欄を特定
		const searchInput = page.getByLabel("Search courses");
		await searchInput.fill("Physics");
		await searchInput.press("Enter");

		// URLの確認
		await expect(page).toHaveURL(/q=Physics/);

		// opacityチェックの代わりに aria-busy を監視
		// 1. 読み込み中 (busy=true) になるのを待つ
		// 2. 読み込み完了 (busy=false) になるのを待つ
		const resultsGrid = page.locator("[aria-busy]");
		await expect(resultsGrid).toHaveAttribute("aria-busy", "false");

		// 結果が変わったことを確認
		await expect(firstCourseHeader).not.toHaveText(initialCourseName);

		// --- Step 3: リセットの実行 ---
		// aria-label を使ってボタンを特定
		const resetButton = page.getByLabel("Reset search");
		await resetButton.click();

		// --- Step 4: 復帰の確認 ---
		await expect(searchInput).toHaveValue("");
		await expect(page).not.toHaveURL(/q=/);
		await expect(firstCourseHeader).toHaveText(initialCourseName);

		// 再度 busy が解消されていることを確認
		await expect(resultsGrid).toHaveAttribute("aria-busy", "false");
	});
});

import { expect, test } from "@playwright/test";

// ゲスト用テストスイート
test.describe("Course Management - Guest", () => {
	test.beforeEach(async ({ context }) => {
		// ゲスト状態を確実にするためCookieを削除
		await context.clearCookies();
	});

	test("Add course in /explore, Edit & Remove in /timetable", async ({
		page,
	}) => {
		await page.goto("/explore");

		// ゲスト状態（LogInアイコンが表示されているか）を確認
		await expect(
			page.locator("#dropdown-button svg.text-success"),
		).not.toBeVisible();

		// コース追加
		const addBtn = page.getByRole("button", { name: /追加|Add/i }).first();
		await expect(addBtn).toBeVisible();
		await addBtn.click();

		// 追加後の削除ボタン（または追加済み状態）を確認
		await expect(
			page.getByRole("button", { name: /削除|Remove/i }).first(),
		).toBeVisible({ timeout: 10000 });

		// 時間割画面に遷移
		await page.goto("/timetable");

		// コースコマをクリックして詳細モーダルを開く
		const courseCell = page
			.locator("button.grid-cell, [data-course-id], .group")
			.first();
		await expect(courseCell).toBeVisible({ timeout: 10000 });
		await courseCell.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		// メモ編集
		const memoTextarea = dialog.locator("#memo-textarea");
		await expect(memoTextarea).toBeVisible();
		await memoTextarea.fill("テストメモ (ゲスト)");
		await memoTextarea.blur();

		// aria-label 経由で削除ボタンをクリック
		const removeBtn = dialog.getByRole("button", { name: /delete/i });
		await removeBtn.click();

		// モーダルが閉じたことを確認
		await expect(dialog).not.toBeVisible();
	});
});

// ログイン済み用テストスイート
test.describe("Course Management - Logged In", () => {
	test.use({ storageState: "tests/.auth/user.json" });

	test("Add, Edit memo/color, and Remove course", async ({ page }) => {
		await page.goto("/explore");

		// ログイン確認: HeaderのCloudCheckアイコン(svg.text-success)が存在することを確認
		const cloudCheckIcon = page.locator("#dropdown-button svg.text-success");
		await expect(cloudCheckIcon).toBeVisible();

		// コース追加
		const addBtn = page.getByRole("button", { name: /追加|Add/i }).first();
		await expect(addBtn).toBeVisible();
		await addBtn.click();

		await expect(
			page.getByRole("button", { name: /削除|Remove/i }).first(),
		).toBeVisible({ timeout: 10000 });

		// 時間割画面に遷移
		await page.goto("/timetable");

		// コースコマをクリックして詳細モーダルを開く
		const courseCell = page
			.locator("button.grid-cell, [data-course-id], .group")
			.first();
		await expect(courseCell).toBeVisible({ timeout: 10000 });
		await courseCell.click();

		const dialog = page.getByRole("dialog");
		await expect(dialog).toBeVisible();

		// メモ編集
		const memoTextarea = dialog.locator("#memo-textarea");
		await expect(memoTextarea).toBeVisible();
		await memoTextarea.fill("テストメモ (ログイン済み)");
		await memoTextarea.blur();

		// カラー選択 (カラーパレットボタンから2番目を選択)
		const colorButtons = dialog.locator(
			"button[aria-label*='color'], button[data-color], button.rounded-full",
		);
		if ((await colorButtons.count()) > 1) {
			await colorButtons.nth(1).click();
		}

		// aria-label 経由で削除ボタンをクリック
		const removeBtn = dialog.getByRole("button", { name: /delete/i });
		await removeBtn.click();

		// モーダルが閉じたことを確認
		await expect(dialog).not.toBeVisible();
	});
});

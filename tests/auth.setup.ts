import path from "node:path";
import { expect, test as setup } from "@playwright/test";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { testUtils } from "better-auth/plugins";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../src/db/schema";

const authFile = path.resolve("./tests/.auth/user.json");
const DB_PATH = path.resolve(
	"./.wrangler/state/v3/d1/miniflare-D1DatabaseObject/93bf182b87b50804aa043b51827ca034584e88c21400242a961a0dbf0c53a9a7.sqlite",
);

setup("authenticate and reset test user data", async ({ context, page }) => {
	// 1. Better Auth テスト用インスタンスの初期化
	const sqlite = new Database(DB_PATH);
	const db = drizzle(sqlite, { schema });

	const auth = betterAuth({
		baseURL: "http://localhost:4321",
		secret:
			process.env.BETTER_AUTH_SECRET ||
			"test-secret-SYucbIc1AQoIzMntc5fMNugBqdfwOdxP",
		database: drizzleAdapter(db, {
			provider: "sqlite",
			schema: schema,
		}),
		advanced: {
			cookiePrefix: "timetable-icu-auth",
		},
		plugins: [testUtils()],
	});

	// 2. 公式ドキュメントに準拠した testUtils の取得
	const ctx = await auth.$context;
	const test = ctx.test;
	if (!test) throw new Error("testUtils plugin is missing");

	const testEmail = "testuser@icu.ac.jp";
	let userId: string;

	// クリーンアップ & テストユーザー作成
	const existingUser = db
		.select()
		.from(schema.user)
		.where(eq(schema.user.email, testEmail))
		.get();

	if (existingUser) {
		userId = existingUser.id;
		await db
			.delete(schema.userCourses)
			.where(eq(schema.userCourses.userId, userId));
	} else {
		const newUser = test.createUser({
			email: testEmail,
			name: "Test User",
		});
		await test.saveUser(newUser);
		userId = newUser.id;
	}

	// 3. test.login() を使用して認証セッションを作成し，Playwright用 Cookie を取得
	const { cookies } = await test.login({
		userId: userId,
	});

	// 4. ブラウザコンテキストへ Cookie を追加
	await context.addCookies(cookies);

	// 5. ページ訪問
	await page.goto("/explore");

	// 6. Playwright ベストプラクティスに基づくアクセシブルな検証
	// getByRole または getByTestId を使用
	const userButton = page.getByRole("button", {
		name: "User Menu (Logged In)",
	});
	await expect(userButton).toBeVisible({ timeout: 10000 });

	// 7. 認証状態 (Cookie / Storage) の永続化保存
	await context.storageState({ path: authFile });
});

import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 2 : 0,
	workers: process.env.CI ? 1 : undefined,
	reporter: "html",
	use: {
		baseURL: "http://localhost:4321",
	},

	projects: [
		// Setup project for auth
		{ name: "setup", testMatch: /.*\.setup\.ts/ },

		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
	],

	webServer: {
		command: "NODE_ENV=test pnpm run dev",
		url: "http://localhost:4321",
		reuseExistingServer: !process.env.CI,
	},
});

import { defineConfig } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	use: {
		baseURL: "http://localhost:4321",
	},
	webServer: {
		command: "pnpm run dev",
		url: "http://localhost:4321",
		reuseExistingServer: !process.env.CI,
	},
});

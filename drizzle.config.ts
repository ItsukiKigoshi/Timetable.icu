import { defineConfig } from "drizzle-kit";

export default defineConfig({
	dialect: "sqlite",
	schema: "./src/db/schema/index.ts",
	out: "./migrations",
	dbCredentials: {
		url: ".wrangler/state/v3/d1/miniflare-D1DatabaseObject/05a91a035607316a4bd0be2b172089718c10704453b7ceabc620726b84f9c676.sqlite",
	},
});

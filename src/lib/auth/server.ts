import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { createAuthMiddleware } from "better-auth/api";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export const getAuth = (env: Env, request: Request) => {
	const url = new URL(request.url);

	let currentOrigin = env.BETTER_AUTH_URL;
	const isWorkersDev = url.hostname.includes("itsukikigoshi.workers.dev");
	const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
	if (isWorkersDev || isLocal) {
		const protocol = isLocal ? "http" : "https";
		currentOrigin = `${protocol}://${url.host}`;
	}

	return betterAuth({
		baseURL: currentOrigin,
		trustedOrigins: ["https://timetable.icu", "http://localhost:4321"],
		database: drizzleAdapter(drizzle(env.timetable_icu), {
			provider: "sqlite",
			schema: schema,
		}),
		secret: env.BETTER_AUTH_SECRET,
		advanced: {
			cookiePrefix: "timetable-icu-auth",
			ipAddress: {
				ipAddressHeaders: ["cf-connecting-ip"], // Cloudflare specific header
			},
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
				redirectURI: `${currentOrigin}/api/auth/callback/google`,
				prompt: "select_account",
				hd: "icu.ac.jp",
				// 名前とプロフィール写真を保存しない
				mapProfileToUser: () => {
					return {
						name: "",
						image: undefined,
					};
				},
			},
		},
		hooks: {
			after: createAuthMiddleware(async (ctx) => {
				if (ctx.path === "/callback/:id") {
					const user = ctx.context.newSession?.user;
					if (user && !user.email.endsWith("@icu.ac.jp")) {
						const db = drizzle(env.timetable_icu);
						await db.delete(schema.user).where(eq(schema.user.id, user.id));
						throw ctx.redirect("/?error=INVALID_DOMAIN");
					}
				}
			}),
		},
	});
};

import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { getAuth } from "@/lib/auth/server.ts";
import { DEFAULT_LANG } from "@/lib/translation/ui";

export const ALL: APIRoute = async (ctx) => {
	const currentLang = ctx.locals.lang || DEFAULT_LANG;

	const auth = getAuth(env, currentLang);
	return auth.handler(ctx.request);
};

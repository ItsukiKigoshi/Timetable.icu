import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import {
	DEFAULT_TERM,
	DEFAULT_YEAR,
	type SELECTABLE_TERMS,
} from "@/constants/time.ts";
import { getAuth } from "@/lib/auth/server.ts";

export const onRequest = defineMiddleware(async (context, next) => {
	if (!env) return next();

	const { url, cookies, request } = context;
	const pathname = url.pathname;

	// 静的アセットの除外
	if (
		pathname.startsWith("/_image") ||
		pathname.startsWith("/_astro") ||
		pathname.includes(".") // .png, .svg などの静的ファイル対策を雑に対策
	) {
		return next();
	}

	// --- 1. i18n Language Management ---
	const isEnUrl = pathname.startsWith("/en/") || pathname === "/en";
	const currentLang = isEnUrl ? "en" : "ja";
	context.locals.lang = currentLang;

	// URLの言語に合わせてCookieを更新（同期のみ）
	const langCookie = cookies.get("lang")?.value;
	if (langCookie !== currentLang) {
		cookies.set("lang", currentLang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
	}

	// --- 2. Session Management ---
	try {
		// リクエストごとの runtimeEnv を使用
		const auth = getAuth(env, context.request);
		const sessionData = await auth.api.getSession({
			headers: request.headers,
		});

		context.locals.user = sessionData?.user ?? null;
		context.locals.session = sessionData?.session ?? null;
		context.locals.dbError = false;
	} catch (error) {
		console.error("D1 or Auth error, proceeding as guest:", error);
		context.locals.user = null;
		context.locals.session = null;
		context.locals.dbError = true;
	}

	// --- 3. Selected Year & Term Management ---
	const urlYear = url.searchParams.get("year");
	const urlTerm = url.searchParams.get("term");

	const cookieYear = cookies.get("year")?.number() || DEFAULT_YEAR;
	const cookieTerm = cookies.get("term")?.value || DEFAULT_TERM;

	const finalYear = urlYear ? Number(urlYear) : cookieYear;
	const finalTerm = urlTerm ? urlTerm : cookieTerm;

	if (urlYear || urlTerm) {
		const cookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365 };
		if (urlYear) cookies.set("year", String(finalYear), cookieOptions);
		if (urlTerm) cookies.set("term", finalTerm, cookieOptions);
	}

	context.locals.selectedYear = finalYear;
	context.locals.selectedTerm = finalTerm as (typeof SELECTABLE_TERMS)[number];

	return next();
});

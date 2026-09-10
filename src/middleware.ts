import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import {
	DEFAULT_TERM,
	DEFAULT_YEAR,
	type SELECTABLE_TERMS,
} from "@/constants/time.ts";
import { getAuth } from "@/lib/auth/server.ts";
import { DEFAULT_LANG, LANGUAGES, type Language } from "./lib/translation/ui";

const NON_TRANSLATED_PAGES = ["/privacy", "/terms"];

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies, request } = context;
	const pathname = url.pathname.replace(/\/$/, "");

	// 1. 静的ファイルをスキップ
	if (
		pathname.startsWith("/_image") ||
		pathname.startsWith("/_astro") ||
		pathname.includes(".")
	) {
		return next();
	}

	// 2. URL パスから言語を判定（例: /en/explore -> "en", /explore -> "ja"）
	const langInPath = LANGUAGES.find(
		(l) => l !== DEFAULT_LANG && pathname.startsWith(`/${l}`),
	);
	const currentLang = langInPath || DEFAULT_LANG;

	// context.locals に設定
	context.locals.lang = currentLang;

	// 3. 認証処理（APIや通常のページでセッションを取得）
	try {
		const auth = getAuth(env, context.locals.lang);
		const sessionData = await auth.api.getSession({
			headers: request.headers,
		});

		context.locals.user = sessionData?.user ?? null;
		context.locals.session = sessionData?.session ?? null;
	} catch (error) {
		console.error("Auth error in middleware:", error);
		context.locals.user = null;
		context.locals.session = null;
	}

	// 4. API や 翻訳不要ページはここでリターン
	if (pathname.startsWith("/api") || NON_TRANSLATED_PAGES.includes(pathname)) {
		return next();
	}

	// --- 5. Cookie や Locals の状態を設定 ---
	const yearCookie = cookies.get("year")?.value;
	const termCookie = cookies.get("term")?.value;

	const targetYear =
		url.searchParams.get("year") || yearCookie || String(DEFAULT_YEAR);
	const targetTerm = url.searchParams.get("term") || termCookie || DEFAULT_TERM;

	context.locals.selectedYear = Number(targetYear);
	context.locals.selectedTerm = targetTerm as (typeof SELECTABLE_TERMS)[number];

	// Cookie の更新（現在の表示言語を記憶しておく）
	const cookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365 };
	cookies.set("lang", currentLang, cookieOptions);
	if (!yearCookie) cookies.set("year", targetYear, cookieOptions);
	if (!termCookie) cookies.set("term", targetTerm, cookieOptions);

	return next();
});

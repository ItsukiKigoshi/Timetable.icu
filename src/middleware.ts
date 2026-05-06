import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import {
	DEFAULT_TERM,
	DEFAULT_YEAR,
	type SELECTABLE_TERMS,
} from "@/constants/time.ts";
import { getAuth } from "@/lib/auth/server.ts";
import { DEFAULT_LANG, LANGUAGES, type Language } from "./lib/translation/ui";

export const onRequest = defineMiddleware(async (context, next) => {
	if (!env) return next();

	const { url, cookies, request } = context;
	const pathname = url.pathname;
	const segments = pathname.split("/").filter(Boolean); // ["en", "home"] など

	// 静的アセットの除外
	if (
		pathname.startsWith("/_image") ||
		pathname.startsWith("/_astro") ||
		pathname.includes(".") // .png, .svg などの静的ファイル対策を雑に対策
	) {
		return next();
	}

	// --- 1. i18n Language Management ---
	const langCookie = cookies.get("lang")?.value as Language | undefined;
	let currentLang: Language = DEFAULT_LANG;

	// 1. パスの第一セグメントが LANGUAGES に含まれているかチェック (例: /en/...)
	const langInPath = LANGUAGES.find(
		(l) => l !== DEFAULT_LANG && segments[0] === l,
	);

	if (langInPath) {
		currentLang = langInPath;
	}
	// ルートパスではデフォルト言語 (LandingPage.astroでCookie操作なしに言語を切り替えられるように)
	else if (pathname === "/") {
		currentLang = DEFAULT_LANG;
	} else {
		currentLang =
			langCookie && LANGUAGES.includes(langCookie) ? langCookie : DEFAULT_LANG;
	}

	context.locals.lang = currentLang;

	// URLの言語に合わせてCookieを更新
	if (langCookie !== currentLang) {
		cookies.set("lang", currentLang, { path: "/", maxAge: 60 * 60 * 24 * 365 });
	}

	// --- 2. Session Management ---
	try {
		const auth = getAuth(env, context.locals.lang);
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

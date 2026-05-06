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
	const langInPath = LANGUAGES.find(
		(l) => l !== DEFAULT_LANG && segments[0] === l,
	);
	const currentLangInUrl = langInPath || DEFAULT_LANG;

	let targetLang: Language = DEFAULT_LANG;

	// Cookieが有効ならそれを最優先，なければURL
	if (langCookie && LANGUAGES.includes(langCookie)) {
		targetLang = langCookie;
	} else {
		targetLang = currentLangInUrl;
	}

	// URLと言語設定が矛盾している場合に強制リダイレクト
	// 例: Cookieが'en'なのにパスが'/' (ja) の場合，'/en/'へ飛ばす
	if (
		targetLang !== currentLangInUrl &&
		!pathname.startsWith("/api") &&
		!pathname.includes(".")
	) {
		let newPath: string;

		if (targetLang === DEFAULT_LANG) {
			// 1. デフォルト言語（ja）に戻す場合: 現在の言語プレフィックスを除去
			// 例: /en/about -> /about
			const currentPrefix = `/${currentLangInUrl}`;
			newPath = pathname.startsWith(currentPrefix)
				? pathname.replace(currentPrefix, "")
				: pathname;
		} else {
			// 2. それ以外の言語（enなど）に切り替える場合
			if (currentLangInUrl === DEFAULT_LANG) {
				// 例: /about -> /en/about
				newPath = `/${targetLang}${pathname}`;
			} else {
				// 例: /en/about -> /fr/about (言語間移動)
				const currentPrefix = `/${currentLangInUrl}`;
				newPath = pathname.replace(currentPrefix, `/${targetLang}`);
			}
		}

		// パスが空になったりダブルスラッシュになるのを防ぐ
		newPath = newPath.replace(/\/+$/, "") || "/";

		return context.redirect(newPath);
	}

	context.locals.lang = targetLang;

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

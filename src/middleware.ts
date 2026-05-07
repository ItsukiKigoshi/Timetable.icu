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
	const { url, cookies, redirect, request } = context;
	const pathname = url.pathname.replace(/\/$/, "");

	// 静的ファイルやAPIはスキップ (Authのエンドポイントもここで確実に通す)
	if (
		pathname.startsWith("/api/auth") ||
		pathname.startsWith("/_image") ||
		pathname.startsWith("/_astro") ||
		NON_TRANSLATED_PAGES.includes(pathname) ||
		pathname.includes(".")
	) {
		return next();
	}

	// --- 1. Session Management ---
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

	// --- 2. 現在の状態を取得 ---
	const langCookie = cookies.get("lang")?.value as Language | undefined;
	const yearCookie = cookies.get("year")?.value;
	const termCookie = cookies.get("term")?.value;

	const langInPath = LANGUAGES.find(
		(l) => l !== DEFAULT_LANG && pathname.startsWith(`/${l}`),
	);
	const currentLangInUrl = langInPath || DEFAULT_LANG;

	// --- 3. ターゲットを決定 (URL > Cookie > Default) ---
	const targetLang =
		langCookie && LANGUAGES.includes(langCookie)
			? langCookie
			: currentLangInUrl;

	const targetYear =
		url.searchParams.get("year") || yearCookie || String(DEFAULT_YEAR);
	const targetTerm = url.searchParams.get("term") || termCookie || DEFAULT_TERM;

	// --- 4. 言語パスが違う場合のみリダイレクト ---
	if (targetLang !== currentLangInUrl) {
		let newPathname = pathname;
		if (currentLangInUrl !== DEFAULT_LANG) {
			newPathname =
				pathname.replace(new RegExp(`^\\/${currentLangInUrl}`), "") || "/";
		}
		if (targetLang !== DEFAULT_LANG) {
			newPathname = `/${targetLang}${newPathname === "/" ? "" : newPathname}`;
		}

		const newUrl = new URL(url);
		newUrl.pathname = newPathname;
		return redirect(newUrl.toString());
	}

	// --- 5. Localsをセット ---
	context.locals.lang = targetLang;
	context.locals.selectedYear = Number(targetYear);
	context.locals.selectedTerm = targetTerm as (typeof SELECTABLE_TERMS)[number];

	// Cookieを最新の状態に更新
	const cookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365 };
	if (!langCookie) cookies.set("lang", targetLang, cookieOptions);
	if (!yearCookie) cookies.set("year", targetYear, cookieOptions);
	if (!termCookie) cookies.set("term", targetTerm, cookieOptions);

	return next();
});

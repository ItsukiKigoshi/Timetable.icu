import { defineMiddleware } from "astro:middleware";
import { env } from "cloudflare:workers";
import {
	DEFAULT_TERM,
	DEFAULT_YEAR,
	type SELECTABLE_TERMS,
} from "@/constants/time.ts";
import { DEFAULT_LANG, LANGUAGES, type Language } from "./lib/translation/ui";

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies, redirect } = context;
	const pathname = url.pathname;

	// 静的ファイルとAPIはスキップ
	if (
		pathname.startsWith("/api") ||
		pathname.startsWith("/_image") ||
		pathname.startsWith("/_astro") ||
		pathname.includes(".")
	)
		return next();

	// --- 1. 状態の取得 ---
	const langCookie = cookies.get("lang")?.value as Language | undefined;
	const yearCookie = cookies.get("year")?.value;
	const termCookie = cookies.get("term")?.value;

	const langInPath = LANGUAGES.find(
		(l) => l !== DEFAULT_LANG && pathname.startsWith(`/${l}`),
	);
	const currentLangInUrl = langInPath || DEFAULT_LANG;

	const urlYear = url.searchParams.get("year");
	const urlTerm = url.searchParams.get("term");

	// --- 2. ターゲットの決定 (Cookie優先，なければUR，、なければデフォルト) ---
	const targetLang =
		langCookie && LANGUAGES.includes(langCookie)
			? langCookie
			: currentLangInUrl;
	const targetYear = urlYear || yearCookie || String(DEFAULT_YEAR);
	const targetTerm = urlTerm || termCookie || DEFAULT_TERM;

	// --- 3. URL構築 ---
	// 言語パスの構築
	let newPathname = pathname;

	// 現在の言語プレフィックスを一旦剥がす
	if (currentLangInUrl !== DEFAULT_LANG) {
		newPathname =
			pathname.replace(new RegExp(`^\\/${currentLangInUrl}`), "") || "/";
	}
	// ターゲット言語がデフォルトでなければプレフィックスを付ける
	if (targetLang !== DEFAULT_LANG) {
		newPathname = `/${targetLang}${newPathname === "/" ? "" : newPathname}`;
	}

	// クエリパラメータの構築
	const newParams = new URLSearchParams(url.search);
	newParams.set("year", targetYear);
	newParams.set("term", targetTerm);

	const finalUrl = `${newPathname}?${newParams.toString()}`;
	const currentFullUrl = `${pathname}${url.search}`;

	// --- 4. 矛盾があればリダイレクト ---
	if (decodeURIComponent(currentFullUrl) !== decodeURIComponent(finalUrl)) {
		// リダイレクト前にCookieを同期（これ重要）
		const cookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365 };
		cookies.set("lang", targetLang, cookieOptions);
		cookies.set("year", targetYear, cookieOptions);
		cookies.set("term", targetTerm, cookieOptions);

		return redirect(finalUrl);
	}

	// localsに値をセットして後続の処理へ
	context.locals.lang = targetLang;
	context.locals.selectedYear = Number(targetYear);
	context.locals.selectedTerm = targetTerm as any;

	return next();
});

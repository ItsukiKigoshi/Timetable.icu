import { defineMiddleware } from "astro:middleware";
import {
	DEFAULT_TERM,
	DEFAULT_YEAR,
	type SELECTABLE_TERMS,
} from "@/constants/time.ts";
import { DEFAULT_LANG, LANGUAGES, type Language } from "./lib/translation/ui";

export const onRequest = defineMiddleware(async (context, next) => {
	const { url, cookies, redirect } = context;
	const pathname = url.pathname;

	// 静的ファイルやAPIはスキップ
	if (
		pathname.startsWith("/api") ||
		pathname.startsWith("/_image") ||
		pathname.startsWith("/_astro") ||
		pathname.includes(".")
	) {
		return next();
	}

	// --- 1. 現在の状態を取得 ---
	const langCookie = cookies.get("lang")?.value as Language | undefined;
	const yearCookie = cookies.get("year")?.value;
	const termCookie = cookies.get("term")?.value;

	const langInPath = LANGUAGES.find(
		(l) => l !== DEFAULT_LANG && pathname.startsWith(`/${l}`),
	);
	const currentLangInUrl = langInPath || DEFAULT_LANG;

	// --- 2. 優先順位の決定 (Cookie > URL > Default) ---

	// 言語: Cookieに有効な値があればそれを最優先、なければURL
	const targetLang =
		langCookie && LANGUAGES.includes(langCookie)
			? langCookie
			: currentLangInUrl;

	// 年・学期: Cookie > URLパラメータ > デフォルト
	const targetYear =
		yearCookie || url.searchParams.get("year") || String(DEFAULT_YEAR);
	const targetTerm = termCookie || url.searchParams.get("term") || DEFAULT_TERM;

	// --- 3. 必要に応じてリダイレクト処理 ---

	// 現在のURLパスと言語設定(targetLang)が一致しない場合はリダイレクト
	if (targetLang !== currentLangInUrl) {
		let newPathname = pathname;

		// 旧言語プレフィックスを削除
		if (currentLangInUrl !== DEFAULT_LANG) {
			newPathname =
				pathname.replace(new RegExp(`^\\/${currentLangInUrl}`), "") || "/";
		}

		// 新言語プレフィックスを付与
		if (targetLang !== DEFAULT_LANG) {
			newPathname = `/${targetLang}${newPathname === "/" ? "" : newPathname}`;
		}

		const newUrl = new URL(url);
		newUrl.pathname = newPathname;

		// クエリパラメータも正規化（Cookieの値を優先させる場合）
		newUrl.searchParams.set("year", targetYear);
		newUrl.searchParams.set("term", targetTerm);

		return redirect(newUrl.toString());
	}

	// --- 4. Localsの設定とCookieの同期 ---
	context.locals.lang = targetLang;
	context.locals.selectedYear = Number(targetYear);
	context.locals.selectedTerm = targetTerm as (typeof SELECTABLE_TERMS)[number];

	const cookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365 };

	// Cookieが未設定、あるいは値が変わっている場合に更新
	if (langCookie !== targetLang) cookies.set("lang", targetLang, cookieOptions);
	if (yearCookie !== targetYear) cookies.set("year", targetYear, cookieOptions);
	if (termCookie !== targetTerm) cookies.set("term", targetTerm, cookieOptions);

	return next();
});

// middleware.ts
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

	// 1. 静的ファイルをスキップ
	if (
		pathname.startsWith("/_image") ||
		pathname.startsWith("/_astro") ||
		pathname.includes(".")
	) {
		return next();
	}

	// URL パスから現在の言語を特定 (例: /en -> "en", / -> "ja")
	const langInPath = LANGUAGES.find(
		(l) => l !== DEFAULT_LANG && pathname.startsWith(`/${l}`),
	);
	const currentLangInUrl = langInPath || DEFAULT_LANG;

	// 2. 言語設定の初期取得（URL指定 > Cookie > デフォルト）
	const langCookie = cookies.get("lang")?.value as Language | undefined;
	// URLに明示的な言語指定がある場合はそちらを優先，なければCookieを参照
	const currentLang =
		langInPath ||
		(langCookie && LANGUAGES.includes(langCookie) ? langCookie : DEFAULT_LANG);
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

	// 4. API や 翻訳不要ページはここでリターン（i18n リダイレクト処理を回避）
	if (pathname.startsWith("/api") || NON_TRANSLATED_PAGES.includes(pathname)) {
		return next();
	}

	// --- 5. 現在の状態を取得 (i18n / リダイレクト処理) ---
	const yearCookie = cookies.get("year")?.value;
	const termCookie = cookies.get("term")?.value;

	// --- 6. ターゲットを決定 (URL指定がある場合はリダイレクトしない) ---
	// パスに明確な言語設定がある場合はその言語を尊重し，ルート (/) かつ Cookie がある場合のみリダイレクト対象とする
	const targetLang = langInPath ? langInPath : langCookie || DEFAULT_LANG;

	const targetYear =
		url.searchParams.get("year") || yearCookie || String(DEFAULT_YEAR);
	const targetTerm = url.searchParams.get("term") || termCookie || DEFAULT_TERM;

	// --- 7. 言語パスが違う場合のみリダイレクト ---
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

	// --- 8. Locals・Cookieの更新 ---
	context.locals.selectedYear = Number(targetYear);
	context.locals.selectedTerm = targetTerm as (typeof SELECTABLE_TERMS)[number];

	const cookieOptions = { path: "/", maxAge: 60 * 60 * 24 * 365 };
	// Cookieを現在の確定言語に同調させる
	if (langCookie !== targetLang) cookies.set("lang", targetLang, cookieOptions);
	if (!yearCookie) cookies.set("year", targetYear, cookieOptions);
	if (!termCookie) cookies.set("term", targetTerm, cookieOptions);

	return next();
});

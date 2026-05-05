import { defaultLang, ui } from "./ui.ts";

// 内部ヘルパー
const getCurrentLang = (lang?: string | null): keyof typeof ui => {
	return lang && lang in ui ? (lang as keyof typeof ui) : defaultLang;
};

/**
 * 翻訳関数 t('key') を提供する関数
 * @param lang - 現在の言語 (Astro.locals.lang などから渡す)
 */
export const getTranslations = (lang: string | undefined) => {
	const currentLang = getCurrentLang(lang);
	return (key: keyof (typeof ui)[typeof defaultLang]) => {
		return ui[currentLang][key] || ui[defaultLang][key];
	};
};

/**
 * 現在の言語に応じたURLパスを生成する関数
 * 例: l('/home') -> 日本語なら '/home', 英語なら '/en/home'
 */
const getTranslatedPath = (lang: string | undefined) => {
	const currentLang = getCurrentLang(lang);
	return (path: string) => {
		const base = currentLang === defaultLang ? "" : `/${currentLang}`;
		const cleanPath = path.startsWith("/") ? path : `/${path}`;
		if (cleanPath === "/") return base === "" ? "/" : base;
		return `${base}${cleanPath}`;
	};
};

/**
 * Reactコンポーネントでよく使う翻訳関連機能をひとまとめに
 */
export const createTranslationHelper = (lang: string | undefined) => {
	const currentLang = getCurrentLang(lang);
	const t = getTranslations(lang);
	const l = getTranslatedPath(lang);
	const isJa = currentLang === "ja";

	// --- ここで定義することで currentLang や t にアクセス可能にする ---

	const translateDay = (day: string) => {
		// days.mon, days.tue ... というキーが ui に存在すると仮定
		const key =
			`days.${day.toLowerCase()}` as keyof (typeof ui)[typeof defaultLang];
		// uiから直接引くか、t() を使う
		return t(key) || day;
	};

	const translatePeriod = (label: string) => {
		if (label === "昼") return t("period.lunch");
		if (label === "夜") return t("period.night");
		return label;
	};

	return {
		t,
		l,
		translateDay,
		translatePeriod,
		isJa,
		currentLang,
	};
};

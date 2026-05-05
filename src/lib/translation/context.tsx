import type React from "react";
import { createContext, useContext, useMemo } from "react";
import { createTranslationHelper } from "./utils";

const LanguageContext = createContext<ReturnType<
	typeof createTranslationHelper
> | null>(null);

export const LanguageProvider = ({
	lang,
	children,
}: {
	lang: string;
	children: React.ReactNode;
}) => {
	// lang が変わらない限り、翻訳関数群をメモ化して再利用
	const value = useMemo(() => createTranslationHelper(lang), [lang]);

	return (
		<LanguageContext.Provider value={value}>
			{children}
		</LanguageContext.Provider>
	);
};

export const useTranslation = () => {
	const context = useContext(LanguageContext);
	if (!context)
		throw new Error("useTranslation must be used within LanguageProvider");
	return context;
};

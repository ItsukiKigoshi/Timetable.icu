import type React from "react";
import { useState } from "react";
import { client } from "@/lib/auth/client.ts";
import { defaultLang } from "@/lib/translation/ui.ts";
import { createTranslationHelper } from "@/lib/translation/utils.ts";

const getDeviceDisplayName = () => {
	const ua = navigator.userAgent;
	let browser = "Browser";
	let platform = "Device";

	if (ua.includes("Firefox")) browser = "Firefox";
	else if (ua.includes("Edg")) browser = "Edge";
	else if (ua.includes("Chrome")) browser = "Chrome";
	else if (ua.includes("Safari")) browser = "Safari";

	if (ua.includes("iPhone")) platform = "iPhone";
	else if (ua.includes("iPad")) platform = "iPad";
	else if (ua.includes("Android")) platform = "Android";
	else if (ua.includes("Windows")) platform = "Windows PC";
	else if (ua.includes("Mac OS X")) platform = "Mac";
	else if (ua.includes("Linux")) platform = "Linux";

	return `(${browser} on ${platform})`;
};

export default function PasskeyButton({
	isLoggedIn,
	lang = defaultLang,
}: {
	isLoggedIn: boolean;
	lang?: string;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const { t } = createTranslationHelper(lang);

	// ログイン処理
	const handlePasskeySignIn = async (e: React.MouseEvent) => {
		e.preventDefault();
		if (isLoading) return;

		setIsLoading(true);
		try {
			await client.signIn.passkey({
				fetchOptions: {
					onSuccess() {
						window.location.reload();
					},
					onError(ctx) {
						setIsLoading(false);
						if (ctx.error.message.includes("cancelled")) return;
						console.error("Authentication failed:", ctx.error.message);
					},
				},
			});
		} finally {
			setIsLoading(false);
		}
	};

	// パスキー追加処理
	const handleAddPasskey = async () => {
		const defaultName = `Passkey ${getDeviceDisplayName()}`;
		const name = prompt(t("auth.passkey.name_prompt"), defaultName);
		if (!name) return;

		setIsLoading(true);
		await client.passkey.addPasskey({
			name,
			fetchOptions: {
				onSuccess: () => {
					setIsLoading(false);
					alert(t("auth.passkey.success_add"));
					window.location.reload();
				},
				onError: () => {
					setIsLoading(false);
					alert(t("auth.passkey.error_add_hint"));
				},
			},
		});
	};

	return (
		<div>
			{isLoggedIn ? (
				<button
					onClick={handleAddPasskey}
					disabled={isLoading}
					type="button"
					className="btn w-full"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="lucide lucide-key-round"
					>
						<path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z" />
						<circle cx="16.5" cy="7.5" r=".5" fill="currentColor" />
					</svg>
					{isLoading ? t("auth.passkey.adding") : t("auth.passkey.add")}
				</button>
			) : (
				<button
					onClick={handlePasskeySignIn}
					disabled={isLoading}
					type="button"
					className="btn bg-white text-black border-[#e5e5e5] w-full"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="12"
						height="12"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="lucide lucide-user-key"
					>
						<path d="M20 11v6" />
						<path d="M20 13h2" />
						<path d="M3 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 2.072.578" />
						<circle cx="10" cy="7" r="4" />
						<circle cx="20" cy="19" r="2" />
					</svg>
					{isLoading ? t("auth.passkey.logging_in") : t("auth.passkey.login")}
				</button>
			)}
		</div>
	);
}

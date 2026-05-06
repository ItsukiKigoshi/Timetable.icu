import { LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { client, signInWithGoogle } from "@/lib/auth/client.ts";
import { DEFAULT_LANG, ui } from "@/lib/translation/ui.ts";

type Lang = keyof typeof ui;

export default function LoginButton({
	isLoggedIn,
	lang = DEFAULT_LANG,
}: {
	isLoggedIn: boolean;
	lang?: string;
}) {
	const [isLoading, setIsLoading] = useState(false);

	const currentLang = (lang in ui ? lang : DEFAULT_LANG) as Lang;
	const t = (key: keyof (typeof ui)["ja"]) =>
		ui[currentLang][key] || ui.ja[key];

	const handleLogout = async () => {
		if (isLoading) return;
		setIsLoading(true);
		try {
			await client.signOut({
				fetchOptions: {
					onSuccess: () => {
						window.location.reload();
					},
				},
			});
			setTimeout(() => {
				window.location.reload();
			}, 500);
		} catch (error) {
			console.error(error);
			setIsLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		if (isLoading) return;
		setIsLoading(true);
		try {
			await signInWithGoogle();
		} catch (error) {
			console.error(error);
			setIsLoading(false);
			alert(t("auth.error_login"));
		}
	};

	// ブラウザバック時にはsetIsLoading stateをリセット
	useEffect(() => {
		const handlePageShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				setIsLoading(false);
			}
		};

		window.addEventListener("pageshow", handlePageShow);
		return () => window.removeEventListener("pageshow", handlePageShow);
	}, []);

	return (
		<div className="w-full">
			{isLoggedIn ? (
				<button
					onClick={handleLogout}
					disabled={isLoading}
					type="button"
					className="btn w-full"
				>
					<LogOut size="16" />
					{isLoading ? t("auth.logging_out") : t("auth.logout")}
				</button>
			) : (
				<button
					onClick={handleGoogleLogin}
					disabled={isLoading}
					type="button"
					className="btn bg-white text-black border-[#e5e5e5] w-full"
				>
					<svg
						aria-label="Google logo"
						width="16"
						height="16"
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 512 512"
					>
						<g>
							<path d="m0 0H512V512H0" fill="#fff"></path>
							<path
								fill="#34a853"
								d="M153 292c30 82 118 95 171 60h62v48A192 192 0 0190 341"
							></path>
							<path
								fill="#4285f4"
								d="m386 400a140 175 0 0053-179H260v74h102q-7 37-38 57"
							></path>
							<path
								fill="#fbbc02"
								d="m90 341a208 200 0 010-171l63 49q-12 37 0 73"
							></path>
							<path
								fill="#ea4335"
								d="m153 219c22-69 116-109 179-50l55-54c-78-75-230-72-297 55"
							></path>
						</g>
					</svg>
					{isLoading ? t("auth.connecting_google") : t("auth.login_google")}
				</button>
			)}
		</div>
	);
}

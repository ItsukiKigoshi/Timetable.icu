import type { User } from "better-auth";
import { CircleCheckBig, CircleX } from "lucide-react";
import { useEffect, useState } from "react";
import { useSync } from "@/lib/course/hooks.ts";
import { getTranslations } from "@/lib/translation/utils";

export default function Toast({ user, lang }: { user?: User; lang: string }) {
	const t = getTranslations(lang);

	const [status, setStatus] = useState<"idle" | "domain_error">("idle");
	const { syncStatus } = useSync(user);
	const [show, setShow] = useState(false);

	// syncStatus が変わったら表示をONにする
	useEffect(() => {
		if (syncStatus !== "idle") setShow(true);
	}, [syncStatus]);

	// --- ドメインエラーの監視 (URLパラメータ) ---
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		if (params.get("error") === "INVALID_DOMAIN") {
			setShow(true);
			setStatus("domain_error");

			// URLを綺麗にする
			const url = new URL(window.location.href);
			url.searchParams.delete("error");
			window.history.replaceState({}, "", url.pathname);

			// 8秒後に消す
			setTimeout(() => setShow(false), 8000);
		}
	}, []);

	if (!show) return null;

	return (
		<div className="toast toast-top toast-center z-100">
			{/* ドメインエラー */}
			{status === "domain_error" && (
				<div className="alert alert-error shadow-lg">
					<CircleX size="24" />
					<span className="text-sm">{t("auth.error_domain")}</span>
				</div>
			)}

			{/* 同期中 */}
			{syncStatus === "syncing" && (
				<div className="alert alert-info shadow-lg">
					<span className="loading loading-spinner loading-sm"></span>
					<span> {t("toast.sync.ing")} </span>
				</div>
			)}

			{/* 同期完了 */}
			{syncStatus === "done" && (
				<div className="alert alert-success shadow-lg">
					<CircleCheckBig size="24" />
					<span>{t("toast.sync.ed_reload")}</span>
				</div>
			)}

			{/* 同期失敗 */}
			{syncStatus === "error" && (
				<div className="alert alert-warning shadow-lg">
					<CircleX size="24" />
					<span>{t("toast.sync.fail")}</span>
				</div>
			)}
		</div>
	);
}

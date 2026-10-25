import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { DEFAULT_LANG } from "@/lib/translation/ui";
import { getTranslations } from "@/lib/translation/utils";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title?: string;
	subtitle?: string;
	children: React.ReactNode;
	lang: string;
}

export default function Modal({
	isOpen,
	onClose,
	title,
	subtitle = "",
	children,
	lang = DEFAULT_LANG,
}: ModalProps) {
	const t = getTranslations(lang);
	const dialogRef = useRef<HTMLDialogElement>(null);
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		setMounted(true);
	}, []);

	useEffect(() => {
		if (!mounted) return;
		const dialog = dialogRef.current;
		if (!dialog) return;

		if (isOpen) {
			if (!dialog.open) {
				dialog.showModal();
			}
		} else {
			if (dialog.open) {
				dialog.close();
			}
		}
	}, [isOpen, mounted]);

	if (!mounted) return null;

	return createPortal(
		<dialog
			ref={dialogRef}
			className="modal modal-bottom sm:modal-middle"
			onClose={onClose}
		>
			{/* モーダル本体 */}
			<div className="modal-box p-0 flex flex-col max-h-[90vh] sm:max-h-[85vh] relative overflow-hidden">
				<div className="p-2 w-full flex flex-col justify-center items-center bg-base-100 shrink-0">
					{/* タイトル */}
					{title && (
						<h3 className="font-bold text-lg truncate w-full text-center px-4">
							{title}
						</h3>
					)}
					{/*サブタイトル*/}
					{subtitle && (
						<p className="text-sm opacity-60 font-medium w-full text-center">
							{subtitle}
						</p>
					)}
				</div>

				{/*コンテンツ*/}
				<div className="px-4 py-2 overflow-y-auto flex-1 custom-scrollbar">
					{children}
				</div>

				{/* 閉じるボタン */}
				<div className="p-4">
					<button className="btn btn-block" type="button" onClick={onClose}>
						{t("meta.close")}
					</button>
				</div>
			</div>

			<form method="dialog" className="modal-backdrop">
				<button type="button" onClick={onClose}>
					close
				</button>
			</form>
		</dialog>,
		document.body,
	);
}

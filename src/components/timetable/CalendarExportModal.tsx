import { Download, SquareArrowOutUpRight } from "lucide-react";
import Modal from "@/components/common/Modal.tsx";
import type { UserCourseWithDetails } from "@/db/schema";
import {
	buildIcalRedirectUrl,
	downloadICSFile,
	generateTimetableICS,
	getTermCalendarInfo,
} from "@/lib/timetable/ical.ts";
import { DEFAULT_LANG } from "@/lib/translation/ui.ts";
import { createTranslationHelper } from "@/lib/translation/utils.ts";

interface Props {
	isOpen: boolean;
	onClose: () => void;
	courses: UserCourseWithDetails[];
	isLoading?: boolean;
	selectedYear: number;
	selectedTerm: string;
	lang?: string;
}

export default function CalendarExportModal({
	isOpen,
	onClose,
	courses,
	isLoading = false,
	selectedYear,
	selectedTerm,
	lang = DEFAULT_LANG,
}: Props) {
	const { t, isJa } = createTranslationHelper(lang);
	const termInfo = getTermCalendarInfo(selectedYear, selectedTerm);

	const termTranslationKey = `term.${selectedTerm}` as Parameters<typeof t>[0];
	const termLabel = t(termTranslationKey) || selectedTerm;

	const isDisabled = isLoading || courses.length === 0;

	const handleProviderSelect = (provider: "google" | "apple" | "microsoft") => {
		if (isDisabled) return;
		const url = buildIcalRedirectUrl(courses, {
			year: selectedYear,
			term: selectedTerm,
			provider,
		});
		if (provider === "apple") {
			window.location.assign(url);
		} else {
			window.open(url, "_blank", "noopener,noreferrer");
		}
		onClose();
	};

	const handleDownloadICS = () => {
		if (isDisabled) return;
		try {
			const icsContent = generateTimetableICS(courses, {
				year: selectedYear,
				term: selectedTerm,
			});
			const singleCode =
				courses.length === 1 &&
				"courseCode" in courses[0] &&
				courses[0].courseCode
					? courses[0].courseCode
					: null;
			const filename = singleCode
				? `course_${singleCode}_${selectedYear}_${selectedTerm}.ics`
				: `timetable_y${selectedYear}_${selectedTerm}.ics`;
			downloadICSFile(icsContent, filename);
			onClose();
		} catch (e) {
			const msg =
				e instanceof Error ? e.message : "Failed to generate ICS file.";
			alert(msg);
		}
	};

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title={t("ical.export_title")}
			subtitle={`${selectedYear} ${termLabel} (${termInfo.startDate} ~ ${termInfo.endDate})`}
			lang={lang}
		>
			<div className="flex flex-col gap-4 py-2">
				{/* 対象の科目一覧 */}
				<div className="bg-base-200/60 p-3 rounded-lg border border-base-300">
					<p className="font-semibold text-xs text-base-content/70 mb-1">
						{t("ical.courses_to_export")}
					</p>
					{isLoading ? (
						<div className="flex items-center gap-2 text-xs py-1">
							<span className="loading loading-spinner loading-xs" />
							<span>Loading...</span>
						</div>
					) : courses.length > 0 ? (
						<div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
							<p className="text-sm font-bold">
								{t("ical.courses_count").replace(
									"{count}",
									String(courses.length),
								)}
							</p>
							<ul className="text-xs opacity-75 list-disc pl-4 space-y-0.5">
								{courses.map((c) => {
									const courseTitle = isJa
										? ("titleJa" in c && c.titleJa) ||
											("title" in c && c.title) ||
											("titleEn" in c && c.titleEn) ||
											"Untitled"
										: ("titleEn" in c && c.titleEn) ||
											("title" in c && c.title) ||
											("titleJa" in c && c.titleJa) ||
											"Untitled";
									return (
										<li key={`${c.type}-${c.id}`} className="truncate">
											{courseTitle}
										</li>
									);
								})}
							</ul>
						</div>
					) : (
						<p className="text-xs text-error font-medium">
							{t("ical.no_courses_to_export")}
						</p>
					)}
				</div>

				{/* カレンダーアプリ選択ボタン群 */}
				<div className="flex flex-col gap-2">
					<p className="font-bold text-xs text-base-content/70 px-0.5">
						{t("ical.select_app")}
					</p>

					{/* Google Calendar */}
					<button
						type="button"
						disabled={isDisabled}
						onClick={() => handleProviderSelect("google")}
						className="btn bg-white text-black border-[#e5e5e5] hover:bg-gray-50 flex items-center justify-between w-full px-4"
					>
						<span className="flex items-center gap-2.5">
							<svg
								aria-hidden="true"
								width="18"
								height="18"
								viewBox="0 0 24 24"
							>
								<path
									fill="#4285F4"
									d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
								/>
								<path
									fill="#34A853"
									d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
								/>
								<path
									fill="#FBBC05"
									d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
								/>
								<path
									fill="#EA4335"
									d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
								/>
							</svg>
							<span className="font-semibold">{t("ical.google")}</span>
						</span>
						<SquareArrowOutUpRight size={14} className="opacity-50" />
					</button>

					{/* Apple Calendar */}
					<button
						type="button"
						disabled={isDisabled}
						onClick={() => handleProviderSelect("apple")}
						className="btn bg-white text-black border-[#e5e5e5] hover:bg-gray-50 flex items-center justify-between w-full px-4"
					>
						<span className="flex items-center gap-2.5">
							<svg
								aria-hidden="true"
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="currentColor"
							>
								<path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.33c.64-.78 1.08-1.86.96-2.94-.93.04-2.06.62-2.72 1.4-.58.68-1.1 1.79-.96 2.84 1.04.08 2.08-.52 2.72-1.3z" />
							</svg>
							<span className="font-semibold">{t("ical.apple")}</span>
						</span>
						<SquareArrowOutUpRight size={14} className="opacity-50" />
					</button>

					{/* Microsoft Outlook */}
					<button
						type="button"
						disabled={isDisabled}
						onClick={() => handleProviderSelect("microsoft")}
						className="btn bg-white text-black border-[#e5e5e5] hover:bg-gray-50 flex items-center justify-between w-full px-4"
					>
						<span className="flex items-center gap-2.5">
							<svg
								aria-hidden="true"
								width="18"
								height="18"
								viewBox="0 0 23 23"
							>
								<path fill="#f35325" d="M1 1h10v10H1z" />
								<path fill="#81bc06" d="M12 1h10v10H12z" />
								<path fill="#05a6f0" d="M1 12h10v10H1z" />
								<path fill="#ffba08" d="M12 12h10v10H12z" />
							</svg>
							<span className="font-semibold">{t("ical.microsoft")}</span>
						</span>
						<SquareArrowOutUpRight size={14} className="opacity-50" />
					</button>

					{/* iCal (.ics) Download */}
					<button
						type="button"
						disabled={isDisabled}
						onClick={handleDownloadICS}
						className="btn btn-neutral flex items-center justify-between w-full px-4"
					>
						<span className="flex items-center gap-2.5">
							<Download size={18} />
							<span className="font-semibold">{t("ical.download_ics")}</span>
						</span>
					</button>
				</div>
			</div>
		</Modal>
	);
}

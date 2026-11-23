import type { User } from "better-auth";
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { DEFAULT_TERM, DEFAULT_YEAR } from "@/constants/time.ts";
import type { UserCourseWithDetails } from "@/db/schema";
import { downloadICSFile, generateTimetableICS } from "@/lib/timetable/ical.ts";
import { DEFAULT_LANG } from "@/lib/translation/ui.ts";
import { createTranslationHelper } from "@/lib/translation/utils.ts";

interface Props {
	user?: User | null;
	lang?: string;
	selectedYear?: number;
	selectedTerm?: string;
}

export default function IcalActions({
	user,
	lang = DEFAULT_LANG,
	selectedYear = DEFAULT_YEAR,
	selectedTerm = DEFAULT_TERM,
}: Props) {
	const { t } = createTranslationHelper(lang);
	const [isExporting, setIsExporting] = useState(false);

	const handleInstantDownload = async () => {
		if (isExporting) return;

		// ドロップダウンを閉じる
		document.getElementById("user-dropdown")?.classList.remove("dropdown-open");
		if (document.activeElement instanceof HTMLElement) {
			document.activeElement.blur();
		}

		setIsExporting(true);
		try {
			let coursesToExport: UserCourseWithDetails[] = [];

			if (user) {
				const res = await fetch(
					`/api/user-courses?year=${selectedYear}&term=${selectedTerm}`,
				);
				if (res.ok) {
					const data = (await res.json()) as {
						courses?: UserCourseWithDetails[];
					};
					coursesToExport = (data.courses || []).filter(
						(c) => c.isVisible !== false,
					);
				}
			} else {
				const cached = localStorage.getItem("guest_timetable");
				if (cached) {
					const parsed = JSON.parse(cached) as UserCourseWithDetails[];
					coursesToExport = parsed
						.filter(
							(c) =>
								Number(c.year) === Number(selectedYear) &&
								c.term === selectedTerm &&
								c.isVisible !== false,
						)
						.map((c) => ({
							...c,
							room: c.type === "custom" ? c.room : null,
						}));
				}
			}

			if (coursesToExport.length === 0) {
				alert(t("ical.no_courses_to_export"));
				return;
			}

			const icsContent = generateTimetableICS(coursesToExport, {
				year: selectedYear,
				term: selectedTerm,
			});
			const filename = `timetable_y${selectedYear}_${selectedTerm}.ics`;
			downloadICSFile(icsContent, filename);
		} catch (e) {
			console.error("Failed to export iCal file:", e);
			alert(e instanceof Error ? e.message : "Failed to generate ICS file.");
		} finally {
			setIsExporting(false);
		}
	};

	return (
		<div className="w-full">
			<button
				type="button"
				disabled={isExporting}
				onClick={handleInstantDownload}
				className="btn bg-white text-black border-[#e5e5e5] w-full"
			>
				{isExporting ? (
					<span className="loading loading-spinner loading-xs" />
				) : (
					<CalendarPlus size={16} />
				)}
				{t("ical.download_ics")}
			</button>
		</div>
	);
}

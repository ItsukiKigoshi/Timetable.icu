import type { User } from "better-auth";
import { CalendarPlus } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import CalendarExportModal from "@/components/timetable/CalendarExportModal.tsx";
import { DEFAULT_TERM, DEFAULT_YEAR } from "@/constants/time.ts";
import type { UserCourseWithDetails } from "@/db/schema";
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

	const [isExportOpen, setIsExportOpen] = useState(false);
	const [coursesToExport, setCoursesToExport] = useState<
		UserCourseWithDetails[]
	>([]);
	const [isLoadingCourses, setIsLoadingCourses] = useState(false);

	const loadExportCourses = useCallback(async () => {
		setIsLoadingCourses(true);
		try {
			if (user) {
				const res = await fetch(
					`/api/user-courses?year=${selectedYear}&term=${selectedTerm}`,
				);
				if (res.ok) {
					const data = (await res.json()) as {
						courses?: UserCourseWithDetails[];
					};
					const visibleCourses = (data.courses || []).filter(
						(c) => c.isVisible !== false,
					);
					setCoursesToExport(visibleCourses);
				} else {
					setCoursesToExport([]);
				}
			} else {
				const cached = localStorage.getItem("guest_timetable");
				if (cached) {
					try {
						const parsed = JSON.parse(cached) as UserCourseWithDetails[];
						const filtered = parsed
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
						setCoursesToExport(filtered);
					} catch (e) {
						console.error("Failed to parse guest_timetable", e);
						setCoursesToExport([]);
					}
				} else {
					setCoursesToExport([]);
				}
			}
		} catch (e) {
			console.error("Failed to load export courses", e);
			setCoursesToExport([]);
		} finally {
			setIsLoadingCourses(false);
		}
	}, [user, selectedYear, selectedTerm]);

	useEffect(() => {
		if (isExportOpen) {
			loadExportCourses();
		}
	}, [isExportOpen, loadExportCourses]);

	return (
		<div className="w-full">
			<button
				type="button"
				onClick={() => {
					document
						.getElementById("user-dropdown")
						?.classList.remove("dropdown-open");
					if (document.activeElement instanceof HTMLElement) {
						document.activeElement.blur();
					}
					setIsExportOpen(true);
				}}
				className="btn bg-white text-black border-[#e5e5e5] w-full"
			>
				<CalendarPlus size={16} />
				{t("ical.add_to_calendar")}
			</button>

			<CalendarExportModal
				isOpen={isExportOpen}
				onClose={() => setIsExportOpen(false)}
				courses={coursesToExport}
				isLoading={isLoadingCourses}
				selectedYear={selectedYear}
				selectedTerm={selectedTerm}
				lang={lang}
			/>
		</div>
	);
}

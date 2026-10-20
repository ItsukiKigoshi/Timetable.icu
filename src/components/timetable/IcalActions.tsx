import type { User } from "better-auth";
import { CalendarArrowDown, CalendarArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import Modal from "@/components/common/Modal.tsx";
import type {
	CustomCourseWithDetails,
	OfficialCourseWithDetails,
	UserCourseWithDetails,
} from "@/db/schema";
import {
	downloadICSFile,
	generateTimetableICS,
	getDefaultTermDates,
	parseICSForCourseIds,
} from "@/lib/timetable/ical.ts";
import { DEFAULT_LANG } from "@/lib/translation/ui.ts";
import { createTranslationHelper } from "@/lib/translation/utils.ts";

interface Props {
	user?: User | null;
	lang?: string;
	selectedYear: number;
	selectedTerm: string;
}

export default function IcalActions({
	user,
	lang = DEFAULT_LANG,
	selectedYear,
	selectedTerm,
}: Props) {
	const { t } = createTranslationHelper(lang);

	// Modals open state
	const [isExportOpen, setIsExportOpen] = useState(false);
	const [isImportOpen, setIsImportOpen] = useState(false);

	// Export state
	const defaultDates = getDefaultTermDates(selectedYear, selectedTerm);
	const [startDate, setStartDate] = useState(defaultDates.start);
	const [endDate, setEndDate] = useState(defaultDates.end);
	const [coursesToExport, setCoursesToExport] = useState<
		UserCourseWithDetails[]
	>([]);
	const [isLoadingCourses, setIsLoadingCourses] = useState(false);
	const [exportError, setExportError] = useState<string | null>(null);
	const [isExporting, setIsExporting] = useState(false);

	// Import state
	const [isImporting, setIsImporting] = useState(false);
	const [importResult, setImportResult] = useState<{
		type: "success" | "warning" | "error";
		message: string;
	} | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	// Year / Term changed -> reset default dates
	useEffect(() => {
		const dates = getDefaultTermDates(selectedYear, selectedTerm);
		setStartDate(dates.start);
		setEndDate(dates.end);
	}, [selectedYear, selectedTerm]);

	// Load courses for export
	const loadExportCourses = useCallback(async () => {
		setIsLoadingCourses(true);
		setExportError(null);
		try {
			if (user) {
				const res = await fetch(
					`/api/user-courses?year=${selectedYear}&term=${selectedTerm}`,
				);
				if (res.ok) {
					const data = (await res.json()) as {
						courses?: UserCourseWithDetails[];
					};
					setCoursesToExport(data.courses || []);
				} else {
					setCoursesToExport([]);
				}
			} else {
				const cached = localStorage.getItem("guest_timetable");
				if (cached) {
					try {
						const parsed = JSON.parse(cached) as UserCourseWithDetails[];
						const filtered = parsed.filter(
							(c) =>
								Number(c.year) === Number(selectedYear) &&
								c.term === selectedTerm,
						);
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

	// When export modal opens, load courses
	useEffect(() => {
		if (isExportOpen) {
			loadExportCourses();
		}
	}, [isExportOpen, loadExportCourses]);

	// Generate and download ICS
	const handleGenerateICS = () => {
		setExportError(null);
		if (new Date(startDate) > new Date(endDate)) {
			const msg = t("ical.date_error");
			setExportError(msg);
			alert(msg);
			return;
		}

		setIsExporting(true);
		try {
			const icsContent = generateTimetableICS(coursesToExport, {
				year: selectedYear,
				term: selectedTerm,
				startDateStr: startDate,
				endDateStr: endDate,
			});
			const filename = `timetable_y${selectedYear}_${selectedTerm}.ics`;
			downloadICSFile(icsContent, filename);
			setIsExportOpen(false);
		} catch (e: unknown) {
			const msg =
				e instanceof Error ? e.message : "Failed to generate ICS file.";
			setExportError(msg);
			alert(msg);
		} finally {
			setIsExporting(false);
		}
	};

	// Import ICS file
	const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		setIsImporting(true);
		setImportResult(null);

		try {
			const text = await file.text();
			const { officialIds, customCourses } = parseICSForCourseIds(text);

			if (officialIds.length === 0 && customCourses.length === 0) {
				const msg = t("ical.import_no_events");
				setImportResult({ type: "error", message: msg });
				alert(msg);
				setIsImporting(false);
				if (fileInputRef.current) fileInputRef.current.value = "";
				return;
			}

			// Get currently registered courses to avoid duplicates
			let currentCourseList: UserCourseWithDetails[] = [];
			if (user) {
				const res = await fetch(
					`/api/user-courses?year=${selectedYear}&term=${selectedTerm}`,
				);
				if (res.ok) {
					const data = (await res.json()) as {
						courses?: UserCourseWithDetails[];
					};
					currentCourseList = data.courses || [];
				}
			} else {
				const cached = localStorage.getItem("guest_timetable");
				if (cached) {
					try {
						currentCourseList = JSON.parse(cached) as UserCourseWithDetails[];
					} catch (e) {
						console.error("Failed to parse guest_timetable", e);
					}
				}
			}

			const existingIdSet = new Set(
				currentCourseList
					.filter((c) => Number(c.year) === Number(selectedYear))
					.map((c) => String(c.id)),
			);

			const newOfficialIds = officialIds.filter(
				(id) => !existingIdSet.has(String(id)),
			);
			const newCustomCourses: CustomCourseWithDetails[] = customCourses.filter(
				(c) => !existingIdSet.has(String(c.id)),
			);

			if (newOfficialIds.length === 0 && newCustomCourses.length === 0) {
				const msg = t("ical.import_all_existing");
				setImportResult({ type: "warning", message: msg });
				alert(msg);
				setIsImporting(false);
				if (fileInputRef.current) fileInputRef.current.value = "";
				return;
			}

			// Fetch details for new official courses
			let fetchedCourses: OfficialCourseWithDetails[] = [];
			if (newOfficialIds.length > 0) {
				const courseRes = await fetch(
					`/api/courses?ids=${newOfficialIds.join(",")}`,
				);
				if (courseRes.ok) {
					const data = (await courseRes.json()) as {
						results?: OfficialCourseWithDetails[];
					};
					fetchedCourses = data.results || [];
				}
			}

			const totalAdded = fetchedCourses.length + newCustomCourses.length;
			if (totalAdded === 0) {
				const msg = t("ical.import_no_events");
				setImportResult({ type: "error", message: msg });
				alert(msg);
				setIsImporting(false);
				if (fileInputRef.current) fileInputRef.current.value = "";
				return;
			}

			// Save to user or guest
			if (user) {
				const syncPayload = {
					courseItems: [
						...fetchedCourses.map((c) => ({
							courseId: c.id,
							isVisible: true,
						})),
						...newCustomCourses,
					],
				};
				await fetch("/api/sync", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify(syncPayload),
				});
			} else {
				const cached = localStorage.getItem("guest_timetable");
				const guestCourses: UserCourseWithDetails[] = cached
					? JSON.parse(cached)
					: [];
				const newEntries: UserCourseWithDetails[] = [
					...fetchedCourses.map(
						(c) =>
							({
								...c,
								isVisible: true,
								type: "official" as const,
							}) as UserCourseWithDetails,
					),
					...newCustomCourses,
				];
				const updated = [...guestCourses, ...newEntries];
				localStorage.setItem("guest_timetable", JSON.stringify(updated));
			}

			const successMsg = `${totalAdded} ${t("ical.import_success")}`;
			setImportResult({ type: "success", message: successMsg });
			alert(successMsg);

			// Notify any listening timetable views
			window.dispatchEvent(new CustomEvent("timetable:updated"));

			if (window.location.pathname.includes("timetable")) {
				setTimeout(() => {
					window.location.reload();
				}, 1000);
			}
		} catch (e) {
			console.error("Import error", e);
			const msg = e instanceof Error ? e.message : "Failed to import ICS file.";
			setImportResult({ type: "error", message: msg });
			alert(msg);
		} finally {
			setIsImporting(false);
			if (fileInputRef.current) fileInputRef.current.value = "";
		}
	};

	const termTranslationKey = `term.${selectedTerm}` as Parameters<typeof t>[0];
	const termLabel = t(termTranslationKey) || selectedTerm;

	return (
		<>
			{/* Two action buttons left to logout/user icon */}
			<div className="flex items-center gap-1 sm:gap-2">
				<button
					type="button"
					onClick={() => {
						setImportResult(null);
						setIsImportOpen(true);
					}}
					className="btn btn-circle w-10 h-10 shadow-inner ring-1 ring-base-content/10"
					title={t("ical.import")}
					aria-label={t("ical.import")}
				>
					<CalendarArrowDown size={20} className="pointer-events-none" />
				</button>
				<button
					type="button"
					onClick={() => {
						setExportError(null);
						setIsExportOpen(true);
					}}
					className="btn btn-circle w-10 h-10 shadow-inner ring-1 ring-base-content/10"
					title={t("ical.export")}
					aria-label={t("ical.export")}
				>
					<CalendarArrowUp size={20} className="pointer-events-none" />
				</button>
			</div>

			{/* Export Modal */}
			<Modal
				isOpen={isExportOpen}
				onClose={() => setIsExportOpen(false)}
				title={t("ical.export_title")}
				subtitle={`${selectedYear} ${termLabel}`}
				lang={lang}
			>
				<div className="flex flex-col gap-4 py-2">
					<div className="bg-base-200/60 p-3 rounded-lg border border-base-300">
						<p className="font-semibold text-xs text-base-content/70 mb-1">
							{t("ical.courses_to_export")}
						</p>
						{isLoadingCourses ? (
							<div className="flex items-center gap-2 text-xs py-1">
								<span className="loading loading-spinner loading-xs" />
								<span>Loading...</span>
							</div>
						) : coursesToExport.length > 0 ? (
							<div className="flex flex-col gap-1 max-h-32 overflow-y-auto">
								<p className="text-sm font-bold">
									{coursesToExport.length} 件の科目が対象です
								</p>
								<ul className="text-xs opacity-75 list-disc pl-4 space-y-0.5">
									{coursesToExport.map((c) => (
										<li key={`${c.type}-${c.id}`} className="truncate">
											{("titleJa" in c && c.titleJa) ||
												("titleEn" in c && c.titleEn) ||
												("title" in c && c.title) ||
												"Untitled"}
										</li>
									))}
								</ul>
							</div>
						) : (
							<p className="text-xs text-error font-medium">
								{t("ical.no_courses_to_export")}
							</p>
						)}
					</div>

					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<label className="form-control w-full">
							<span className="label py-1">
								<span className="label-text font-bold text-xs">
									{t("ical.start_date")}
								</span>
							</span>
							<input
								type="date"
								value={startDate}
								onChange={(e) => setStartDate(e.target.value)}
								className="input input-bordered input-sm md:input-md w-full"
							/>
						</label>
						<label className="form-control w-full">
							<span className="label py-1">
								<span className="label-text font-bold text-xs">
									{t("ical.end_date")}
								</span>
							</span>
							<input
								type="date"
								value={endDate}
								onChange={(e) => setEndDate(e.target.value)}
								className="input input-bordered input-sm md:input-md w-full"
							/>
						</label>
					</div>

					{exportError && (
						<div className="text-error text-xs font-semibold px-1">
							{exportError}
						</div>
					)}

					<button
						type="button"
						disabled={coursesToExport.length === 0 || isExporting}
						onClick={handleGenerateICS}
						className="btn btn-primary btn-md flex items-center justify-center gap-2 mt-2 w-full"
					>
						<CalendarArrowUp size={18} />
						<span className="font-bold">{t("ical.export_btn")}</span>
					</button>
				</div>
			</Modal>

			{/* Import Modal */}
			<Modal
				isOpen={isImportOpen}
				onClose={() => setIsImportOpen(false)}
				title={t("ical.import_title")}
				subtitle={`${selectedYear} ${termLabel}`}
				lang={lang}
			>
				<div className="flex flex-col gap-4 py-2">
					<div className="flex flex-col items-center justify-center border-2 border-dashed border-base-300 rounded-xl p-6 bg-base-200/30 hover:border-primary/50 transition-colors">
						<CalendarArrowDown
							size={36}
							className="text-base-content/40 mb-2 pointer-events-none"
						/>
						<p className="text-sm font-semibold mb-1 text-center">
							{t("ical.select_file")}
						</p>
						<p className="text-xs text-base-content/60 mb-4 text-center">
							{t("ical.file_hint")}
						</p>
						<input
							ref={fileInputRef}
							type="file"
							accept=".ics,text/calendar"
							onChange={handleImportFile}
							disabled={isImporting}
							className="file-input file-input-bordered file-input-primary file-input-sm w-full max-w-xs"
						/>
					</div>

					{isImporting && (
						<div className="flex items-center justify-center gap-3 p-4 bg-base-200/50 rounded-lg">
							<span className="loading loading-spinner loading-md text-primary" />
							<span className="text-sm font-medium">{t("ical.importing")}</span>
						</div>
					)}

					{importResult && (
						<div
							className={`alert text-sm ${
								importResult.type === "success"
									? "alert-success"
									: importResult.type === "warning"
										? "alert-warning"
										: "alert-error"
							}`}
						>
							<span>{importResult.message}</span>
						</div>
					)}
				</div>
			</Modal>
		</>
	);
}

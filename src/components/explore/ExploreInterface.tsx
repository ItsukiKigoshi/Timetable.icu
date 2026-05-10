import type { User } from "better-auth";
import {
	ArrowDown01,
	CalendarCheck,
	Info,
	Languages,
	ListFilter,
	Plus,
	Search,
	SquareArrowOutUpRight,
	Trash2,
	X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import CourseHeader from "@/components/common/CourseHeader.tsx";
import Modal from "@/components/common/Modal";
import { SELECTABLE_DAYS } from "@/constants/time.ts";
import courseUpdateInfo from "@/db/data/course-last-update.json";
import type {
	Categories,
	OfficialCourseWithDetails,
	UserCourseWithDetails,
} from "@/db/schema";
import { useToggleCourse } from "@/lib/course/hooks";
import { getSyllabusUrl } from "@/lib/course/utils.ts";
import { LanguageProvider } from "@/lib/translation/context.tsx";
import { DEFAULT_LANG } from "@/lib/translation/ui.ts";
import { createTranslationHelper } from "@/lib/translation/utils.ts";

export interface SearchFilters {
	year: string | null;
	term: string | null;
	day: string | null;
	period: string | null;
	isLong: string | null;
	categoryId: string | null;
	q: string | null;
	slots: string[] | null;
	units: string | null;
	language: string | null;
	page: number;
}

interface SearchResponse {
	results: OfficialCourseWithDetails[];
	hasNextPage: boolean;
}

interface Props {
	initialResults: OfficialCourseWithDetails[];
	initialFilters: SearchFilters;
	isLoggedIn: boolean;
	categories: Categories[];
	initialUserCourseIds: number[];
	user?: User | null;
	hasNextPage: boolean;
	lang?: string;
}
export default function ExploreInterface({
	initialResults,
	initialFilters,
	categories,
	initialUserCourseIds,
	user,
	hasNextPage: initialHasNext,
	lang = DEFAULT_LANG,
}: Props) {
	const { t, isJa } = createTranslationHelper(lang);

	const [courses, setCourses] =
		useState<OfficialCourseWithDetails[]>(initialResults);
	const [hasNextPage, setHasNextPage] = useState(initialHasNext);
	const [filters, setFilters] = useState<SearchFilters>(initialFilters);
	const [isFetching, setIsFetching] = useState(false);
	const [isSlotModalOpen, setSlotModalOpen] = useState<boolean>(false);
	const [isInitialized, setIsInitialized] = useState(false);
	const [registeredIdList, setRegisteredIdList] =
		useState<number[]>(initialUserCourseIds);

	useEffect(() => {
		if (!user) {
			const cached = localStorage.getItem("guest_timetable");
			if (cached) {
				try {
					const localCourses = JSON.parse(cached);
					const localIds = localCourses.map((c: UserCourseWithDetails) => c.id);
					setRegisteredIdList((prev) =>
						Array.from(new Set([...prev, ...localIds])),
					);
				} catch (e) {
					console.error("Failed to parse guest_timetable", e);
				}
			}
		}
		setIsInitialized(true);
	}, [user]);

	const registeredIds = useMemo(
		() => new Set(registeredIdList),
		[registeredIdList],
	);

	const { toggleCourse, isSubmitting } = useToggleCourse({
		user,
		onToggleSuccess: (course, isAdded) => {
			setRegisteredIdList((prev) => {
				if (isAdded) return [...prev, Number(course.id)];
				return prev.filter((id) => id !== Number(course.id));
			});
		},
		onToggleError: (course, wasRegistered) => {
			// エラー時は元の状態にロールバック
			setRegisteredIdList((prev) => {
				if (wasRegistered) return [...prev, Number(course.id)];
				return prev.filter((id) => id !== Number(course.id));
			});
		},
	});

	const fetchData = async (nextFilters: SearchFilters) => {
		setIsFetching(true);
		try {
			const params = new URLSearchParams();
			Object.entries(nextFilters).forEach(([key, value]) => {
				if (Array.isArray(value)) {
					if (value.length > 0) params.set(key, value.join(","));
				} else if (value) {
					params.set(key, value.toString());
				}
			});
			const res = await fetch(`/api/courses?${params.toString()}`);
			const data = (await res.json()) as SearchResponse;
			const typedResults = data.results.map((course) => ({
				...course,
				type: "official" as const,
			}));

			setCourses(typedResults);
			setHasNextPage(data.hasNextPage);
		} catch (e) {
			console.error("Failed to fetch courses:", e);
		} finally {
			setIsFetching(false);
		}
	};

	const update = (newParams: Partial<SearchFilters>) => {
		const nextFilters = { ...filters, ...newParams };
		nextFilters.page =
			newParams.page === undefined ? 1 : Number(newParams.page);

		window.scrollTo({ top: 0, behavior: "smooth" });

		const url = new URL(window.location.href);
		Object.entries(nextFilters).forEach(([key, value]) => {
			if (!value || (Array.isArray(value) && value.length === 0)) {
				url.searchParams.delete(key);
			} else {
				url.searchParams.set(
					key,
					Array.isArray(value) ? value.join(",") : value.toString(),
				);
			}
		});
		window.history.pushState({}, "", url);
		setFilters(nextFilters);
		fetchData(nextFilters);
	};

	const Pagination = () => {
		// ページ更新用の関数
		const goToNext = useCallback(() => {
			if (hasNextPage) update({ page: filters.page + 1 });
		}, []);
		const goToPrev = useCallback(() => {
			if (filters.page > 1) update({ page: filters.page - 1 });
		}, []);
		// キーボードイベントの登録
		useEffect(() => {
			const handleKeyDown = (event: KeyboardEvent) => {
				if (event.target instanceof HTMLElement) {
					if (
						event.target.tagName === "INPUT" ||
						event.target.tagName === "TEXTAREA"
					)
						return;
				}
				if (event.key === "ArrowLeft") {
					goToPrev();
				} else if (event.key === "ArrowRight") {
					goToNext();
				}
			};
			window.addEventListener("keydown", handleKeyDown);
			// クリーンアップ関数（コンポーネントが消える時にイベントを解除）
			return () => {
				window.removeEventListener("keydown", handleKeyDown);
			};
		}, [goToPrev, goToNext]);

		return (
			<nav className="flex justify-center py-6">
				<div className="join shadow-sm">
					<button
						type="button"
						className="join-item btn btn-sm sm:btn-md"
						disabled={filters.page <= 1}
						onClick={goToPrev}
					>
						«
					</button>
					<button
						type="button"
						className="join-item btn btn-sm sm:btn-md no-animation cursor-default pointer-events-none font-mono"
					>
						Page {filters.page}
					</button>
					<button
						type="button"
						className="join-item btn btn-sm sm:btn-md"
						disabled={!hasNextPage}
						onClick={goToNext}
					>
						»
					</button>
				</div>
			</nav>
		);
	};

	const toggleSlot = (day: string, period: number) => {
		const slotStr = `${day}-${period}`;
		const currentSlots = filters.slots || [];
		const newSlots = currentSlots.includes(slotStr)
			? currentSlots.filter((s) => s !== slotStr)
			: [...currentSlots, slotStr];

		update({ slots: newSlots });
	};

	const clearFilters = () => {
		update({
			day: null,
			period: null,
			isLong: null,
			categoryId: null,
			q: "",
			slots: [],
			units: null,
			language: null,
			page: 1,
		});
		const searchInput = document.querySelector(
			'input[type="text"]',
		) as HTMLInputElement;
		if (searchInput) searchInput.value = "";
	};

	const lastUpdateStr = new Date(
		courseUpdateInfo.courseLastUpdatedAt,
	).toLocaleString(isJa ? "ja-JP" : "en-US", {
		timeZone: "Asia/Tokyo",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		hour: "2-digit",
		minute: "2-digit",
	});

	const majorCategories = categories.filter(
		(c) => c.id?.startsWith("M") && c.id !== "MSTH",
	);
	const otherCategories = categories.filter(
		(c) => !(c.id?.startsWith("M") && c.id !== "MSTH"),
	);

	return (
		<LanguageProvider lang={lang}>
			<div className="space-y-6">
				{/* フィルターセクション */}
				{/* 単語検索（CourseNo, regNo,タイトル，教員名） */}
				<div className="flex flex-wrap gap-3 items-center">
					<label className="input input-bordered flex items-center gap-2 w-full max-w-xs shadow-sm bg-base-100/50 backdrop-blur-md">
						<Search />
						<input
							type="text"
							aria-label="Search courses"
							className="grow"
							maxLength={48}
							placeholder={t("explore.search_placeholder")}
							defaultValue={filters.q || ""}
							onKeyDown={(e) =>
								e.key === "Enter" && update({ q: e.currentTarget.value })
							}
						/>
					</label>

					{/* カテゴリ選択 */}
					<label
						className={`input input-bordered flex items-center gap-2 w-full max-w-xs bg-base-100/50 backdrop-blur-md shadow-sm group ${filters.categoryId ? "border-primary border-2" : ""}`}
					>
						<ListFilter className={filters.categoryId ? "text-primary" : ""} />
						<select
							className="select border-none focus:ring-0 focus:outline-none bg-transparent w-full h-full min-h-0 pl-0 appearance-none"
							value={filters.categoryId || ""}
							onChange={(e) => update({ categoryId: e.target.value })}
						>
							<option value="">{t("explore.category_all")}</option>
							<optgroup label={t("explore.category_major")}>
								{majorCategories.map((c) => (
									<option key={c.id} value={c.id}>
										{isJa ? c.nameJa : c.nameEn}
									</option>
								))}
							</optgroup>
							<optgroup label={t("explore.category_others")}>
								{otherCategories.map((c) => (
									<option key={c.id} value={c.id}>
										{isJa ? c.nameJa : c.nameEn}
									</option>
								))}
							</optgroup>
						</select>
					</label>

					{/* 時限選択 */}
					<button
						type="button"
						className={`btn btn-md flex items-center gap-2 px-2 w-fit max-w-xs bg-base-100/50 backdrop-blur-md shadow-sm font-normal text-base-content transition-all ${
							(filters.slots?.length ?? 0) > 0
								? "border-primary border-2"
								: "border-white/20"
						}`}
						onClick={() => setSlotModalOpen(true)}
					>
						<CalendarCheck
							className={(filters.slots?.length ?? 0) > 0 ? "text-primary" : ""}
						/>
						{t("explore.select_slots")}
					</button>

					{/* 単位数 */}
					<label
						className={`input input-bordered flex items-center gap-2 w-fit bg-base-100/50 backdrop-blur-md shadow-sm group transition-all ${filters.units ? "border-primary border-2" : ""}`}
					>
						<ArrowDown01 className={filters.units ? "text-primary" : ""} />
						<select
							className="select border-none focus:ring-0 focus:outline-none bg-transparent w-full h-full min-h-0 pl-0 appearance-none font-medium"
							value={filters.units || ""}
							onChange={(e) => update({ units: e.target.value || null })}
						>
							<option value="">{t("explore.units")}</option>
							<option value="0.333">1/3</option>
							{["1", "2", "3", "4", "5"].map((v) => (
								<option key={v} value={v}>
									{v}
								</option>
							))}
						</select>
					</label>

					{/*言語選択*/}
					<label
						className={`input input-bordered flex items-center gap-2 w-fit bg-base-100/50 backdrop-blur-md shadow-sm group transition-all ${filters.language ? "border-primary border-2" : ""}`}
					>
						<Languages className={filters.language ? "text-primary" : ""} />
						<select
							className="select border-none focus:ring-0 focus:outline-none bg-transparent w-full h-full min-h-0 pl-0 appearance-none font-medium"
							value={filters.language || ""}
							onChange={(e) => update({ language: e.target.value || null })}
						>
							<option value="">{isJa ? "言語" : "Language"}</option>
							<option value="J">{isJa ? "日本語" : "Japanese"}</option>
							<option value="E">{isJa ? "英語" : "English"}</option>
							<option value="O">{isJa ? "その他" : "Other"}</option>
							{/* 明示的に language が設定されていないものを探すための選択肢 */}
							<option value="null">
								{isJa ? "言語なし" : "Not Specified"}
							</option>
						</select>
					</label>

					{/* --- 全条件クリアボタン (year, term以外) --- */}
					<button
						type="button"
						onClick={clearFilters}
						aria-label="Reset search"
						className="btn btn-md btn-outline flex items-center gap-2 text-error"
					>
						<X size={18} />
						<span className="inline font-medium">
							{t("explore.reset_selection")}
						</span>
					</button>
				</div>

				<Pagination />

				{/* 結果表示 */}
				<div
					aria-busy={isFetching}
					className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${isFetching ? "opacity-40 pointer-events-none" : "opacity-100"}`}
				>
					{courses.map((course) => {
						const isAdded = registeredIds.has(course.id);
						const loading = isSubmitting === course.id || !isInitialized;

						return (
							<section
								key={course.id}
								className="card bg-base-200 shadow-sm border border-base-200 hover:shadow-md transition-shadow"
							>
								<div className="card-body p-4 gap-3">
									{/* ヘッダーセクション: コード，言語，単位数，年度 */}
									<CourseHeader course={course} showYearTerm={true} />

									{/* アクションセクション */}
									<nav className="card-actions flex justify-between items-center">
										<a
											target="_blank"
											rel="noopener noreferrer"
											href={getSyllabusUrl(
												course.rgNo,
												course.year,
												course.term,
											)}
											className="btn btn-ghost btn-md gap-1.5 px-2 font-normal"
										>
											<span className="text-[10px] sm:text-xs">
												{t("explore.syllabus")}
											</span>
											<SquareArrowOutUpRight size="12" />
										</a>

										<button
											type="button"
											onClick={() =>
												toggleCourse(
													course,
													registeredIds.has(Number(course.id)),
												)
											}
											disabled={loading}
											className={`btn btn-md min-w-20 ${isAdded ? "btn-error" : "btn-primary"}`}
										>
											{loading ? (
												<span className="loading loading-spinner loading-xs"></span>
											) : isAdded ? (
												<>
													<Trash2 size="12" />
													{t("explore.remove")}
												</>
											) : (
												<>
													<Plus size="12" />
													{t("explore.add")}
												</>
											)}
										</button>
									</nav>
								</div>
							</section>
						);
					})}
				</div>

				{courses.length === 0 && (
					<section className="alert shadow-sm">
						<div className="space-y-3">
							<h3 className="font-bold text-lg">{t("explore.no_results")}</h3>

							{/* 公式シラバスへのリンク */}
							<p className="text-sm">
								{t("explore.check_syllabus")
									.split("{link}")
									.map((part, i, arr) => (
										<span key={`no-result-${part}`}>
											{part}
											{i < arr.length - 1 && (
												<a
													target="_blank"
													className="link font-semibold"
													href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx"
													rel="noopener"
												>
													{t("explore.syllabus")}
												</a>
											)}
										</span>
									))}
							</p>

							<div className="text-xs opacity-60 pt-2 border-t border-base-content/10">
								<p>{t("explore.disclaimer_cancelled")}</p>
								<p className="mt-1">{t("explore.colisting_desc")}</p>
							</div>
						</div>
					</section>
				)}

				<div className="flex items-center group gap-1">
					{/* 更新日時の表示 */}
					<p className="text-sm opacity-80">
						{`${t("explore.last_updated")}: ${lastUpdateStr} (JST)`}
					</p>

					<div className="dropdown dropdown-top dropdown-end">
						<button
							type="button"
							tabIndex={0}
							className="btn btn-ghost btn-circle btn-sm min-h-0 opacity-80"
						>
							<Info size={18} />
						</button>

						<nav
							tabIndex={-1}
							className="dropdown-content bg-base-100 rounded-box z-10 w-64 p-4 shadow-xl border border-base-200"
						>
							<div className="space-y-2">
								<p className="text-sm leading-relaxed">
									{t("explore.check_syllabus")
										.split("{link}")
										.map((part, i, arr) => (
											<span key={`dropdown-${part}`}>
												{part}
												{i < arr.length - 1 && (
													<a
														href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx"
														target="_blank"
														rel="noopener"
														className="link font-semibold mx-1"
													>
														{t("explore.syllabus")}
													</a>
												)}
											</span>
										))}
								</p>
								<div className="pt-2 border-t border-base-content/10">
									<p className="text-xs opacity-60">
										{t("explore.disclaimer_cancelled")}
									</p>
								</div>
							</div>
						</nav>
					</div>
				</div>

				<Pagination />

				{/* 時限モーダル */}
				<Modal
					isOpen={isSlotModalOpen}
					onClose={() => setSlotModalOpen(false)}
					title={t("explore.select_slots")}
					lang={lang}
				>
					<div className="rounded-xl shadow-sm bg-base-100">
						<table className="table table-fixed w-full text-center">
							<thead>
								<tr className="bg-base-200/50">
									<th className="w-12 bg-base-200/80"></th>
									{SELECTABLE_DAYS.map((d) => (
										<th key={d} className="font-bold">
											{d.slice(0, 2)}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{[1, 2, 3, 4, 5, 6, 7].map((p) => (
									<tr key={p}>
										<th className="bg-base-200/80 font-bold">{p}</th>
										{SELECTABLE_DAYS.map((day) => {
											const isSelected = filters.slots?.includes(`${day}-${p}`);
											return (
												<td
													key={`${day}-${p}`}
													className={`cursor-pointer border border-base-300 h-14 transition-all ${
														isSelected ? "bg-primary text-primary-content" : ""
													}`}
												>
													<button
														type="button"
														className="w-full h-full flex items-center justify-center cursor-pointer focus:outline-primary"
														onClick={() => toggleSlot(day, p)}
														aria-label={`${day} ${p} slot`}
													>
														{isSelected && (
															<span className="text-primary-content font-bold">
																✓
															</span>
														)}
													</button>
												</td>
											);
										})}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</Modal>
			</div>
		</LanguageProvider>
	);
}

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
import { useEffect, useMemo, useState } from "react";
import CourseHeader from "@/components/common/CourseHeader.tsx";
import Modal from "@/components/common/Modal";
import { SELECTABLE_DAYS } from "@/constants/time.ts";
import courseUpdateInfo from "@/db/data/course-last-update.json";
import type {
	Categories,
	OfficialCourseWithDetails,
	UserCourseWithDetails,
} from "@/db/schema";
import { getSyllabusUrl } from "@/lib/course/utils.ts";
import { LanguageProvider } from "@/lib/translation/context.tsx";
import { defaultLang } from "@/lib/translation/ui.ts";
import { createTranslationHelper } from "@/lib/translation/utils.ts";
import type { UserCoursePostResponse } from "@/pages/api/user-courses";

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
	lang = defaultLang,
}: Props) {
	const { t, isJa } = createTranslationHelper(lang);

	// --- States ---
	const [courses, setCourses] =
		useState<OfficialCourseWithDetails[]>(initialResults);
	const [hasNextPage, setHasNextPage] = useState(initialHasNext);
	const [filters, setFilters] = useState<SearchFilters>(initialFilters);
	const [isFetching, setIsFetching] = useState(false);
	const [isSubmitting, setIsSubmitting] = useState<number | null>(null);

	const [isSlotModalOpen, setSlotModalOpen] = useState<boolean>(false);

	// 1. 初期化フラグ（LocalStorage読み込み完了を待つ）
	const [isInitialized, setIsInitialized] = useState(false);

	// 2. 登録済みIDリスト（配列で管理して参照更新を確実にする）
	const [registeredIdList, setRegisteredIdList] =
		useState<number[]>(initialUserCourseIds);

	// --- Effects ---
	useEffect(() => {
		// クライアントサイドでのみ実行: ゲストモードのデータを反映
		if (!user) {
			const cached = localStorage.getItem("guest_timetable");
			if (cached) {
				try {
					const localCourses = JSON.parse(cached);
					const localIds = localCourses.map((c: UserCourseWithDetails) => c.id);
					// サーバーから渡された初期IDとLocalStorageのIDを合算
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

	// registeredIds を Set で保持（描画時の .has() を高速化）
	const registeredIds = useMemo(
		() => new Set(registeredIdList),
		[registeredIdList],
	);

	/**
	 * コースの追加/削除（トグル）処理
	 */
	const toggleCourse = async (course: OfficialCourseWithDetails) => {
		const courseId = course.id;
		const isRegistered = registeredIds.has(courseId);

		// --- 1. 楽観的UI更新 ---
		setRegisteredIdList((prev) =>
			isRegistered ? prev.filter((id) => id !== courseId) : [...prev, courseId],
		);

		if (user) {
			// --- 2. ログイン済み同期 ---
			try {
				const res = await fetch("/api/user-courses", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ courseId }),
				});
				const data = (await res.json()) as UserCoursePostResponse;

				if ("error" in data) throw new Error(data.error);

				// APIの結果と現在の表示が食い違っていれば補正 (整合性確保)
				if (data.action === "added") {
					setRegisteredIdList((prev) =>
						Array.from(new Set([...prev, courseId])),
					);
				} else if (data.action === "removed") {
					setRegisteredIdList((prev) => prev.filter((id) => id !== courseId));
				}
			} catch (e) {
				console.error(e);
				// ロールバック
				setRegisteredIdList((prev) =>
					isRegistered
						? [...prev, courseId]
						: prev.filter((id) => id !== courseId),
				);
				alert(isJa ? "通信に失敗しました" : "Failed to sync with server");
			}
		} else {
			// --- 3. ゲストモード同期 ---
			const cached = localStorage.getItem("guest_timetable");
			let currentCourses = cached ? JSON.parse(cached) : [];

			if (isRegistered) {
				currentCourses = currentCourses.filter(
					(c: UserCourseWithDetails) => c.id !== courseId,
				);
			} else {
				const newCourse = {
					...course,
					isVisible: true,
					memo: "",
					updatedAt: Date.now(),
				};
				currentCourses.push(newCourse);
			}
			localStorage.setItem("guest_timetable", JSON.stringify(currentCourses));
		}
	};

	const handleToggle = async (course: OfficialCourseWithDetails) => {
		if (isSubmitting === course.id || !isInitialized) return;
		setIsSubmitting(course.id);
		try {
			await toggleCourse(course);
		} finally {
			setIsSubmitting(null);
		}
	};

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
		const goToNext = () => {
			if (hasNextPage) update({ page: filters.page + 1 });
		};
		const goToPrev = () => {
			if (filters.page > 1) update({ page: filters.page - 1 });
		};
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
		}, [filters.page, hasNextPage]); // 依存配列に状態を含める

		return (
			<nav className="flex justify-center py-6">
				<div className="join shadow-sm">
					<button
						className="join-item btn btn-sm sm:btn-md"
						disabled={filters.page <= 1}
						onClick={goToPrev}
					>
						«
					</button>
					<button className="join-item btn btn-sm sm:btn-md no-animation cursor-default pointer-events-none font-mono">
						Page {filters.page}
					</button>
					<button
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
						className="btn btn-md btn-outline flex items-center gap-2 text-error"
						onClick={clearFilters}
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
											onClick={() => handleToggle(course)}
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

				{/*TODO - Apply i18n*/}
				{courses.length === 0 && (
					<section className="alert shadow-sm">
						{isJa ? (
							<div className="space-y-3">
								<h3 className="font-bold text-lg">
									該当する授業が見つかりません．
								</h3>
								<p className="text-sm">
									最新の授業情報は{" "}
									<a
										target="_blank"
										className="link font-semibold"
										href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx"
										rel="noopener"
									>
										公式シラバス
									</a>{" "}
									をご確認ください．
								</p>
								<div className="text-xs opacity-60 pt-2 border-t border-base-content/10">
									<p>
										※休講（Cancelled）および Co-Listing 科目は表示されません．
									</p>
									<p className="mt-1">
										（Co-Listing：他メジャー開講だが，自身のメジャー単位として認められる科目
										[
										<a
											className="link"
											href="https://sites.google.com/icu.ac.jp/icu-ehandbook/%E3%83%9B%E3%83%BC%E3%83%A0_japanese/%E5%B1%A5%E4%BF%AE%E6%A1%88%E5%86%85/%E5%8D%92%E6%A5%AD%E3%81%AE%E8%A6%81%E4%BB%B6"
										>
											出典
										</a>
										]）
									</p>
								</div>
							</div>
						) : (
							<div className="space-y-3">
								<h3 className="font-bold text-lg">No course found.</h3>
								<p className="text-sm">
									Please refer to the{" "}
									<a
										target="_blank"
										className="link font-semibold"
										href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx"
										rel="noopener"
									>
										Official Course Offerings
									</a>{" "}
									for latest information.
								</p>
								<div className="text-xs opacity-60 pt-2 border-t border-base-content/10">
									<p>*Cancelled and Co-Listing courses are not shown here.</p>
									<p className="mt-1">
										(Co-Listing: Courses outside your major that count toward
										major requirements [
										<a
											className="link"
											href="https://sites.google.com/icu.ac.jp/icu-ehandbook/home_english/guide-to-academic-matters/graduation-requirements"
										>
											source
										</a>
										])
									</p>
								</div>
							</div>
						)}
					</section>
				)}

				<div className="flex items-center group gap-1">
					{/* 更新日時の表示 */}
					{/*TODO - Apply i18n*/}
					<p className="text-sm opacity-80">
						{isJa
							? `データ更新日: ${lastUpdateStr} (JST)`
							: `Last Updated: ${lastUpdateStr} (JST)`}
					</p>

					<div className="dropdown dropdown-top dropdown-end">
						<div
							tabIndex={0}
							role="button"
							className="btn btn-ghost btn-circle btn-sm min-h-0 opacity-80"
							// クリックした瞬間にすでにフォーカスがある場合は、blurして閉じる
							onClick={(e) => {
								if (document.activeElement === e.currentTarget) {
									(e.currentTarget as HTMLElement).blur();
								}
							}}
						>
							<Info size={18} />
						</div>

						{/*授業検索に関する注意事項*/}
						{/*TODO - Apply i18n*/}
						<div
							tabIndex={0}
							className="dropdown-content bg-base-100 rounded-box z-10 w-64 p-4 shadow-xl border border-base-200"
						>
							{isJa ? (
								// 日本語コンテンツ
								<div className="space-y-2">
									<p className="text-sm leading-relaxed">
										最新の授業情報は
										<a
											href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx"
											target="_blank"
											rel="noopener"
											className="link font-semibold mx-1"
										>
											公式シラバス
										</a>
										をご確認ください．
									</p>
									<div className="pt-2 border-t border-base-content/10">
										<p className="text-xs opacity-60">
											※休講および Co-Listing 科目は表示されません．
										</p>
									</div>
								</div>
							) : (
								// 英語コンテンツ
								<div className="space-y-2">
									<p className="text-sm leading-relaxed">
										Please refer to the
										<a
											href="https://campus.icu.ac.jp/icumap/ehb/SearchCO.aspx"
											target="_blank"
											rel="noopener"
											className="link font-semibold mx-1"
										>
											Official Course Offerings
										</a>
										for latest information.
									</p>
									<div className="pt-2 border-t border-base-content/10">
										<p className="text-xs opacity-60">
											*Cancelled and Co-Listing courses are not shown here.
										</p>
									</div>
								</div>
							)}
						</div>
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
													onClick={() => toggleSlot(day, p)}
												>
													{isSelected && (
														<div className={"text-primary-content font-bold"}>
															✓
														</div>
													)}
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

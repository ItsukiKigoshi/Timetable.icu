import { and, eq, gte, inArray, isNull, like, lte, or } from "drizzle-orm";
import type { DrizzleD1Database } from "drizzle-orm/d1";
import type { SearchFilters } from "@/components/explore/ExploreInterface";
import type { SELECTABLE_DAYS, SELECTABLE_TERMS } from "@/constants/time";
import * as schema from "@/db/schema";

export function getCourseSearchConfig(
	url: URL,
	db: DrizzleD1Database<typeof schema>,
) {
	const year = url.searchParams.get("year");
	const term = url.searchParams.get("term");
	const q = url.searchParams.get("q") || "";
	const categoryId = url.searchParams.get("categoryId") || null;
	const slots = url.searchParams.get("slots")?.split(",").filter(Boolean) || [];
	const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
	const language = url.searchParams.get("language");
	const units = url.searchParams.get("units");

	const conditions = [];

	// 基本条件（インデックス: courses_search_optimal_idx）
	if (year) conditions.push(eq(schema.courses.year, parseInt(year, 10)));
	if (term)
		conditions.push(
			eq(schema.courses.term, term as (typeof SELECTABLE_TERMS)[number]),
		);

	// cancelされていないコースのみ検索可能
	conditions.push(eq(schema.courses.status, "active"));

	// テキスト検索
	if (q) {
		const searchVal = `%${q}%`;
		conditions.push(
			or(
				like(schema.courses.rgNo, searchVal),
				like(schema.courses.courseCode, searchVal),
				like(schema.courses.titleJa, searchVal),
				like(schema.courses.titleEn, searchVal),
				like(schema.courses.instructor, searchVal),
			),
		);
	}

	// --- カテゴリ検索の最適化 ---
	// EXISTS の代わりに IN (サブクエリ) を使用。これは SQLite のクエリプランナが
	// 相関サブクエリより効率的に（独立したスキャンとして）処理しやすい形式です。
	if (categoryId) {
		const subquery = db
			.select({ id: schema.courseToCategories.courseId })
			.from(schema.courseToCategories)
			.where(eq(schema.courseToCategories.categoryId, categoryId));

		conditions.push(inArray(schema.courses.id, subquery));
	}

	// --- スロット検索の最適化 ---
	// 複数のコマが指定された場合、それら「すべて」を含むコースを
	// インデックス `search_schedule_idx` を利用して高速にフィルタリング
	if (slots.length > 0) {
		slots.forEach((slot) => {
			const [day, periodStr] = slot.split("-");
			const p = parseInt(periodStr, 10);
			if (!Number.isNaN(p)) {
				// コマごとにサブクエリを作成。
				// courses.id IN (SELECT course_id FROM schedules WHERE day=? AND period=?)
				// を重ねることで、結果的にすべてのコマを持つものに絞り込まれる。
				const slotSubquery = db
					.select({ id: schema.courseSchedules.courseId })
					.from(schema.courseSchedules)
					.where(
						and(
							eq(
								schema.courseSchedules.dayOfWeek,
								day as (typeof SELECTABLE_DAYS)[number],
							),
							eq(schema.courseSchedules.period, p),
						),
					);

				conditions.push(inArray(schema.courses.id, slotSubquery));
			}
		});
	}

	if (units) {
		const u = parseFloat(units);
		if (u < 1) {
			// 小数の場合は誤差を考慮（0.333...対策）
			conditions.push(
				and(
					gte(schema.courses.units, u - 0.01),
					lte(schema.courses.units, u + 0.01),
				),
			);
		} else {
			// 整数の場合は完全一致
			conditions.push(eq(schema.courses.units, u));
		}
	}

	if (language) {
		if (language === "null") {
			// "指定なし" が選択された場合、IS NULL または 空文字 を探す
			conditions.push(
				or(isNull(schema.courses.language), eq(schema.courses.language, "")),
			);
		} else {
			// E, J, O などが選択された場合
			conditions.push(eq(schema.courses.language, language));
		}
	}

	return {
		where: and(...conditions),
		page,
		filters: {
			year,
			term,
			q,
			categoryId,
			slots,
			page,
			day: url.searchParams.get("day") || null,
			period: url.searchParams.get("period") || null,
			isLong: url.searchParams.get("isLong") || null,
			units: units || null,
			language: language || null,
		} satisfies SearchFilters,
	};
}

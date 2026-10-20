import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { limitPerPage } from "@/constants/config.ts";
import * as schema from "@/db/schema";
import { getCourseSearchConfig } from "@/lib/course/query.ts";

export const GET: APIRoute = async ({ request, locals }) => {
	// localsを追加
	const user = locals.user; // ログインユーザーの取得
	const db = drizzle(env.timetable_icu, { schema });
	const url = new URL(request.url);

	// ID指定による一括取得（iCalインポート等で使用）
	const idsParam = url.searchParams.get("ids");
	if (idsParam) {
		const idList = idsParam
			.split(",")
			.map((s) => parseInt(s.trim().replace(/^c_/, ""), 10))
			.filter((n) => !Number.isNaN(n));

		if (idList.length > 0) {
			const foundCourses = await db.query.courses.findMany({
				where: inArray(schema.courses.id, idList),
				with: { schedules: true },
			});
			const sanitized = user
				? foundCourses
				: foundCourses.map((course) => ({
						...course,
						room: null,
					}));
			return new Response(
				JSON.stringify({ results: sanitized, hasNextPage: false }),
				{
					headers: { "Content-Type": "application/json" },
				},
			);
		}
	}

	const { where, page } = getCourseSearchConfig(url, db);

	const results = await db.query.courses.findMany({
		where,
		with: { schedules: true },
		orderBy: (courses, { asc }) => [asc(courses.courseCode)],
		limit: limitPerPage + 1,
		offset: (page - 1) * limitPerPage,
	});

	const hasNextPage = results.length > limitPerPage;
	let data = hasNextPage ? results.slice(0, limitPerPage) : results;

	// --- 未ログイン時の教室情報隠蔽処理 ---
	if (!user) {
		data = data.map((course) => ({
			...course,
			room: null, // 公式コースの教室を強制的にnullにする
		}));
	}

	return new Response(JSON.stringify({ results: data, hasNextPage }), {
		headers: { "Content-Type": "application/json" },
	});
};

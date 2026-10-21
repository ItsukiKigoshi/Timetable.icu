import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { drizzle } from "drizzle-orm/d1";
import { limitPerPage } from "@/constants/config.ts";
import * as schema from "@/db/schema";
import { getCourseSearchConfig } from "@/lib/course/query.ts";

export const GET: APIRoute = async ({ request, locals }) => {
	// localsを追加
	const user = locals.user; // ログインユーザーの取得
	const db = drizzle(env.timetable_icu, { schema });
	const { where, page } = getCourseSearchConfig(new URL(request.url), db);

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

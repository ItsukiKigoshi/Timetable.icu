import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export const POST: APIRoute = async (context) => {
	const user = context.locals.user;
	if (!user)
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});

	try {
		const body = (await context.request.json()) as { courseItems: any[] };
		const rawItems = Array.isArray(body?.courseItems) ? body.courseItems : [];
		const db = drizzle(env.timetable_icu, { schema });

		const normalItems = rawItems.filter(
			(item) =>
				!String(item.id).startsWith("custom-") &&
				!Number.isNaN(Number(item.id)),
		);
		const customItems = rawItems.filter((item) =>
			String(item.id).startsWith("custom-"),
		);

		// 1. 正規科目のバッチ処理
		if (normalItems.length > 0) {
			const normalValues = normalItems.map((item) => ({
				userId: user.id,
				courseId: Number(item.courseId || item.id),
				isVisible: item.isVisible !== false,
				memo: item.memo || null,
				colorCustom: item.colorCustom || null,
			}));

			await db
				.insert(schema.userCourses)
				.values(normalValues)
				.onConflictDoUpdate({
					target: [schema.userCourses.userId, schema.userCourses.courseId],
					set: {
						isVisible: sql`excluded.is_visible`,
						memo: sql`excluded.memo`,
						colorCustom: sql`excluded.color_custom`,
					},
				});
		}

		// 2. カスタム科目の処理 (D1の制限を回避するため、ここは着実に)
		if (customItems.length > 0) {
			for (const item of customItems) {
				// 科目本体を挿入
				const [inserted] = await db
					.insert(schema.customCourses)
					.values({
						userId: user.id,
						title: item.title || "Untitled",
						instructor: item.instructor || "",
						room: item.room || "",
						units: Number(item.units) || 0,
						year: item.year,
						term: item.term,
						colorCustom: item.colorCustom || null,
						memo: item.memo || null,
						isVisible: item.isVisible !== false,
					})
					.returning({ id: schema.customCourses.id });

				// スケジュールを挿入
				if (inserted?.id && item.schedules?.length > 0) {
					const scheduleValues = item.schedules.map((s: any) => ({
						customCourseId: inserted.id,
						dayOfWeek: s.dayOfWeek,
						period: String(s.period),
						startTime: s.startTime,
						endTime: s.endTime,
					}));
					await db.insert(schema.customCourseSchedules).values(scheduleValues);
				}
			}
		}

		return new Response(
			JSON.stringify({
				success: true,
				syncedNormal: normalItems.length,
				syncedCustom: customItems.length,
			}),
			{ status: 200 },
		);
	} catch (e: any) {
		console.error("Sync Error:", e);
		return new Response(
			JSON.stringify({
				error: e.message,
				stack: e.stack,
			}),
			{ status: 500 },
		);
	}
};

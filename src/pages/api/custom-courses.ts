import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";
import type { CourseFormInput, CustomCourse } from "@/db/schema/index.ts";

// IDが文字列で来る可能性があるため，処理用のヘルパー
const parseId = (id: string | number): string | null => {
	if (typeof id === "string" && id.length > 0) return id;
	if (typeof id === "number") return String(id);
	return null;
};

// --- POST (新規作成) ---
export const POST: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user)
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});

	try {
		// 型アサーションを使用して unknown を回避
		const body = (await request.json()) as CourseFormInput;
		const {
			title,
			instructor,
			units,
			memo,
			room,
			colorCustom,
			schedules,
			year,
			term,
		} = body;

		if (!title || !schedules?.length) {
			return new Response(
				JSON.stringify({ error: "Missing required fields" }),
				{ status: 400 },
			);
		}

		const db = drizzle(env.timetable_icu, { schema });

		const [insertedCourse] = await db
			.insert(schema.customCourses)
			.values({
				userId: user.id,
				title,
				instructor: instructor ?? null,
				units: Number(units) || 0,
				memo: memo ?? null,
				room: room ?? null,
				colorCustom: colorCustom ?? null,
				year: Number(year),
				term,
				isVisible: true,
			})
			.returning();

		const scheduleValues = schedules.map((s) => ({
			customCourseId: insertedCourse.id,
			dayOfWeek: s.dayOfWeek,
			period: String(s.period),
			startTime: s.startTime,
			endTime: s.endTime,
		}));

		await db.insert(schema.customCourseSchedules).values(scheduleValues);

		return new Response(
			JSON.stringify({ success: true, id: insertedCourse.id }),
			{ status: 201 },
		);
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};

// --- PATCH (更新) ---
export const PATCH: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user)
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});

	try {
		const body = (await request.json()) as Partial<CourseFormInput>;
		const rawId = body.id || body.courseId || "";
		const id = parseId(rawId);

		if (!id)
			return new Response(JSON.stringify({ error: "Invalid ID" }), {
				status: 400,
			});

		const db = drizzle(env.timetable_icu, { schema });
		const batchQueries = [];

		// 基本情報の更新
		const updateData = {} as CustomCourse;
		if (body.title !== undefined) updateData.title = body.title;
		if (body.instructor !== undefined) updateData.instructor = body.instructor;
		if (body.units !== undefined) updateData.units = Number(body.units);
		if (body.memo !== undefined) updateData.memo = body.memo;
		if (body.room !== undefined) updateData.room = body.room;
		if (body.colorCustom !== undefined)
			updateData.colorCustom = body.colorCustom;
		// Check for isVisible specifically since it might come from the hook
		if (body.isVisible !== undefined) updateData.isVisible = body.isVisible;

		if (Object.keys(updateData).length > 0) {
			batchQueries.push(
				db
					.update(schema.customCourses)
					.set(updateData)
					.where(
						and(
							eq(schema.customCourses.id, id),
							eq(schema.customCourses.userId, user.id),
						),
					),
			);
		}

		// スケジュールの更新 (存在する場合のみ)
		if (body.schedules && Array.isArray(body.schedules)) {
			batchQueries.push(
				//ここ
				db
					.delete(schema.customCourseSchedules)
					.where(eq(schema.customCourseSchedules.customCourseId, id)),
			);
			const scheduleValues = body.schedules.map((s) => ({
				customCourseId: id,
				dayOfWeek: s.dayOfWeek,
				period: String(s.period),
				startTime: s.startTime,
				endTime: s.endTime,
			}));
			if (scheduleValues.length > 0) {
				batchQueries.push(
					db.insert(schema.customCourseSchedules).values(scheduleValues),
				);
			}
		}

		if (batchQueries.length > 0) {
			await db.batch(batchQueries as any);
		}

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};

// --- DELETE (削除) ---
export const DELETE: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user)
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});

	try {
		const body = (await request.json()) as { id?: any; courseId?: any };
		const rawId = body.id || body.courseId;
		const id = parseId(rawId);

		if (!id) {
			return new Response(
				JSON.stringify({ success: true, message: "Local only" }),
				{ status: 200 },
			);
		}

		const db = drizzle(env.timetable_icu, { schema });
		await db
			.delete(schema.customCourses)
			.where(
				and(
					eq(schema.customCourses.id, id),
					eq(schema.customCourses.userId, user.id),
				),
			);

		return new Response(JSON.stringify({ success: true }), { status: 200 });
	} catch (e) {
		console.error(e);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};

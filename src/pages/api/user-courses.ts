import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@/db/schema";

export type UserCoursePostResponse =
	| { success: true; action: "added" | "removed" }
	| { error: string };

//--- POST (Toggle Enrollment) ---
export const POST: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}

	try {
		const { courseId } = (await request.json()) as { courseId: number };
		if (!courseId) {
			return new Response(JSON.stringify({ error: "Missing courseId" }), {
				status: 400,
			});
		}

		const db = drizzle(env.timetable_icu, { schema });

		// 既存の登録があるか確認
		const existing = await db
			.select()
			.from(schema.userCourses)
			.where(
				and(
					eq(schema.userCourses.userId, user.id),
					eq(schema.userCourses.courseId, courseId),
				),
			)
			.get();

		if (existing) {
			// すでに存在する場合は削除 (Toggle OFF)
			await db
				.delete(schema.userCourses)
				.where(
					and(
						eq(schema.userCourses.userId, user.id),
						eq(schema.userCourses.courseId, courseId),
					),
				);
			const res: UserCoursePostResponse = { success: true, action: "removed" };
			return new Response(JSON.stringify(res), { status: 200 });
		} else {
			// 存在しない場合は追加 (Toggle ON)
			await db.insert(schema.userCourses).values({
				userId: user.id,
				courseId: courseId,
			});
			const res: UserCoursePostResponse = { success: true, action: "added" };
			return new Response(JSON.stringify(res), { status: 201 });
		}
	} catch (_e) {
		const res: UserCoursePostResponse = { error: "Internal Server Error" };
		return new Response(JSON.stringify(res), { status: 500 });
	}
};

// --- PATCH (Update Metadata like isVisible) ---
export const PATCH: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user)
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});

	try {
		const { courseId, isVisible, colorCustom, memo } =
			(await request.json()) as {
				courseId: number;
				isVisible?: boolean;
				colorCustom?: string | null;
				memo?: string;
			};

		if (courseId === undefined) {
			return new Response(JSON.stringify({ error: "Missing courseId" }), {
				status: 400,
			});
		}

		const db = drizzle(env.timetable_icu, { schema });

		// 更新用オブジェクトを動的に構築
		const updateData: any = {};
		if (isVisible !== undefined) updateData.isVisible = isVisible;
		if (memo !== undefined) updateData.memo = memo;
		if (colorCustom !== undefined) updateData.colorCustom = colorCustom;

		const result = await db
			.update(schema.userCourses)
			.set(updateData)
			.where(
				and(
					eq(schema.userCourses.userId, user.id),
					eq(schema.userCourses.courseId, courseId),
				),
			)
			.returning();

		if (result.length === 0) {
			return new Response(
				JSON.stringify({ error: "Course not found in user's list" }),
				{ status: 404 },
			);
		}

		return new Response(JSON.stringify({ success: true, isVisible }), {
			status: 200,
		});
	} catch (_e) {
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};

// --- DELETE (Explicit Removal) ---
export const DELETE: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user)
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});

	try {
		const { courseId } = (await request.json()) as { courseId: number };

		if (!courseId) {
			return new Response(JSON.stringify({ error: "Missing courseId" }), {
				status: 400,
			});
		}

		const db = drizzle(env.timetable_icu, { schema });

		const result = await db
			.delete(schema.userCourses)
			.where(
				and(
					eq(schema.userCourses.userId, user.id),
					eq(schema.userCourses.courseId, courseId),
				),
			)
			.returning();

		if (result.length === 0) {
			return new Response(JSON.stringify({ error: "Course not found" }), {
				status: 404,
			});
		}

		return new Response(JSON.stringify({ success: true, action: "removed" }), {
			status: 200,
		});
	} catch (_e) {
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};

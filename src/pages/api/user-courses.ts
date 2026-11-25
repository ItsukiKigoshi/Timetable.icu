import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import type { SELECTABLE_TERMS } from "@/constants/time";
import * as schema from "@/db/schema";

export type UserCoursePostResponse =
	| { success: true; action: "added" | "removed" }
	| { error: string };

// --- GET (Fetch User Courses) ---
export const GET: APIRoute = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return new Response(JSON.stringify({ error: "Unauthorized" }), {
			status: 401,
		});
	}

	try {
		const url = new URL(request.url);
		const yearParam = url.searchParams.get("year");
		const termParam = url.searchParams.get("term");
		const yearNum = yearParam ? Number(yearParam) : undefined;
		const termVal = termParam as (typeof SELECTABLE_TERMS)[number] | null;

		const db = drizzle(env.timetable_icu, { schema });

		// 1. 公式コース
		const results = await db.query.userCourses.findMany({
			where: (uc, { eq }) => eq(uc.userId, user.id),
			with: {
				course: {
					with: {
						schedules: true,
					},
				},
			},
		});

		// 2. カスタムコース
		const customConditions = [eq(schema.customCourses.userId, user.id)];
		if (yearNum) customConditions.push(eq(schema.customCourses.year, yearNum));
		if (termVal) customConditions.push(eq(schema.customCourses.term, termVal));

		const customResults = await db.query.customCourses.findMany({
			where: and(...customConditions),
			with: {
				schedules: true,
			},
		});

		let officialMapped = results
			.filter(
				(uc): uc is typeof uc & { course: NonNullable<typeof uc.course> } => {
					return uc.course !== null;
				},
			)
			.map((uc) => ({
				...uc.course,
				isVisible: uc.isVisible,
				selectedAltGroupId: uc.selectedAltGroupId,
				colorCustom: uc.colorCustom,
				memo: uc.memo,
				type: "official" as const,
			}));

		if (yearNum) {
			officialMapped = officialMapped.filter((c) => c.year === yearNum);
		}
		if (termVal) {
			officialMapped = officialMapped.filter((c) => c.term === termVal);
		}

		const customMapped = customResults.map((cc) => ({
			...cc,
			type: "custom" as const,
		}));

		const allCourses = [...officialMapped, ...customMapped];

		return new Response(JSON.stringify({ courses: allCourses }), {
			headers: { "Content-Type": "application/json" },
		});
	} catch (e: unknown) {
		console.error("Failed to fetch user courses:", e);
		return new Response(JSON.stringify({ error: "Internal Server Error" }), {
			status: 500,
		});
	}
};

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
		}

		// 存在しない場合は追加 (Toggle ON)
		await db.insert(schema.userCourses).values({
			userId: user.id,
			courseId: courseId,
		});
		const res: UserCoursePostResponse = { success: true, action: "added" };
		return new Response(JSON.stringify(res), { status: 201 });
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
		const updateData: Partial<typeof schema.userCourses.$inferInsert> = {};
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

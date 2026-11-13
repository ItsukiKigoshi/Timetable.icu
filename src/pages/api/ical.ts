import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";
import { inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";
import { DEFAULT_TERM, DEFAULT_YEAR } from "@/constants/time";
import type { UserCourseWithDetails } from "@/db/schema";
import * as schema from "@/db/schema";
import {
	decodeCompactPayload,
	generateTimetableICS,
} from "@/lib/timetable/ical";

async function createIcalSignature(
	secret: string,
	year: number,
	term: string,
	ids: string,
): Promise<string> {
	const enc = new TextEncoder();
	const key = await crypto.subtle.importKey(
		"raw",
		enc.encode(secret),
		{ name: "HMAC", hash: "SHA-256" },
		false,
		["sign"],
	);
	const data = enc.encode(`ical:${year}:${term}:${ids}`);
	const signature = await crypto.subtle.sign("HMAC", key, data);
	const bytes = new Uint8Array(signature);
	let hex = "";
	for (const b of bytes) {
		hex += b.toString(16).padStart(2, "0");
	}
	return hex.slice(0, 32);
}

async function verifyIcalSignature(
	secret: string,
	year: number,
	term: string,
	ids: string,
	sig: string | null,
): Promise<boolean> {
	if (!sig) return false;
	const expected = await createIcalSignature(secret, year, term, ids);
	return expected === sig;
}

export const GET: APIRoute = async ({ request, locals }) => {
	const url = new URL(request.url);
	const year = Number(url.searchParams.get("year")) || DEFAULT_YEAR;
	const term = url.searchParams.get("term") || DEFAULT_TERM;
	const idsParam = url.searchParams.get("ids") || "";
	const cParam = url.searchParams.get("c");
	const sigParam = url.searchParams.get("sig");
	const redirectProvider = url.searchParams.get("redirect");

	const isDirectIcuUser = Boolean(locals.user?.email?.endsWith("@icu.ac.jp"));

	// カレンダーアプリへのリダイレクト処理
	if (
		redirectProvider === "google" ||
		redirectProvider === "apple" ||
		redirectProvider === "microsoft"
	) {
		const feedUrl = new URL("/api/ical", url.origin);
		feedUrl.searchParams.set("year", String(year));
		feedUrl.searchParams.set("term", term);
		if (idsParam) feedUrl.searchParams.set("ids", idsParam);
		if (cParam) feedUrl.searchParams.set("c", cParam);

		if (isDirectIcuUser && env.BETTER_AUTH_SECRET) {
			const sig = await createIcalSignature(
				env.BETTER_AUTH_SECRET,
				year,
				term,
				idsParam,
			);
			feedUrl.searchParams.set("sig", sig);
		}

		const webcalUrl = feedUrl.toString().replace(/^https?:\/\//, "webcal://");
		const calName = `Timetable ${year} ${term}`;

		if (redirectProvider === "google") {
			const googleUrl = `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl)}`;
			return Response.redirect(googleUrl, 302);
		}
		if (redirectProvider === "microsoft") {
			const outlookUrl = `https://outlook.live.com/owa?path=/calendar/action/compose&rru=addsubscription&url=${encodeURIComponent(webcalUrl)}&name=${encodeURIComponent(calName)}`;
			return Response.redirect(outlookUrl, 302);
		}
		return Response.redirect(webcalUrl, 302);
	}

	// ICSフィードの生成・配信処理
	try {
		const isSignedIcuUser = env.BETTER_AUTH_SECRET
			? await verifyIcalSignature(
					env.BETTER_AUTH_SECRET,
					year,
					term,
					idsParam,
					sigParam,
				)
			: false;
		const isAllowed = isDirectIcuUser || isSignedIcuUser;

		const idList = idsParam
			.split(",")
			.map((s) => parseInt(s.trim(), 10))
			.filter((n) => !Number.isNaN(n));

		let officialCourses: UserCourseWithDetails[] = [];
		if (idList.length > 0) {
			const db = drizzle(env.timetable_icu, { schema });
			const foundCourses = await db.query.courses.findMany({
				where: inArray(schema.courses.id, idList),
				with: { schedules: true },
			});

			const { memoRooms } = decodeCompactPayload(cParam, year, term);

			officialCourses = foundCourses.map((course) => ({
				...course,
				room: memoRooms[String(course.id)] || (isAllowed ? course.room : null),
				isVisible: true,
				selectedAltGroupId: null,
				colorCustom: null,
				memo: memoRooms[String(course.id)]
					? `@${memoRooms[String(course.id)]}`
					: null,
				type: "official" as const,
			}));
		}

		const { customCourses } = decodeCompactPayload(cParam, year, term);
		const allCourses = [...officialCourses, ...customCourses];

		const icsContent = generateTimetableICS(allCourses, { year, term });

		return new Response(icsContent, {
			status: 200,
			headers: {
				"Content-Type": "text/calendar; charset=utf-8",
				"Content-Disposition": `inline; filename="timetable_y${year}_${term}.ics"`,
				"Cache-Control": "no-cache, no-store, must-revalidate",
			},
		});
	} catch (e) {
		console.error("Failed to generate iCal feed:", e);
		return new Response("Internal Server Error", { status: 500 });
	}
};

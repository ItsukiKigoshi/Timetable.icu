import ical, { ICalEventRepeatingFreq } from "ical-generator";
import academicCalendarData from "@/constants/academic-calendar.json";
import type { SELECTABLE_DAYS, SELECTABLE_TERMS } from "@/constants/time";
import type { UserCourseWithDetails } from "@/db/schema";

export interface TermCalendarInfo {
	startDate: string;
	endDate: string;
	holidays: string[];
}

type AcademicCalendarMap = Record<
	string,
	Record<string, TermCalendarInfo | undefined> | undefined
>;

const academicCalendar = academicCalendarData as AcademicCalendarMap;

const DAY_TO_INT: Record<string, number> = {
	Mon: 1,
	M: 1,
	m: 1,
	mon: 1,
	Tue: 2,
	TU: 2,
	Tu: 2,
	tu: 2,
	tue: 2,
	Wed: 3,
	W: 3,
	w: 3,
	wed: 3,
	Thu: 4,
	TH: 4,
	Th: 4,
	th: 4,
	thu: 4,
	Fri: 5,
	F: 5,
	f: 5,
	fri: 5,
	Sat: 6,
	SA: 6,
	Sa: 6,
	sa: 6,
	sat: 6,
};

export function getTermCalendarInfo(
	year: number,
	term: string,
): TermCalendarInfo {
	const entry = academicCalendar[String(year)]?.[term];
	if (entry) {
		return entry;
	}
	if (term === "Spring") {
		return {
			startDate: `${year}-04-11`,
			endDate: `${year}-06-17`,
			holidays: [],
		};
	}
	if (term === "Autumn") {
		return {
			startDate: `${year}-09-05`,
			endDate: `${year}-11-10`,
			holidays: [],
		};
	}
	if (term === "Winter") {
		return {
			startDate: `${year}-12-04`,
			endDate: `${year + 1}-02-22`,
			holidays: [],
		};
	}
	return {
		startDate: `${year}-04-11`,
		endDate: `${year}-06-17`,
		holidays: [],
	};
}

export function getDefaultTermDates(
	year: number,
	term: string,
): { start: string; end: string } {
	const info = getTermCalendarInfo(year, term);
	return {
		start: info.startDate,
		end: info.endDate,
	};
}

function parseLocalDate(dateStr: string): Date {
	const [y, m, d] = dateStr.split("-").map((n) => parseInt(n, 10));
	return new Date(y, (m || 1) - 1, d || 1);
}

function formatYMD(d: Date): string {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, "0");
	const day = String(d.getDate()).padStart(2, "0");
	return `${y}-${m}-${day}`;
}

export function getMemoRoomOverride(memo?: string | null): string | null {
	if (!memo) return null;
	const match = memo.match(/^[＠@](.*)$/m);
	return match ? match[1].trim() : null;
}

const getFirstDate = (
	startObj: Date,
	targetDayInt: number,
	holidaySet: Set<string>,
): Date => {
	const d = new Date(
		startObj.getFullYear(),
		startObj.getMonth(),
		startObj.getDate(),
	);
	let diff = targetDayInt - d.getDay();
	if (diff < 0) diff += 7;
	d.setDate(d.getDate() + diff);

	// 初回授業日が休講日にあたる場合は翌週以降へ進める
	while (holidaySet.has(formatYMD(d))) {
		d.setDate(d.getDate() + 7);
	}
	return d;
};

export function generateTimetableICS(
	courses: UserCourseWithDetails[],
	options: {
		year: number;
		term: string;
		startDateStr?: string;
		endDateStr?: string;
		holidays?: string[];
	},
): string {
	const { year, term } = options;
	const calendarInfo = getTermCalendarInfo(year, term);
	const startDateStr = options.startDateStr || calendarInfo.startDate;
	const endDateStr = options.endDateStr || calendarInfo.endDate;
	const holidays = options.holidays ?? calendarInfo.holidays;
	const holidaySet = new Set(holidays);

	const startObj = parseLocalDate(startDateStr);
	const endObj = parseLocalDate(endDateStr);

	if (startObj > endObj) {
		throw new Error("終了日は開始日より後に設定してください。");
	}

	const calendar = ical({
		name: `Timetable ${year} ${term}`,
		prodId: {
			company: "timetable.icu",
			product: "Timetable Simulator",
			language: "JA",
		},
	});

	const untilDate = new Date(
		endObj.getFullYear(),
		endObj.getMonth(),
		endObj.getDate(),
		23,
		59,
		59,
		999,
	);

	const termCourses = courses.filter(
		(b) => b.term === term && Number(b.year) === Number(year),
	);

	termCourses.forEach((course) => {
		const schedules = course.schedules || [];
		const title =
			("titleJa" in course && course.titleJa) ||
			("titleEn" in course && course.titleEn) ||
			("title" in course && course.title) ||
			"Untitled";
		const code =
			("courseCode" in course && course.courseCode) ||
			("rgNo" in course && course.rgNo) ||
			"";
		const instructor = course.instructor || "";
		const memoRoom = getMemoRoomOverride(course.memo);
		const room = memoRoom || course.room || "";

		schedules.forEach((s, idx) => {
			const dayInt = DAY_TO_INT[s.dayOfWeek];
			if (dayInt === undefined) return;

			const firstClassDate = getFirstDate(startObj, dayInt, holidaySet);
			if (firstClassDate > endObj) return;

			const [startH, startM] = (s.startTime || "00:00")
				.split(":")
				.map((n) => parseInt(n, 10));
			const [endH, endM] = (s.endTime || "00:00")
				.split(":")
				.map((n) => parseInt(n, 10));

			const classStart = new Date(
				firstClassDate.getFullYear(),
				firstClassDate.getMonth(),
				firstClassDate.getDate(),
				startH || 0,
				startM || 0,
				0,
			);
			const classEnd = new Date(
				firstClassDate.getFullYear(),
				firstClassDate.getMonth(),
				firstClassDate.getDate(),
				endH || 0,
				endM || 0,
				0,
			);

			// 休講日（EXDATE）の算出：初回授業より後かつ終了日以前で同じ曜日の休講日
			const excludeDates: Date[] = [];
			for (const hStr of holidays) {
				const hDate = parseLocalDate(hStr);
				if (
					hDate > firstClassDate &&
					hDate <= endObj &&
					hDate.getDay() === dayInt
				) {
					excludeDates.push(
						new Date(
							hDate.getFullYear(),
							hDate.getMonth(),
							hDate.getDate(),
							startH || 0,
							startM || 0,
							0,
						),
					);
				}
			}

			const uid = `${course.id}-${year}-${s.id ?? idx}@timetable`;

			const xProps: { key: string; value: string }[] = [
				{ key: "X-COURSE-ID", value: `c_${course.id}` },
			];
			if (course.type === "custom") {
				xProps.push({ key: "X-COURSE-TYPE", value: "custom" });
			}

			calendar.createEvent({
				id: uid,
				summary: title,
				start: classStart,
				end: classEnd,
				timezone: "Asia/Tokyo",
				repeating: {
					freq: ICalEventRepeatingFreq.WEEKLY,
					until: untilDate,
					exclude: excludeDates.length > 0 ? excludeDates : undefined,
				},
				description: [code, instructor].filter(Boolean).join(" / "),
				location: room || undefined,
				x: xProps,
			});
		});
	});

	return calendar.toString();
}

export function downloadICSFile(icsContent: string, filename: string): void {
	const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
	const link = document.createElement("a");
	link.href = URL.createObjectURL(blob);
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(link.href);
}

export interface CompactCustomCourse {
	id: string;
	t: string;
	i?: string;
	r?: string;
	s: [string, string, string][];
}

export interface CompactIcalPayload {
	c?: CompactCustomCourse[];
	m?: Record<string, string>;
}

export function encodeBase64Url(str: string): string {
	const bytes = new TextEncoder().encode(str);
	let binary = "";
	for (const b of bytes) {
		binary += String.fromCharCode(b);
	}
	return btoa(binary)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=+$/, "");
}

export function decodeBase64Url(base64Url: string): string {
	const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
	const padded = base64 + "===".slice((base64.length + 3) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i++) {
		bytes[i] = binary.charCodeAt(i);
	}
	return new TextDecoder().decode(bytes);
}

export function decodeCompactPayload(
	encoded: string | null,
	year: number,
	term: string,
): {
	customCourses: UserCourseWithDetails[];
	memoRooms: Record<string, string>;
} {
	if (!encoded) {
		return { customCourses: [], memoRooms: {} };
	}
	try {
		const raw = decodeBase64Url(encoded);
		const parsed = JSON.parse(raw) as CompactIcalPayload;
		const customCourses: UserCourseWithDetails[] = (parsed.c || []).map(
			(item, idx) => ({
				id: item.id || `custom-${idx}`,
				userId: "",
				title: item.t || "Untitled",
				instructor: item.i || null,
				room: item.r || null,
				units: 0,
				year,
				term: term as (typeof SELECTABLE_TERMS)[number],
				isVisible: true,
				colorCustom: null,
				memo: null,
				createdAt: null,
				type: "custom" as const,
				schedules: (item.s || []).map((sched, sIdx) => ({
					id: sIdx,
					customCourseId: item.id || `custom-${idx}`,
					dayOfWeek: sched[0] as (typeof SELECTABLE_DAYS)[number],
					period: null,
					startTime: sched[1],
					endTime: sched[2],
				})),
			}),
		);
		return {
			customCourses,
			memoRooms: parsed.m || {},
		};
	} catch {
		return { customCourses: [], memoRooms: {} };
	}
}

export function buildIcalRedirectUrl(
	courses: UserCourseWithDetails[],
	options: {
		year: number;
		term: string;
		provider: "google" | "apple" | "microsoft";
	},
): string {
	const { year, term, provider } = options;
	const termCourses = courses.filter(
		(c) => Number(c.year) === Number(year) && c.term === term,
	);

	const officialIds: number[] = [];
	const customList: CompactCustomCourse[] = [];
	const memoRooms: Record<string, string> = {};

	for (const c of termCourses) {
		if (c.type === "official") {
			officialIds.push(Number(c.id));
			const memoOverride = getMemoRoomOverride(c.memo);
			if (memoOverride) {
				memoRooms[String(c.id)] = memoOverride;
			}
		} else {
			const memoOverride = getMemoRoomOverride(c.memo);
			customList.push({
				id: String(c.id),
				t: c.title,
				i: c.instructor || undefined,
				r: memoOverride || c.room || undefined,
				s: (c.schedules || []).map((s) => [
					s.dayOfWeek,
					s.startTime,
					s.endTime,
				]),
			});
		}
	}

	const params = new URLSearchParams();
	params.set("year", String(year));
	params.set("term", term);
	if (officialIds.length > 0) {
		params.set("ids", officialIds.join(","));
	}

	if (customList.length > 0 || Object.keys(memoRooms).length > 0) {
		const payload: CompactIcalPayload = {};
		if (customList.length > 0) payload.c = customList;
		if (Object.keys(memoRooms).length > 0) payload.m = memoRooms;
		params.set("c", encodeBase64Url(JSON.stringify(payload)));
	}

	params.set("redirect", provider);
	return `/api/ical?${params.toString()}`;
}

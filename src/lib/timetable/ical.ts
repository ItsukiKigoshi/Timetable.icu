import ical, { ICalEventRepeatingFreq } from "ical-generator";
import {
	ACADEMIC_CALENDAR,
	PERIODS,
	type TermCalendarInfo,
} from "@/constants/time";
import type { UserCourseWithDetails } from "@/db/schema";

const DAY_TO_INT: Record<string, number> = {
	mon: 1,
	m: 1,
	tue: 2,
	tu: 2,
	wed: 3,
	w: 3,
	thu: 4,
	th: 4,
	fri: 5,
	f: 5,
	sat: 6,
	sa: 6,
};

const FALLBACK_DATES: Record<string, (y: number) => [string, string]> = {
	Spring: (y) => [`${y}-04-11`, `${y}-06-17`],
	Autumn: (y) => [`${y}-09-05`, `${y}-11-10`],
	Winter: (y) => [`${y}-12-04`, `${y + 1}-02-22`],
};

export function getTermCalendarInfo(
	year: number,
	term: string,
): TermCalendarInfo {
	const entry = ACADEMIC_CALENDAR[String(year)]?.[term];
	if (entry) return entry;

	const [startDate, endDate] = (FALLBACK_DATES[term] ?? FALLBACK_DATES.Spring)(
		year,
	);
	return { startDate, endDate, holidays: [] };
}

const parseLocalDate = (dateStr: string): Date => {
	const [y, m, d] = dateStr.split("-").map(Number);
	return new Date(y, (m || 1) - 1, d || 1);
};

const withTime = (base: Date, timeStr: string): Date => {
	const [h, m] = (timeStr || "00:00").split(":").map(Number);
	return new Date(
		base.getFullYear(),
		base.getMonth(),
		base.getDate(),
		h || 0,
		m || 0,
	);
};

const formatYMD = (d: Date): string =>
	`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

// メモ欄に「＠」か「@」で始まる行があれば教室情報として処理
export const getMemoRoomOverride = (memo?: string | null): string | null =>
	memo?.match(/^[＠@](.*)$/m)?.[1].trim() || null;

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
	d.setDate(d.getDate() + ((targetDayInt - d.getDay() + 7) % 7));
	while (holidaySet.has(formatYMD(d))) {
		d.setDate(d.getDate() + 7);
	}
	return d;
};

/**
 * 同じ曜日かつ PERIODS 上で隣り合うコマ（例: 2限と3限、3限と昼など）を1つの予定に結合する
 */
function mergeAdjacentPeriods(schedules: UserCourseWithDetails["schedules"]) {
	const normalized = (schedules || [])
		.map((s) => {
			const dayInt = DAY_TO_INT[s.dayOfWeek.toLowerCase()];
			if (dayInt === undefined) return null;
			const startIdx = PERIODS.findIndex((p) => p.start === s.startTime);
			const endIdx = PERIODS.findIndex((p) => p.end === s.endTime);
			return {
				id: s.id,
				dayInt,
				startTime: s.startTime || "00:00",
				endTime: s.endTime || "00:00",
				startIdx,
				endIdx,
			};
		})
		.filter((v): v is NonNullable<typeof v> => v !== null)
		.sort(
			(a, b) => a.dayInt - b.dayInt || a.startTime.localeCompare(b.startTime),
		);

	const merged: typeof normalized = [];
	for (const item of normalized) {
		const prev = merged[merged.length - 1];
		const isAdjacent =
			prev &&
			prev.dayInt === item.dayInt &&
			prev.endIdx !== -1 &&
			item.startIdx !== -1 &&
			item.startIdx === prev.endIdx + 1;

		if (isAdjacent) {
			prev.endTime = item.endTime;
			prev.endIdx = item.endIdx;
		} else {
			merged.push({ ...item });
		}
	}
	return merged;
}

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
	const info = getTermCalendarInfo(year, term);
	const startObj = parseLocalDate(options.startDateStr || info.startDate);
	const endObj = parseLocalDate(options.endDateStr || info.endDate);
	const holidays = options.holidays ?? info.holidays;

	if (startObj > endObj) {
		throw new Error("終了日は開始日より後に設定してください。");
	}

	const holidaySet = new Set(holidays);
	const holidayDates = holidays.map(parseLocalDate);
	const untilDate = new Date(
		endObj.getFullYear(),
		endObj.getMonth(),
		endObj.getDate(),
		23,
		59,
		59,
		999,
	);

	const calendar = ical({
		name: `Timetable ${year} ${term}`,
		prodId: {
			company: "Timetable.icu Team",
			product: "Timetable.icu",
			language: "JA",
		},
	});

	for (const course of courses) {
		if (course.term !== term || Number(course.year) !== Number(year)) continue;

		const title =
			("titleJa" in course && course.titleJa) ||
			("titleEn" in course && course.titleEn) ||
			("title" in course && course.title) ||
			"Untitled";
		const code =
			("courseCode" in course && course.courseCode) ||
			("rgNo" in course && course.rgNo) ||
			"";
		const room = getMemoRoomOverride(course.memo) || course.room || "";

		mergeAdjacentPeriods(course.schedules).forEach((s, idx) => {
			const firstDate = getFirstDate(startObj, s.dayInt, holidaySet);
			if (firstDate > endObj) return;

			const excludeDates = holidayDates
				.filter((h) => h > firstDate && h <= endObj && h.getDay() === s.dayInt)
				.map((h) => withTime(h, s.startTime));

			calendar.createEvent({
				id: `${course.id}-${year}-${s.id ?? idx}@timetable`,
				summary: title,
				start: withTime(firstDate, s.startTime),
				end: withTime(firstDate, s.endTime),
				timezone: "Asia/Tokyo",
				repeating: {
					freq: ICalEventRepeatingFreq.WEEKLY,
					until: untilDate,
					exclude: excludeDates.length ? excludeDates : undefined,
				},
				description: [code, course.instructor].filter(Boolean).join(" / "),
				location: room || undefined,
				x: [
					{ key: "X-COURSE-ID", value: `c_${course.id}` },
					...(course.type === "custom"
						? [{ key: "X-COURSE-TYPE", value: "custom" }]
						: []),
				],
			});
		});
	}

	return calendar.toString();
}

export function downloadICSFile(icsContent: string, filename: string): void {
	const url = URL.createObjectURL(
		new Blob([icsContent], { type: "text/calendar;charset=utf-8" }),
	);
	const link = Object.assign(document.createElement("a"), {
		href: url,
		download: filename,
	});
	document.body.appendChild(link);
	link.click();
	link.remove();
	URL.revokeObjectURL(url);
}

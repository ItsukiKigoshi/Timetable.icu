import ical, { ICalEventRepeatingFreq } from "ical-generator";
import type {
	CustomCourseWithDetails,
	UserCourseWithDetails,
} from "@/db/schema";

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

export function getDefaultTermDates(
	year: number,
	term: string,
): { start: string; end: string } {
	if (term === "Spring") {
		return {
			start: `${year}-04-01`,
			end: `${year}-06-30`,
		};
	}
	if (term === "Autumn") {
		return {
			start: `${year}-09-01`,
			end: `${year}-11-30`,
		};
	}
	if (term === "Winter") {
		return {
			start: `${year}-12-01`,
			end: `${year + 1}-02-28`,
		};
	}
	return {
		start: `${year}-04-01`,
		end: `${year}-06-30`,
	};
}

const getFirstDate = (startObj: Date, targetDayInt: number): Date => {
	const d = new Date(
		startObj.getFullYear(),
		startObj.getMonth(),
		startObj.getDate(),
	);
	let diff = targetDayInt - d.getDay();
	if (diff < 0) diff += 7;
	d.setDate(d.getDate() + diff);
	return d;
};

export function generateTimetableICS(
	courses: UserCourseWithDetails[],
	options: {
		year: number;
		term: string;
		startDateStr: string;
		endDateStr: string;
	},
): string {
	const { year, term, startDateStr, endDateStr } = options;
	const startObj = new Date(startDateStr);
	const endObj = new Date(endDateStr);

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
		const room = course.room || "";

		schedules.forEach((s, idx) => {
			const dayInt = DAY_TO_INT[s.dayOfWeek];
			if (dayInt === undefined) return;

			const firstClassDate = getFirstDate(startObj, dayInt);
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

			const uid = `${course.id}-${year}-${s.id ?? idx}@timetable`;

			const xProps: { key: string; value: string }[] = [
				{ key: "X-COURSE-ID", value: `c_${course.id}` },
			];
			if (course.type === "custom") {
				xProps.push({ key: "X-COURSE-TYPE", value: "custom" });
				xProps.push({
					key: "X-CUSTOM-DATA",
					value: encodeURIComponent(JSON.stringify(course)),
				});
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

export function parseICSForCourseIds(icsText: string): {
	officialIds: number[];
	customCourses: CustomCourseWithDetails[];
} {
	// RFC 5545 line unfolding: lines folded with CRLF + space or tab are rejoined
	const unfolded = icsText.replace(/\r?\n[ \t]/g, "");

	const officialIdsSet = new Set<number>();
	const customCoursesList: CustomCourseWithDetails[] = [];
	const seenCustomKeys = new Set<string>();

	// 1. Check for custom course data
	const customDataRegex = /X-CUSTOM-DATA:\s*([^\r\n]+)/gi;
	let customMatch: RegExpExecArray | null;
	while (true) {
		customMatch = customDataRegex.exec(unfolded);
		if (customMatch === null) break;
		try {
			const decoded = decodeURIComponent(customMatch[1].trim());
			const parsed = JSON.parse(decoded) as CustomCourseWithDetails;
			const key = String(parsed.id || parsed.title);
			if (!seenCustomKeys.has(key)) {
				seenCustomKeys.add(key);
				customCoursesList.push(parsed);
			}
		} catch (e) {
			console.error("Failed to parse custom course data from ICS", e);
		}
	}

	// 2. Check X-COURSE-ID: c_123 or 123
	const courseIdRegex = /X-COURSE-ID:\s*(?:c_)?([a-zA-Z0-9_-]+)/gi;
	let match: RegExpExecArray | null;
	while (true) {
		match = courseIdRegex.exec(unfolded);
		if (match === null) break;
		const raw = match[1].trim();
		const num = parseInt(raw.replace(/^c_/, ""), 10);
		if (!Number.isNaN(num)) {
			officialIdsSet.add(num);
		}
	}

	// 3. Fallback: Check UID: c_123-... or 123-...
	const uidRegex = /UID:\s*(?:c_)?([a-zA-Z0-9_-]+)-\d+-/gi;
	while (true) {
		match = uidRegex.exec(unfolded);
		if (match === null) break;
		const raw = match[1].trim();
		const num = parseInt(raw.replace(/^c_/, ""), 10);
		if (!Number.isNaN(num)) {
			officialIdsSet.add(num);
		}
	}

	return {
		officialIds: Array.from(officialIdsSet),
		customCourses: customCoursesList,
	};
}

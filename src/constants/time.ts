// src/constants/time.ts
export const SELECTABLE_YEARS = [2026] as const;
export const SELECTABLE_TERMS = ["Spring", "Autumn", "Winter"] as const;
export const SELECTABLE_DAYS = [
	"Mon",
	"Tue",
	"Wed",
	"Thu",
	"Fri",
	"Sat",
] as const;

export const DEFAULT_YEAR = 2026; // new Date().getFullYear() didnt work on Workers
export const DEFAULT_TERM = SELECTABLE_TERMS["2"];

export const PERIODS = [
	{ label: "1", start: "08:45", end: "10:00" },
	{ label: "2", start: "10:10", end: "11:25" },
	{ label: "3", start: "11:35", end: "12:50" },
	{ label: "昼", start: "12:50", end: "14:00" },
	{ label: "4", start: "14:00", end: "15:15" },
	{ label: "5", start: "15:25", end: "16:40" },
	{ label: "6", start: "16:50", end: "18:05" },
	{ label: "7", start: "18:15", end: "19:30" },
	{ label: "夜", start: "19:30", end: "20:10" },
];

export const TIMETABLE_CONFIG = {
	START_TIME: 8 * 60 + 45, // 08:45
	END_TIME: 20 * 60, // 20:00
	HEADER_HEIGHT: 20,
} as const;

export interface TermCalendarInfo {
	startDate: string;
	endDate: string;
	holidays: string[];
}

export const ACADEMIC_CALENDAR: Record<
	string,
	Record<string, TermCalendarInfo | undefined> | undefined
> = {
	"2026": {
		Spring: {
			startDate: "2026-04-11",
			endDate: "2026-06-17",
			holidays: ["2026-05-02", "2026-05-04", "2026-05-05", "2026-05-06"],
		},
		Autumn: {
			startDate: "2026-09-05",
			endDate: "2026-11-10",
			holidays: ["2026-10-10", "2026-10-12", "2026-10-13"],
		},
		Winter: {
			startDate: "2026-12-04",
			endDate: "2027-02-22",
			holidays: [
				"2026-12-23",
				"2026-12-24",
				"2026-12-25",
				"2026-12-26",
				"2026-12-28",
				"2026-12-29",
				"2026-12-30",
				"2026-12-31",
				"2027-01-01",
				"2027-01-02",
				"2027-01-04",
				"2027-01-05",
				"2027-01-11",
				"2027-02-05",
				"2027-02-06",
			],
		},
	},
};

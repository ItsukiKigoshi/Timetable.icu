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
export const DEFAULT_TERM = SELECTABLE_TERMS["0"];

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

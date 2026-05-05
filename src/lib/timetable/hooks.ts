// src/lib/timetable/hooks.ts
import type { User } from "better-auth";
import { useEffect, useMemo, useState } from "react";
import type { SELECTABLE_TERMS } from "@/constants/time";
import type {
	CourseFormInput,
	FlatSchedule,
	UserCourseWithDetails,
} from "@/db/schema";
import { computeDisplaySchedules } from "@/lib/timetable/utils.ts";

export function useTimetable({
	initialCourses = [],
	user,
	selectedYear,
	selectedTerm,
}: {
	initialCourses?: UserCourseWithDetails[];
	user?: User | null;
	selectedYear: number;
	selectedTerm: string;
}) {
	const [courses, setCourses] =
		useState<UserCourseWithDetails[]>(initialCourses);

	useEffect(() => {
		if (!user) {
			const cached = localStorage.getItem("guest_timetable");
			if (cached) {
				try {
					setCourses(JSON.parse(cached));
				} catch (_e) {
					setCourses(initialCourses);
				}
			}
		} else {
			setCourses(initialCourses);
		}
	}, [user, initialCourses]);

	const allSchedules = useMemo(() => {
		return courses.flatMap((course) =>
			course.schedules.map((s) => {
				const { id: _unused, ...scheduleData } = s;
				return {
					...course,
					...scheduleData,
					id: course.id,
					scheduleId: s.id,
					type: course.type,
				} as unknown as FlatSchedule;
			}),
		);
	}, [courses]);

	const displayCourses = useMemo(() => {
		return courses.filter(
			(uc) => uc.year === selectedYear && uc.term === selectedTerm,
		);
	}, [courses, selectedYear, selectedTerm]);

	const displaySchedules = useMemo(() => {
		const visibleOnly = allSchedules
			.filter((uc) => uc.year === selectedYear && uc.term === selectedTerm)
			.filter((s) => s.isVisible !== false);
		return computeDisplaySchedules(visibleOnly);
	}, [allSchedules, selectedYear, selectedTerm]);

	const registeredIds = useMemo(() => {
		return new Set(courses.map((c) => `${c.type}-${c.id}`));
	}, [courses]);

	const syncLocalStorage = (nextCourses: UserCourseWithDetails[]) => {
		if (user) return;
		localStorage.setItem("guest_timetable", JSON.stringify(nextCourses));
	};

	const saveCustomCourse = async (
		formData: CourseFormInput,
		mode: "create" | "edit",
	) => {
		const isNew = mode === "create";
		const tempId = isNew ? `custom-${Date.now()}` : formData.id;

		const newCourse: UserCourseWithDetails = {
			...formData,
			id: tempId,
			type: "custom",
			isVisible: true,
			year: selectedYear,
			term: selectedTerm as (typeof SELECTABLE_TERMS)[number],
			schedules: formData.schedules.map((s, idx) => ({ ...s, id: idx })),
		} as UserCourseWithDetails;

		const nextCourses = !isNew
			? courses.map((c) =>
					c.type === "custom" && String(c.id) === String(formData.id)
						? newCourse
						: c,
				)
			: [...courses, newCourse];

		setCourses(nextCourses);
		syncLocalStorage(nextCourses);

		if (user) {
			try {
				const method = isNew ? "POST" : "PATCH";
				const response = await fetch("/api/custom-courses", {
					method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						...formData,
						id: isNew ? undefined : formData.id,
					}),
				});

				if (isNew && response.ok) {
					const data = (await response.json()) as {
						success: boolean;
						id: number;
					};
					if (data.id) {
						setCourses((prev) =>
							prev.map((c) => {
								if (c.id === tempId) {
									return { ...c, id: data.id } as UserCourseWithDetails;
								}
								return c;
							}),
						);
					}
				}
			} catch (e) {
				console.error("Failed to save custom course", e);
			}
		}
	};

	const toggleVisibility = async (course: UserCourseWithDetails) => {
		const { id, type, isVisible } = course;
		const nextVisible = !isVisible;

		const nextCourses = courses.map((c) =>
			c.id === id && c.type === type ? { ...c, isVisible: nextVisible } : c,
		);

		setCourses(nextCourses);
		syncLocalStorage(nextCourses);

		if (user) {
			const endpoint =
				type === "custom" ? "/api/custom-courses" : "/api/user-courses";
			await fetch(endpoint, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, courseId: id, isVisible: nextVisible }),
			});
		}
	};

	const updateColor = async (
		course: UserCourseWithDetails,
		nextColor: string | null,
	) => {
		const { id, type } = course;
		const nextCourses = courses.map((c) =>
			c.id === id && c.type === type ? { ...c, colorCustom: nextColor } : c,
		);

		setCourses(nextCourses);
		syncLocalStorage(nextCourses);

		if (user) {
			const endpoint =
				type === "custom" ? "/api/custom-courses" : "/api/user-courses";
			await fetch(endpoint, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, courseId: id, colorCustom: nextColor }),
			});
		}
	};

	const updateMemo = async (
		course: UserCourseWithDetails,
		nextMemo: string,
	) => {
		const { id, type } = course;
		const nextCourses = courses.map((c) =>
			c.id === id && c.type === type ? { ...c, memo: nextMemo } : c,
		);

		setCourses(nextCourses);
		syncLocalStorage(nextCourses);

		if (user) {
			const endpoint =
				type === "custom" ? "/api/custom-courses" : "/api/user-courses";
			await fetch(endpoint, {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id, courseId: id, memo: nextMemo }),
			});
		}
	};

	return {
		courses,
		setCourses, // useToggleCourse内で状態を更新できるようにエクスポート
		registeredIds,
		schedules: allSchedules,
		displayCourses,
		displaySchedules,
		saveCustomCourse,
		toggleVisibility,
		updateColor,
		updateMemo,
	};
}

import type { User } from "better-auth";
import { useCallback, useEffect, useState } from "react";
import type {
	OfficialCourseWithDetails,
	UserCourseWithDetails,
} from "@/db/schema";

type CourseType = OfficialCourseWithDetails | UserCourseWithDetails;

interface UseToggleCourseOptions {
	user?: User | null;
	// 楽観的UI更新のためのコールバック
	onToggleSuccess?: (course: CourseType, isAdded: boolean) => void;
	// エラー時のロールバックのためのコールバック
	onToggleError?: (course: CourseType, wasRegistered: boolean) => void;
}

export const useToggleCourse = ({
	user,
	onToggleSuccess,
	onToggleError,
}: UseToggleCourseOptions) => {
	const [isSubmitting, setIsSubmitting] = useState<number | string | null>(
		null,
	);

	const toggleCourse = async (
		course: CourseType,
		isCurrentlyRegistered: boolean,
	) => {
		const { id, type } = course;
		if (isSubmitting === id) return;

		setIsSubmitting(id);

		try {
			// 1. 楽観的アップデート (UIへ即座に反映)
			onToggleSuccess?.(course, !isCurrentlyRegistered);

			// 2. 状態の永続化
			if (!user) {
				// ゲスト時: ローカルストレージの guest_timetable を直接更新
				const cached = localStorage.getItem("guest_timetable");
				let guestCourses: UserCourseWithDetails[] = [];
				if (cached) {
					try {
						guestCourses = JSON.parse(cached);
					} catch (e) {
						console.error("Failed to parse guest_timetable", e);
					}
				}

				if (isCurrentlyRegistered) {
					guestCourses = guestCourses.filter(
						(c) => !(c.id === id && c.type === type),
					);
				} else {
					const newCourse: UserCourseWithDetails = {
						...course,
						isVisible: true,
					};
					guestCourses.push(newCourse);
				}
				localStorage.setItem("guest_timetable", JSON.stringify(guestCourses));
			} else {
				// ログイン時: サーバーと同期
				const endpoint =
					type === "custom" ? "/api/custom-courses" : "/api/user-courses";
				const method = isCurrentlyRegistered ? "DELETE" : "POST";

				const res = await fetch(endpoint, {
					method,
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ id, courseId: id }),
				});

				if (!res.ok) {
					throw new Error("Failed to sync course with server");
				}
			}
		} catch (e) {
			console.error("Toggle course error:", e);
			// 3. エラー時のロールバック (元の状態に戻す)
			onToggleError?.(course, isCurrentlyRegistered);
			alert("通信エラーが発生したため，変更を保存できませんでした．");
		} finally {
			setIsSubmitting(null);
		}
	};

	return {
		toggleCourse,
		isSubmitting,
	};
};

// ゲストデータをサーバーへ移す
export function useSync(user: User) {
	const [syncStatus, setSyncStatus] = useState<
		"idle" | "syncing" | "done" | "error"
	>("idle");

	const handleSync = useCallback(async () => {
		const guestData = localStorage.getItem("guest_timetable");
		if (!user || !guestData) return;

		try {
			const items = JSON.parse(guestData);
			if (!Array.isArray(items) || items.length === 0) {
				localStorage.removeItem("guest_timetable");
				return;
			}

			setSyncStatus("syncing");
			const res = await fetch("/api/sync", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ courseItems: items }),
			});

			if (!res.ok) throw new Error("Server responded with an error");

			const result = (await res.json()) as {
				success: boolean;
				syncedNormal: number;
				syncedCustom: number;
			};

			if (result.success) {
				Object.keys(localStorage).forEach((key) => {
					if (key.startsWith("guest_timetable_bak_")) {
						localStorage.removeItem(key);
					}
				});

				const timestamp = Date.now();
				localStorage.setItem(`guest_timetable_bak_${timestamp}`, guestData);
				localStorage.removeItem("guest_timetable");

				setSyncStatus("done");
				setTimeout(() => window.location.reload(), 2000);
			} else {
				throw new Error("Sync was not successful according to API");
			}
		} catch (e) {
			console.error("Sync process failed:", e);
			setSyncStatus("error");
		}
	}, [user]);

	useEffect(() => {
		if (user?.id) handleSync();
	}, [user?.id, handleSync]);

	return { syncStatus };
}

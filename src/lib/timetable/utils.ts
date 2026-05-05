import { SELECTABLE_DAYS } from "@/constants/time.ts";
import type { DisplaySchedule, FlatSchedule } from "@/db/schema";

/**
 * Hour to Min
 * E.g.: 8:15 -> 8 * 60 + 15 -> 495
 */
export const timeToMin = (timeStr: string) => {
	const [h, m] = timeStr.split(":").map(Number);
	return h * 60 + m;
};

// Flat Schedule（平坦化されたSchedule+Course）に, 時間割描画に必要な情報（startMin, endMin, col, groupMaxCols, styles）を付加
export const computeDisplaySchedules = (
	schedules: FlatSchedule[],
): DisplaySchedule[] => {
	const allProcessed: DisplaySchedule[] = [];

	SELECTABLE_DAYS.forEach((day) => {
		// 1. 抽出・ソート
		const daySchedules = schedules
			.filter((s) => s.dayOfWeek === day)
			.sort((a, b) => timeToMin(a.startTime) - timeToMin(b.startTime));

		// 2. 結合
		const merged: FlatSchedule[] = [];
		daySchedules.forEach((current) => {
			const currentStart = timeToMin(current.startTime);
			const target = merged.find((m) => {
				const mEnd = timeToMin(m.endTime);
				// idが一致，かつ時間帯が10分以内であれば結合
				return m.id === current.id && currentStart - mEnd <= 10;
			});
			if (target) {
				target.endTime = current.endTime;
			} else {
				merged.push({ ...current });
			}
		});

		// 3. 衝突・列計算
		const tempWithCol: (FlatSchedule & {
			startMin: number;
			endMin: number;
			col: number;
		})[] = [];
		merged.forEach((sched) => {
			const startMin = timeToMin(sched.startTime);
			const endMin = timeToMin(sched.endTime);

			let col = 0;
			// ...衝突判定ロジック...
			while (
				tempWithCol.some(
					(c) =>
						c.col === col &&
						// 衝突判定．絶対値(startMin)同士で比較
						Math.max(startMin, c.startMin) < Math.min(endMin, c.endMin),
				)
			) {
				col++;
			}
			tempWithCol.push({ ...sched, startMin, endMin, col });
		});

		// 4. 幅計算 ＋ スタイル計算
		tempWithCol.forEach((sched) => {
			const group = tempWithCol.filter(
				(other) =>
					Math.max(sched.startMin, other.startMin) <
					Math.min(sched.endMin, other.endMin),
			);
			const groupMaxCols = Math.max(...group.map((c) => c.col)) + 1;

			allProcessed.push({
				...sched,
				groupMaxCols,
			});
		});
	});

	return allProcessed;
};

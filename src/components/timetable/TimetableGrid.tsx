import type { User } from "better-auth";
import {
	PERIODS,
	SELECTABLE_DAYS,
	TIMETABLE_CONFIG,
} from "@/constants/time.ts";
import type { DisplaySchedule } from "@/db/schema/index.ts";
import { timeToMin } from "@/lib/timetable/utils.ts";

interface TimetableGridProps {
	// 1. データ
	displaySchedules: DisplaySchedule[];
	user?: User | null;

	// 2. 状態・ユーティリティ
	isJa: boolean;
	translateDay: (day: string) => string;
	translatePeriod: (p: string) => string;

	// 3. ハンドラー
	handleSlotClick: (day: string, p: (typeof PERIODS)[number]) => void;
}

const TimetableGrid = ({
	displaySchedules,
	user,
	isJa,
	translateDay,
	translatePeriod,
	handleSlotClick,
}: TimetableGridProps) => {
	const containerHeight = "100%";
	const minuteUnit = `calc((${containerHeight} - ${TIMETABLE_CONFIG.HEADER_HEIGHT}px) / ${TIMETABLE_CONFIG.END_TIME - TIMETABLE_CONFIG.START_TIME})`;
	const getTop = (min: number) =>
		`calc((${min} - ${TIMETABLE_CONFIG.START_TIME}) * ${minuteUnit} + ${TIMETABLE_CONFIG.HEADER_HEIGHT}px)`;
	const getHeight = (duration: number) => `calc(${duration} * ${minuteUnit})`;

	return (
		<div className="flex w-full bg-base-100 border-b border-base-content/50 h-full">
			{/* 時刻軸 (左端のカラム) */}
			<div className="w-10 border-l border-r border-t border-base-content/50 relative shrink-0 bg-base-100 z-0">
				<div
					className="border-b border-base-content/50"
					style={{ height: TIMETABLE_CONFIG.HEADER_HEIGHT }}
				/>
				{PERIODS.map((p) => {
					const sMin = timeToMin(p.start);
					return (
						<div
							key={p.label}
							className="absolute w-full h-full flex flex-col items-center border-t border-base-content/50"
							style={{ top: getTop(sMin) }}
						>
							<span className="text-[9px] opacity-60 leading-none pt-1">
								{p.start}
							</span>
							<span className="font-bold text-xs mx-auto">
								{translatePeriod(p.label).slice(0, 1)}
							</span>
						</div>
					);
				})}
			</div>

			{/* 曜日カラム内 */}
			{SELECTABLE_DAYS.map((day) => (
				<div
					key={day}
					className="flex-1 border-r border-t border-base-content/50 relative h-full bg-base-100"
				>
					{/* 曜日ヘッダー */}
					<div
						className="text-center border-b border-base-content/50 text-xs font-bold bg-base-100 z-10 relative flex items-center justify-center"
						style={{ height: TIMETABLE_CONFIG.HEADER_HEIGHT }}
					>
						{translateDay(day)}
					</div>

					{/* 時限ごとの区切り線用スロット (z-0) */}
					{PERIODS.map((p, index) => {
						const pStartMin = timeToMin(p.start);
						const pEndMin = timeToMin(p.end);
						const nextP = PERIODS[index + 1];
						const visualEndMin = nextP ? timeToMin(nextP.start) : pEndMin;
						return (
							<div
								key={`grid-line-${p.label}`}
								className="absolute w-full border-t border-base-content/10 pointer-events-none z-0"
								style={{
									top: getTop(pStartMin),
									height: getHeight(visualEndMin - pStartMin),
								}}
							/>
						);
					})}

					{/* 授業カード: 実際の授業時間 (10分休みを含まない) で描画 (z-5) */}
					{displaySchedules
						.filter((s) => s.dayOfWeek === day)
						.map((sched, _i) => {
							const themeColor = sched.colorCustom || "var(--color-primary)";

							// sched.memo内に@から始まる行があればroomとして表示
							// 1. メモから「＠」行を抽出
							const getMemoOverride = () => {
								if (!sched.memo) return null;
								const match = sched.memo.match(/^[＠@](.*)$/m);
								return match ? match[1].trim() : null;
							};
							const memoOverride = getMemoOverride();
							// 2. 表示判定ロジック
							// - メモ上書きがあれば無条件で表示
							// - メモ上書きがない場合は「カスタム科目」または「ログイン済み」の時だけ本来の room を表示
							const displayRoom =
								memoOverride ||
								(sched.type === "custom" || user ? sched.room : null);

							return (
								<div
									key={sched.id}
									className="absolute z-5"
									style={{
										top: getTop(sched.startMin),
										height: getHeight(sched.endMin - sched.startMin),
										left: `${(sched.col * 100) / sched.groupMaxCols}%`,
										width: `${100 / sched.groupMaxCols}%`,
									}}
								>
									<div className="flex lg:gap-1 gap-0.5 h-full w-full items-stretch bg-base-200 rounded-sm md:p-1 p-0 overflow-hidden">
										{/* 左側のカラーバー */}
										<div
											className="w-1 rounded-full shrink-0"
											style={{ backgroundColor: themeColor }}
										/>
										{/* テキストコンテンツ */}
										<div className="flex flex-col gap-0 min-w-0 overflow-hidden md:break-normal break-all">
											<h1 className="lg:text-sm md:text-xs text-[10px] font-bold leading-tight line-clamp-3 text-base-content/90">
												{isJa
													? sched.titleJa || sched.title
													: sched.titleEn || sched.title}
											</h1>
											{displayRoom && (
												<p className="lg:text-[12px] text-[8px] font-medium opacity-80 truncate">
													{displayRoom}
												</p>
											)}
										</div>
									</div>
								</div>
							);
						})}

					{/* クリック判定用スロット: 次のコマの開始時間まで広げて描画 (z-10) */}
					{PERIODS.map((p, index) => {
						const pStartMin = timeToMin(p.start);
						const pEndMin = timeToMin(p.end);
						const nextP = PERIODS[index + 1];
						// 次のコマがあればその開始時刻まで、なければ自分の終了時刻まで
						const visualEndMin = nextP ? timeToMin(nextP.start) : pEndMin;
						return (
							<button
								type="button"
								key={`slot-${p.label}`}
								className={
									"absolute w-full z-10 cursor-pointer pointer-events-auto"
								}
								style={{
									top: getTop(pStartMin),
									height: getHeight(visualEndMin - pStartMin),
								}}
								onClick={() => handleSlotClick(day, p)}
							/>
						);
					})}
				</div>
			))}
		</div>
	);
};
export default TimetableGrid;

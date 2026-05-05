import {
	Eye,
	EyeOff,
	Pencil,
	SquareArrowOutUpRight,
	StickyNote,
	Trash2,
} from "lucide-react";
import { SWATCHES } from "@/constants/config.ts";
import type { UserCourseWithDetails } from "@/db/schema";
import { getSyllabusUrl } from "@/lib/course/utils.ts";
import { useTranslation } from "@/lib/translation/context.tsx";

// --- 授業の詳細: メモ, シラバス，表示非表示，削除 ---
const CourseDetailContent = ({
	course,
	toggleVisibility,
	handleToggle,
	updateColor,
	updateMemo,
	isSubmitting,
}: {
	course: UserCourseWithDetails;
	handleToggle: (c: UserCourseWithDetails) => void;
	toggleVisibility: (course: UserCourseWithDetails) => void;
	updateMemo: (course: UserCourseWithDetails, memo: string) => void;
	updateColor: (course: UserCourseWithDetails, color: string | null) => void;
	isSubmitting: number | string | null;
}) => {
	const { t, l } = useTranslation();
	const cId = course.id;
	const isCustom = typeof course.id === "string";

	return (
		<div className="flex flex-col gap-4 py-2">
			{/* カラー選択セクション */}
			<div className="grid grid-cols-7 gap-2 w-full">
				{/* リセットボタン */}
				<button
					type="button"
					onClick={() => updateColor(course, null)}
					className={`w-full h-8 aspect-square rounded border border-black/5 active:scale-95 bg-primary 
                               ${course.colorCustom == null ? "ring-2 ring-primary ring-offset-2" : ""}`}
				/>

				{/* スウォッチ一覧 */}
				{SWATCHES.map((hex) => (
					<button
						key={hex}
						type="button"
						onClick={() => updateColor(course, hex)}
						className={`w-full h-8 aspect-square rounded border border-black/5 active:scale-95
                                    ${course.colorCustom === hex ? "ring-2 ring-primary ring-offset-2" : ""}`}
						style={{ backgroundColor: hex }}
					/>
				))}
			</div>

			{/* メモ */}
			<div className="form-control w-full">
				<label htmlFor="memo-textarea" className="label pt-0">
					<span className="label-text flex items-center gap-2 font-bold opacity-70">
						<StickyNote size="14" /> {t("timetable.memo")}
					</span>
				</label>
				<textarea
					id="memo-textarea"
					className="textarea textarea-bordered w-full h-24 text-base focus:textarea-primary"
					placeholder={
						isCustom
							? t("timetable.memo.content")
							: `${t("timetable.memo.content")}\n${t("timetable.memo.location")}`
					}
					defaultValue={course.memo || ""}
					onBlur={(e) => updateMemo(course, e.target.value)} // フォーカスが外れた時に保存
				></textarea>
			</div>

			{/* メインアクション */}
			<div className="grid grid-cols-4 gap-2">
				{/* シラバス/編集 (2/4 を占有) */}
				{!isCustom && "rgNo" in course && course.rgNo ? (
					<a
						href={getSyllabusUrl(course.rgNo, course.year, course.term)}
						target="_blank"
						rel="noreferrer"
						className="btn btn-md normal-case flex gap-2 col-span-2 border-base-300"
						title={t("timetable.syllabus")}
					>
						<SquareArrowOutUpRight size="16" />
						<span className="truncate">{t("timetable.syllabus")}</span>
					</a>
				) : (
					<a
						href={l(`/edit/${course.id}`)}
						className="btn btn-md normal-case flex gap-2 col-span-2 border-base-300"
					>
						<Pencil size={16} />
						{t("timetable.edit")}
					</a>
				)}

				{/* 表示/非表示 (1/4 を占有) */}
				<button
					type="button"
					onClick={() => toggleVisibility(course)}
					className={`btn btn-md gap-2 col-span-1 ${!course.isVisible ? "btn-ghost border-base-300    " : "btn-neutral"}`}
				>
					{course.isVisible ? <Eye size="18" /> : <EyeOff size="18" />}
				</button>

				{/* 削除 (1/4 を占有) */}
				<button
					type="button"
					onClick={() => handleToggle(course)}
					disabled={isSubmitting === cId}
					className="btn btn-md btn-error col-span-1 gap-2"
				>
					{isSubmitting === cId ? (
						<span className="loading loading-spinner loading-xs" />
					) : (
						<Trash2 size="18" />
					)}
				</button>
			</div>
		</div>
	);
};
export default CourseDetailContent;

import { Eye, EyeOff, Trash2 } from "lucide-react";
import CourseHeader from "@/components/common/CourseHeader.tsx";
import type { UserCourseWithDetails } from "@/db/schema";
import { useTranslation } from "@/lib/translation/context.tsx";

interface CourseListProps {
	items: UserCourseWithDetails[];
	padding?: boolean;
	isJa: boolean;
	setSelectedCourse: (course: UserCourseWithDetails | null) => void;
	toggleVisibility: (course: UserCourseWithDetails) => void;
	handleToggle: (course: UserCourseWithDetails) => void;
	isSubmitting: number | string | null;
}

const CourseList = ({
	items,
	padding = true,
	setSelectedCourse,
	toggleVisibility,
	handleToggle,
	isSubmitting,
}: CourseListProps) => {
	const { t } = useTranslation();

	// コース選択時 (CourseListなどで)
	const handleCourseSelect = (course: UserCourseWithDetails | null) => {
		setSelectedCourse(course);

		// URLを更新 (?courseId=xxx)
		const url = new URL(window.location.href);
		if (course) {
			url.searchParams.set("courseId", String(course.id));
		} else {
			url.searchParams.delete("courseId");
		}
		window.history.pushState({}, "", url.pathname + url.search);

		// モーダルを開く (HTML Dialog APIを使う場合)
		if (course) {
			(
				document.getElementById("single_course_modal") as HTMLDialogElement
			)?.showModal();
		}
	};
	return (
		<div className={`flex flex-col gap-2 w-full ${padding ? "p-2" : ""}`}>
			{items.map((course) => {
				return (
					<div
						key={course.id}
						className={`group p-3 bg-base-200 rounded-xl flex justify-between items-center border border-base-300 ${!course.isVisible ? "opacity-60" : ""}`}
					>
						{/* 左側：クリックで詳細モーダルへ */}
						<button
							type="button"
							className="flex-1 min-w-0 cursor-pointer"
							onClick={() => handleCourseSelect(course)}
						>
							<CourseHeader
								course={course}
								showColor={true}
								colorCustom={course.colorCustom}
							/>
						</button>

						{/* 右側：最小限のクイック操作のみ残す */}
						<nav className="flex gap-1 shrink-0 ml-2">
							<button
								type="button"
								onClick={() => toggleVisibility(course)}
								className="btn btn-sm btn-square btn-ghost border-base-300"
							>
								{course.isVisible ? (
									<Eye size="14" />
								) : (
									<EyeOff size="14" className="text-error" />
								)}
							</button>
							<button
								type="button"
								onClick={() => handleToggle(course)}
								disabled={isSubmitting === course.id}
								className="btn btn-sm btn-square btn-error"
							>
								{isSubmitting === course.id ? (
									<span className="loading loading-spinner loading-xs" />
								) : (
									<Trash2 size="14" />
								)}
							</button>
						</nav>
					</div>
				);
			})}

			{items.length === 0 && (
				<div className="text-center py-10 opacity-50 text-sm">
					{t("timetable.no_courses")}
				</div>
			)}
		</div>
	);
};
export default CourseList;

import { type InferSelectModel, relations, sql } from "drizzle-orm";
import {
	index,
	integer,
	primaryKey,
	real,
	sqliteTable,
	text,
	uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { SELECTABLE_DAYS, SELECTABLE_TERMS } from "@/constants/time.ts";
import * as authSchema from "@/db/schema/auth.ts";
import { user } from "@/db/schema/auth.ts";

export * from "./auth.ts";

// --- Courses ---
// シラバスデータなどの基本情報を保持
export const courses = sqliteTable(
	"courses",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		year: integer("year").notNull(),
		rgNo: text("rg_no").notNull(),
		status: text("status", { enum: ["active", "cancelled"] }).default("active"),
		term: text("term", { enum: SELECTABLE_TERMS }).notNull(),
		courseCode: text("course_code").notNull(), // 例: GES001
		titleJa: text("title_ja").notNull(),
		titleEn: text("title_en").notNull(),
		instructor: text("instructor").notNull(),
		room: text("room"),
		language: text("language"),

		// 1/3単位を 0.333... として保持するため real型 を使用
		units: real("units").notNull().default(0),

		updatedAt: integer("updated_at").default(sql`(unixepoch()
                                                     )`),
	},
	(table) => [
		uniqueIndex("year_rgno_unique_idx").on(table.year, table.rgNo),
		index("courses_search_optimal_idx").on(
			table.year,
			table.term,
			table.status,
			table.courseCode,
			table.id,
		),
		index("year_term_status_lang_idx").on(
			table.year,
			table.term,
			table.status,
			table.language,
			table.id,
		),
		index("year_term_status_units_idx").on(
			table.year,
			table.term,
			table.status,
			table.units,
			table.id,
		),
		index("course_no_idx").on(table.courseCode),
	],
);

// --- 2. 統合スケジュール (絶対時間ベース) ---
export const courseSchedules = sqliteTable(
	"course_schedules",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		courseId: integer("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		dayOfWeek: text("day_of_week", { enum: SELECTABLE_DAYS }).notNull(),
		startTime: text("start_time").notNull(),
		endTime: text("end_time").notNull(),
		period: integer("period"),
		isLong: integer("is_long", { mode: "boolean" }).default(false),

		// --- 理系の演習授業の選択肢 ---
		// true の場合、< > で囲まれた選択科目のコマであることを示す
		isAlternative: integer("is_alternative", { mode: "boolean" }).default(
			false,
		),
		// 同じ数字(1, 2...)を持つコマ同士が「一つの選択肢グループ」であることを示す
		// 例: 6/M,7/M が "group 1"、6/W,7/W が "group 2"
		altGroupId: integer("alt_group_id"),
	},
	(table) => [
		index("course_id_idx").on(table.courseId),
		index("day_period_idx").on(table.dayOfWeek, table.period),
		index("search_schedule_idx").on(
			table.dayOfWeek,
			table.period,
			table.courseId,
		),
	],
);

// --- 3. ユーザーの履修登録状況 ---
// ICUの科目のみ.
export const userCourses = sqliteTable(
	"user_courses",
	{
		id: integer("id").primaryKey({ autoIncrement: true }),
		userId: text("user_id")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		courseId: integer("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),

		// 時間割上での表示・非表示を切り替えるフラグ
		isVisible: integer("is_visible", { mode: "boolean" })
			.notNull()
			.default(true),

		// 理系科目などの「グループ選択」が必要な場合、どのグループを選んだかを保持
		// 例: altGroupId = 1 のコマ群を表示する場合、ここに 1 を入れる
		selectedAltGroupId: integer("selected_alt_group_id"),
		colorCustom: text("color_custom"),
		memo: text("memo"),

		createdAt: integer("created_at").default(sql`(unixepoch()
                                                     )`),
	},
	(table) => [
		index("user_courses_uid_idx").on(table.userId),
		uniqueIndex("user_course_unique_idx").on(table.userId, table.courseId),
	],
);

// --- カスタム科目 (他校・手打ち) ---
// customCoursesは, userIdのユーザの持ち物
// カスタムコース本体（メタ情報のみ）
export const customCourses = sqliteTable("custom_courses", {
	// idは/editページでユーザに見えるため，連番ではなくランダムな値に
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	userId: text("user_id")
		.notNull()
		.references(() => user.id, { onDelete: "cascade" }),

	title: text("title").notNull(),
	instructor: text("instructor"),
	room: text("room"),
	units: real("units").notNull().default(0),

	year: integer("year").notNull(),
	term: text("term", { enum: SELECTABLE_TERMS }).notNull(),

	isVisible: integer("is_visible", { mode: "boolean" }).notNull().default(true),
	colorCustom: text("color_custom"),
	memo: text("memo"),

	createdAt: integer("created_at").default(sql`(unixepoch())`),
});

// カスタムコースのスケジュール（1コースに対して複数レコード可）
export const customCourseSchedules = sqliteTable("custom_course_schedules", {
	id: integer("id").primaryKey({ autoIncrement: true }),
	customCourseId: text("custom_course_id")
		.notNull()
		.references(() => customCourses.id, { onDelete: "cascade" }), // 親が消えたら消える

	dayOfWeek: text("day_of_week", { enum: SELECTABLE_DAYS }).notNull(),
	period: text("period"), // "昼" などが入る可能性を考慮して text
	startTime: text("start_time").notNull(),
	endTime: text("end_time").notNull(),
});

// --- Categories & Tags ---
export const categories = sqliteTable("categories", {
	id: text("id").primaryKey(), // 'MBIO', 'ELA' など
	nameJa: text("name_ja").notNull(),
	nameEn: text("name_en").notNull(),
});

export const courseToCategories = sqliteTable(
	"course_to_categories",
	{
		courseId: integer("course_id")
			.notNull()
			.references(() => courses.id, { onDelete: "cascade" }),
		categoryId: text("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "cascade" }),
	},
	(table) => [
		primaryKey({ columns: [table.courseId, table.categoryId] }),
		index("category_id_idx").on(table.categoryId),
		index("category_search_idx").on(table.categoryId, table.courseId),
	],
);
// --- User側からのリレーション ---
// 1人のユーザーは「複数の履修登録(公式)」と「複数のカスタム科目」を持つ
// Authのuserとのrelationもここでまとめる
export const userRelations = relations(user, ({ many }) => ({
	sessions: many(authSchema.session),
	accounts: many(authSchema.account),
	userCourses: many(userCourses),
	customCourses: many(customCourses),
}));

// --- userCourses (公式履修) のリレーション ---
export const userCoursesRelations = relations(userCourses, ({ one }) => ({
	user: one(user, { fields: [userCourses.userId], references: [user.id] }),
	course: one(courses, {
		fields: [userCourses.courseId],
		references: [courses.id],
	}),
}));

// --- customCourses (カスタム科目) のリレーション ---
export const customCoursesRelations = relations(
	customCourses,
	({ one, many }) => ({
		user: one(user, { fields: [customCourses.userId], references: [user.id] }),
		schedules: many(customCourseSchedules), // 1対多のリレーション
	}),
);

export const customCourseSchedulesRelations = relations(
	customCourseSchedules,
	({ one }) => ({
		course: one(customCourses, {
			fields: [customCourseSchedules.customCourseId],
			references: [customCourses.id],
		}),
	}),
);

// --- courses (公式マスタ) とスケジュールのリレーション ---
export const courseRelations = relations(courses, ({ many }) => ({
	schedules: many(courseSchedules),
}));

export const courseSchedulesRelations = relations(
	courseSchedules,
	({ one }) => ({
		course: one(courses, {
			fields: [courseSchedules.courseId],
			references: [courses.id],
		}),
	}),
);

// --- Types ---
// --- Base Types (DBから直接抽出) ---
export type Course = InferSelectModel<typeof courses>;
export type Schedule = InferSelectModel<typeof courseSchedules>;
export type UserCourse = InferSelectModel<typeof userCourses>;

// カスタム科目のベース型
export type CustomCourse = InferSelectModel<typeof customCourses>;
export type CustomSchedule = InferSelectModel<typeof customCourseSchedules>;

// --- Helper: メタデータ部分だけを抽出 ---
// userId や createdAt などの不要なカラムを除いた「ユーザー設定」のみの型
export type UserCourseMetadata = Pick<
	UserCourse,
	"isVisible" | "selectedAltGroupId" | "colorCustom" | "memo"
>;

// --- Final Types ---
// 公式コース + ユーザーのカスタム設定 (isVisible, colorCustom など)
export type OfficialCourseWithDetails = Course &
	UserCourseMetadata & {
		schedules: Schedule[];
		type: "official";
	};

// カスタムコース (これ自体に isVisible や colorCustom が含まれているのでリレーションのみ)
export type CustomCourseWithDetails = CustomCourse & {
	schedules: CustomSchedule[];
	type: "custom";
};

export type UserCourseWithDetails =
	| OfficialCourseWithDetails
	| CustomCourseWithDetails;

export type Categories = InferSelectModel<typeof categories>;

export type FlatSchedule = (Schedule | CustomSchedule) &
	Partial<Course> &
	Partial<CustomCourse> &
	Partial<UserCourseMetadata> & {
		id: string | number;
		scheduleId: string | number;
		type: "official" | "custom";
	};

export type DisplaySchedule = FlatSchedule & {
	startMin: number;
	endMin: number;
	col: number;
	groupMaxCols: number;
	type: "official" | "custom";
};

// 利便性のための「共通アクセス用」型（EditorのFormなどで使用）
export interface CourseFormInput {
	id?: number | string;
	courseId?: number | string; // hookから送られてくる別名
	title: string;
	instructor?: string | null;
	room?: string | null;
	units: number;
	memo?: string | null;
	colorCustom?: string | null;
	year: number;
	term: (typeof SELECTABLE_TERMS)[number];
	isVisible?: boolean;
	schedules: {
		id?: number | string;
		dayOfWeek: (typeof SELECTABLE_DAYS)[number];
		period: string;
		startTime: string;
		endTime: string;
	}[];
}

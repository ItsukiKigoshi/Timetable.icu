CREATE TABLE `custom_course_schedules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`custom_course_id` integer NOT NULL,
	`day_of_week` text NOT NULL,
	`period` text,
	`start_time` text NOT NULL,
	`end_time` text NOT NULL,
	FOREIGN KEY (`custom_course_id`) REFERENCES `custom_courses`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_course_to_categories` (
	`course_id` integer NOT NULL,
	`category_id` text NOT NULL,
	PRIMARY KEY(`course_id`, `category_id`),
	FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_course_to_categories`("course_id", "category_id") SELECT "course_id", "category_id" FROM `course_to_categories`;--> statement-breakpoint
DROP TABLE `course_to_categories`;--> statement-breakpoint
ALTER TABLE `__new_course_to_categories` RENAME TO `course_to_categories`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `category_id_idx` ON `course_to_categories` (`category_id`);--> statement-breakpoint
CREATE INDEX `category_search_idx` ON `course_to_categories` (`category_id`,`course_id`);--> statement-breakpoint
CREATE TABLE `__new_custom_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`title` text NOT NULL,
	`instructor` text,
	`room` text,
	`units` real DEFAULT 0 NOT NULL,
	`year` integer NOT NULL,
	`term` text NOT NULL,
	`is_visible` integer DEFAULT true NOT NULL,
	`color_custom` text,
	`memo` text,
	`created_at` integer DEFAULT (unixepoch()),
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_custom_courses`("id", "user_id", "title", "instructor", "room", "units", "year", "term", "is_visible", "color_custom", "memo", "created_at") SELECT "id", "user_id", "title", "instructor", "room", "units", "year", "term", "is_visible", "color_custom", "memo", "created_at" FROM `custom_courses`;--> statement-breakpoint
DROP TABLE `custom_courses`;--> statement-breakpoint
ALTER TABLE `__new_custom_courses` RENAME TO `custom_courses`;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `__new_verification` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
INSERT INTO `__new_verification`("id", "identifier", "value", "expires_at", "created_at", "updated_at") SELECT "id", "identifier", "value", "expires_at", "created_at", "updated_at" FROM `verification`;--> statement-breakpoint
DROP TABLE `verification`;--> statement-breakpoint
ALTER TABLE `__new_verification` RENAME TO `verification`;--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);
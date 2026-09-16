CREATE TABLE `incidents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_ja` text NOT NULL,
	`title_en` text NOT NULL,
	`detail_ja` text,
	`detail_en` text,
	`status` text DEFAULT 'investigating' NOT NULL,
	`severity` text DEFAULT 'warning' NOT NULL,
	`started_at` integer NOT NULL,
	`ended_at` integer,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `incidents_status_idx` ON `incidents` (`status`);--> statement-breakpoint
CREATE INDEX `incidents_started_idx` ON `incidents` (`started_at`);--> statement-breakpoint
CREATE TABLE `updates` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title_ja` text NOT NULL,
	`title_en` text NOT NULL,
	`detail_ja` text,
	`detail_en` text,
	`category` text DEFAULT 'feature' NOT NULL,
	`published_at` integer NOT NULL,
	`created_at` integer DEFAULT (unixepoch())
);
--> statement-breakpoint
CREATE INDEX `updates_published_idx` ON `updates` (`published_at`);
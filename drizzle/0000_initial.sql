CREATE TABLE `attribute` (
	`key` text NOT NULL,
	`type` text NOT NULL,
	PRIMARY KEY(`key`, `type`)
);
--> statement-breakpoint
CREATE TABLE `known_value` (
	`key` text NOT NULL,
	`value` text NOT NULL,
	PRIMARY KEY(`key`, `value`)
);
--> statement-breakpoint
CREATE TABLE `row` (
	`id` text PRIMARY KEY NOT NULL,
	`parent` text,
	`breadcrumb` text DEFAULT '[]',
	`children_count` integer DEFAULT 0 NOT NULL,
	`type` text,
	`subtype` text,
	`timestamp` text,
	`json` text
);

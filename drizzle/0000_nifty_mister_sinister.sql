CREATE TABLE `inspections` (
	`id` text PRIMARY KEY NOT NULL,
	`date` text NOT NULL,
	`issue` text NOT NULL,
	`cause` text NOT NULL,
	`solution` text NOT NULL,
	`assignee` text NOT NULL,
	`resolved` integer DEFAULT 0 NOT NULL,
	`notes` text NOT NULL,
	`photo` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL
);

CREATE TABLE `ppt_reports` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`report` text,
	`create_time` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

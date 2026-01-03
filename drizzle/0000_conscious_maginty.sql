CREATE TABLE `group_whatsapp` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text(100) NOT NULL,
	`owner_phone` text NOT NULL,
	`admin` text,
	`member` text,
	`created_at` text DEFAULT '2026-01-03T22:54:54.191Z' NOT NULL,
	`settings` text DEFAULT '{"welcome":true,"tagall":"admin","welcomeMessage":"Selamat datang di grup {name}!, semoga betah","sholatreminder":false}'
);
--> statement-breakpoint
CREATE TABLE `subscription` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`plan` text(50) NOT NULL,
	`status` text(20) NOT NULL,
	`expires_at` text,
	`created_at` text DEFAULT '2026-01-03T22:54:54.192Z',
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text(100) NOT NULL,
	`no` text(20) NOT NULL,
	`email` text(100),
	`note` text,
	`created_at` text DEFAULT '2026-01-03T22:54:54.192Z' NOT NULL,
	`updated_at` text DEFAULT '2026-01-03T22:54:54.192Z' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);
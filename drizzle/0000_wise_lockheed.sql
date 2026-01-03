CREATE TABLE "group" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"type" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "group_whatsapp" (
	"id" uuid PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"owner" varchar(15) NOT NULL,
	"admin" varchar(15)[],
	"member" varchar(15)[],
	"no" varchar(15) NOT NULL,
	"email" varchar(100),
	"created_at" date DEFAULT now(),
	"setings" jsonb,
	CONSTRAINT "group_whatsapp_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "note_group" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"note" text,
	"updated_at" date,
	"group_id" varchar(50)
);
--> statement-breakpoint
CREATE TABLE "participant_group" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"no" varchar(15),
	"role" varchar(15),
	"sum_message" smallint DEFAULT 0,
	"country" varchar(50),
	"group_id" varchar(50),
	"month" date
);
--> statement-breakpoint
CREATE TABLE "status" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"label" varchar(50) DEFAULT 'basic',
	"start_date" date DEFAULT now(),
	"end_date" date
);
--> statement-breakpoint
CREATE TABLE "tugas_group" (
	"id" varchar(50) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"due_date" date,
	"group_id" varchar(50),
	"created_at" date
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" uuid PRIMARY KEY NOT NULL,
	"status" varchar(50),
	"group_id" varchar(50),
	"name" varchar(100) NOT NULL,
	"no" varchar(15) NOT NULL,
	"email" varchar(100),
	"created_at" date DEFAULT now(),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "note_group" ADD CONSTRAINT "note_group_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "participant_group" ADD CONSTRAINT "participant_group_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tugas_group" ADD CONSTRAINT "tugas_group_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_status_status_id_fk" FOREIGN KEY ("status") REFERENCES "public"."status"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_group_id_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group"("id") ON DELETE no action ON UPDATE no action;
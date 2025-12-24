CREATE TABLE "ppt_quarter" (
	"id" serial PRIMARY KEY NOT NULL,
	"quarter_id" varchar(255) NOT NULL,
	CONSTRAINT "ppt_quarter_quarter_id_unique" UNIQUE("quarter_id")
);
--> statement-breakpoint
CREATE TABLE "ppt_reports" (
	"id" serial PRIMARY KEY NOT NULL,
	"report" text,
	"quarter_id" integer,
	"create_time" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ppt_reports" ADD CONSTRAINT "ppt_reports_quarter_id_ppt_quarter_id_fk" FOREIGN KEY ("quarter_id") REFERENCES "public"."ppt_quarter"("id") ON DELETE no action ON UPDATE no action;
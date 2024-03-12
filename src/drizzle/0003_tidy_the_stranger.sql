CREATE TABLE IF NOT EXISTS "fa_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"bank" numeric,
	"black" numeric,
	"cash" numeric
);
--> statement-breakpoint
ALTER TABLE "team_notes" ALTER COLUMN "noterId" SET DATA TYPE integer;
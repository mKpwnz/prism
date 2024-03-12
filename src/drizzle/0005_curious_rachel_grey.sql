CREATE TABLE IF NOT EXISTS "fa_scans" (
	"id" serial PRIMARY KEY NOT NULL,
	"created_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "fa_users" ADD COLUMN "scanid" serial NOT NULL;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fa_users" ADD CONSTRAINT "fa_users_scanid_fa_scans_id_fk" FOREIGN KEY ("scanid") REFERENCES "fa_scans"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

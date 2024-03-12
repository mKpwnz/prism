CREATE TABLE IF NOT EXISTS "fa_vehicles" (
	"id" serial PRIMARY KEY NOT NULL,
	"scanid" serial NOT NULL,
	"owner" text NOT NULL,
	"plate" text NOT NULL,
	"green" numeric,
	"black" numeric,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fa_vehicles" ADD CONSTRAINT "fa_vehicles_scanid_fa_scans_id_fk" FOREIGN KEY ("scanid") REFERENCES "fa_scans"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

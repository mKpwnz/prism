CREATE TABLE IF NOT EXISTS "fa_result" (
	"id" serial PRIMARY KEY NOT NULL,
	"scanid" serial NOT NULL,
	"identifier" text NOT NULL,
	"bank" numeric,
	"black" numeric,
	"cash" numeric,
	"vehicle_green" numeric,
	"vehicle_black" numeric,
	"housing_green" numeric,
	"immobay_green" numeric,
	"created_at" timestamp (3) DEFAULT now() NOT NULL,
	"updated_at" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fa_result" ADD CONSTRAINT "fa_result_scanid_fa_scans_id_fk" FOREIGN KEY ("scanid") REFERENCES "fa_scans"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

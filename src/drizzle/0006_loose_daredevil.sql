ALTER TABLE "fa_users" DROP CONSTRAINT "fa_users_scanid_fa_scans_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "fa_users" ADD CONSTRAINT "fa_users_scanid_fa_scans_id_fk" FOREIGN KEY ("scanid") REFERENCES "fa_scans"("id") ON DELETE cascade ON UPDATE cascade;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

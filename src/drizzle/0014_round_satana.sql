ALTER TABLE "fa_result" ADD COLUMN "usergroup" text DEFAULT 'user';--> statement-breakpoint
ALTER TABLE "fa_users" ADD COLUMN "usergroup" text DEFAULT 'user';
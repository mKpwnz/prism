ALTER TABLE "fa_users" ADD COLUMN "created_at" timestamp (3) DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "fa_users" ADD COLUMN "updated_at" timestamp (3) DEFAULT now() NOT NULL;
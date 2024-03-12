ALTER TABLE "society_finance"
ALTER COLUMN "created_at"
SET DEFAULT now ();

--> statement-breakpoint
ALTER TABLE "society_finance"
ALTER COLUMN "updated_at"
SET DEFAULT now ();

--> statement-breakpoint
ALTER TABLE "player_count"
ALTER COLUMN "created_at"
SET DEFAULT now ();

--> statement-breakpoint
ALTER TABLE "player_count"
ALTER COLUMN "updated_at"
SET DEFAULT now ();

--> statement-breakpoint
ALTER TABLE "team_notes"
ALTER COLUMN "created_at"
SET DEFAULT now ();

--> statement-breakpoint
ALTER TABLE "team_notes"
ALTER COLUMN "updated_at"
SET DEFAULT now ();

--> statement-breakpoint
ALTER TABLE "command_log"
ALTER COLUMN "created_at"
SET DEFAULT now ();

--> statement-breakpoint
ALTER TABLE "command_log"
ALTER COLUMN "updated_at"
SET DEFAULT now ();
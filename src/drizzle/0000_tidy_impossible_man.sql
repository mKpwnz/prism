-- Current sql file was generated after introspecting the database
-- If you want to run this migration please uncomment this code before executing migrations
CREATE TABLE
	IF NOT EXISTS "society_finance" (
		"id" serial PRIMARY KEY NOT NULL,
		"job" text NOT NULL,
		"label" text NOT NULL,
		"bank" numeric NOT NULL,
		"money" numeric NOT NULL,
		"black" numeric NOT NULL,
		"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
		"updated_at" timestamp(3) NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	IF NOT EXISTS "player_count" (
		"id" serial PRIMARY KEY NOT NULL,
		"count" integer NOT NULL,
		"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
		"updated_at" timestamp(3) NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	IF NOT EXISTS "team_notes" (
		"id" serial PRIMARY KEY NOT NULL,
		"user" text NOT NULL,
		"noterId" numeric NOT NULL,
		"noterName" text NOT NULL,
		"note" text NOT NULL,
		"display" boolean DEFAULT true NOT NULL,
		"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
		"updated_at" timestamp(3) NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	IF NOT EXISTS "command_log" (
		"id" serial PRIMARY KEY NOT NULL,
		"user" numeric NOT NULL,
		"command" text NOT NULL,
		"channel" text NOT NULL,
		"options" json,
		"jsonData" jsonb NOT NULL,
		"created_at" timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
		"updated_at" timestamp(3) NOT NULL
	);
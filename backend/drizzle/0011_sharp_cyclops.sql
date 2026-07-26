ALTER TABLE "users" ADD COLUMN "allowed_integrations" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "has_analytics" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "allow_team_members" boolean DEFAULT false NOT NULL;
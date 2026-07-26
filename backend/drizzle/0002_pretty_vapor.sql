ALTER TABLE "organization_members" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "website" varchar(500);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_public" boolean DEFAULT true NOT NULL;
CREATE TABLE IF NOT EXISTS "bluesky_connections" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"bluesky_did" varchar(255) NOT NULL,
	"bluesky_handle" varchar(255) NOT NULL,
	"session" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "bluesky_connections" ADD CONSTRAINT "bluesky_connections_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

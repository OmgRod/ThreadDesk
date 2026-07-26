CREATE TABLE IF NOT EXISTS "user_smtp_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"host" varchar(255) NOT NULL,
	"port" integer NOT NULL,
	"user" varchar(255) NOT NULL,
	"password" text NOT NULL,
	"secure" boolean DEFAULT true NOT NULL,
	"from" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "user_smtp_configs" ADD CONSTRAINT "user_smtp_configs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

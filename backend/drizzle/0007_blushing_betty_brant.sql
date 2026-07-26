CREATE TABLE IF NOT EXISTS "post_publications" (
	"id" serial PRIMARY KEY NOT NULL,
	"post_id" integer NOT NULL,
	"platform" varchar(50) NOT NULL,
	"published_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "post_publications" ADD CONSTRAINT "post_publications_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

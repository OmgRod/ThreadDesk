ALTER TABLE "users" RENAME COLUMN "max_messages_per_month" TO "max_posts_per_month";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "messages_sent_this_month" TO "posts_sent_this_month";--> statement-breakpoint
ALTER TABLE "users" RENAME COLUMN "last_message_reset" TO "last_post_reset";
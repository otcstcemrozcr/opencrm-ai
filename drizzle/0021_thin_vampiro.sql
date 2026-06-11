ALTER TABLE "organizations" ADD COLUMN "telegram_chat_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "notifications_enabled" boolean DEFAULT true NOT NULL;
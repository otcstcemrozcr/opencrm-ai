CREATE TYPE "public"."telegram_direction" AS ENUM('in', 'out');--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_connect_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"token" text NOT NULL,
	"contact_id" uuid,
	"lead_id" uuid,
	"created_by_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"chat_id" text NOT NULL,
	"username" text,
	"first_name" text,
	"last_name" text,
	"linked_contact_id" uuid,
	"linked_lead_id" uuid,
	"last_message_at" timestamp with time zone,
	"last_message_preview" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "telegram_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"org_id" uuid NOT NULL,
	"conversation_id" uuid NOT NULL,
	"direction" "telegram_direction" NOT NULL,
	"text" text,
	"telegram_message_id" text,
	"sender_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_connect_tokens" ADD CONSTRAINT "telegram_connect_tokens_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_connect_tokens" ADD CONSTRAINT "telegram_connect_tokens_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_connect_tokens" ADD CONSTRAINT "telegram_connect_tokens_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_connect_tokens" ADD CONSTRAINT "telegram_connect_tokens_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_conversations" ADD CONSTRAINT "telegram_conversations_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_conversations" ADD CONSTRAINT "telegram_conversations_linked_contact_id_contacts_id_fk" FOREIGN KEY ("linked_contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_conversations" ADD CONSTRAINT "telegram_conversations_linked_lead_id_leads_id_fk" FOREIGN KEY ("linked_lead_id") REFERENCES "public"."leads"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_messages" ADD CONSTRAINT "telegram_messages_org_id_organizations_id_fk" FOREIGN KEY ("org_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_messages" ADD CONSTRAINT "telegram_messages_conversation_id_telegram_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."telegram_conversations"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "telegram_messages" ADD CONSTRAINT "telegram_messages_sender_user_id_users_id_fk" FOREIGN KEY ("sender_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_connect_tokens_token_unique" ON "telegram_connect_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_connect_tokens_org_idx" ON "telegram_connect_tokens" USING btree ("org_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "telegram_conversations_chat_unique" ON "telegram_conversations" USING btree ("org_id","chat_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_conversations_recent_idx" ON "telegram_conversations" USING btree ("org_id","last_message_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "telegram_messages_conv_idx" ON "telegram_messages" USING btree ("conversation_id","created_at");
CREATE TYPE "public"."account_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."forecast_category" AS ENUM('pipeline', 'best_case', 'commit', 'omitted');--> statement-breakpoint
CREATE TYPE "public"."rating" AS ENUM('hot', 'warm', 'cold');--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "payment_terms" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "credit_limit" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "status" "account_status" DEFAULT 'active' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "rating" "rating";--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "parent_account_id" uuid;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "accounts" ADD CONSTRAINT "accounts_parent_account_id_accounts_id_fk" FOREIGN KEY ("parent_account_id") REFERENCES "public"."accounts"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

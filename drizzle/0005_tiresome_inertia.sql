CREATE TYPE "public"."account_type" AS ENUM('prospect', 'customer', 'partner', 'other');--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "type" "account_type" DEFAULT 'prospect' NOT NULL;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "employees" integer;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "annual_revenue" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "address_line" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "city" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "country" text;--> statement-breakpoint
ALTER TABLE "accounts" ADD COLUMN "description" text;
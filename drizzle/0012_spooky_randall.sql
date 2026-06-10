ALTER TABLE "leads" ADD COLUMN "rating" "rating";--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "estimated_value" numeric(14, 2);--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_source" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_medium" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "utm_campaign" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "do_not_contact" boolean DEFAULT false NOT NULL;
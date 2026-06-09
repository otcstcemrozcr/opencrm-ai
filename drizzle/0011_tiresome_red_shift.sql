ALTER TABLE "contacts" ADD COLUMN "salutation" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "secondary_email" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "mobile" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "department" text;--> statement-breakpoint
ALTER TABLE "contacts" ADD COLUMN "do_not_contact" boolean DEFAULT false NOT NULL;
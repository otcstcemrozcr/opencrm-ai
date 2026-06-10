ALTER TABLE "opportunities" ADD COLUMN "next_step" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "loss_reason" text;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "forecast_category" "forecast_category" DEFAULT 'pipeline' NOT NULL;--> statement-breakpoint
ALTER TABLE "opportunities" ADD COLUMN "currency" text DEFAULT 'USD' NOT NULL;
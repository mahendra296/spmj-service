ALTER TABLE "donations" ALTER COLUMN "amount" SET DATA TYPE numeric(12, 2);--> statement-breakpoint
-- Existing rows were stored in paise; convert them to rupees so the new
-- decimal column holds the same real-world amount as before.
UPDATE "donations" SET "amount" = "amount" / 100;
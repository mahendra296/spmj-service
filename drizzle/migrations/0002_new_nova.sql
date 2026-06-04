CREATE TYPE "public"."payment_status" AS ENUM('created', 'paid', 'failed', 'refunded');--> statement-breakpoint
CREATE TABLE "donations" (
	"id" serial PRIMARY KEY NOT NULL,
	"receipt" varchar(40) NOT NULL,
	"donor_name" varchar(255) NOT NULL,
	"donor_email" varchar(255) NOT NULL,
	"donor_phone" varchar(20),
	"message" varchar(500),
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"status" "payment_status" DEFAULT 'created' NOT NULL,
	"razorpay_order_id" varchar(255) NOT NULL,
	"razorpay_payment_id" varchar(255),
	"razorpay_signature" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "donations_receipt_unique" UNIQUE("receipt"),
	CONSTRAINT "donations_razorpay_order_id_unique" UNIQUE("razorpay_order_id")
);

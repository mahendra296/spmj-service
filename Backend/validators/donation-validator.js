import { z } from "zod";
import {
  DONATION_MIN_AMOUNT,
  DONATION_MAX_AMOUNT,
} from "../config/constant.js";

// The donor-facing form. `amount` is in rupees (major unit) — the controller
// converts to paise before talking to Razorpay.
export const donationSchema = z.object({
  donorName: z
    .string({ required_error: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(255, "Name is too long"),

  donorEmail: z
    .string({ required_error: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Please enter a valid email address")
    .max(255, "Email is too long"),

  donorPhone: z
    .string()
    .trim()
    .max(20, "Phone number is too long")
    .regex(/^[0-9+\-\s()]*$/, "Phone number is invalid")
    .optional()
    .or(z.literal("")),

  message: z
    .string()
    .trim()
    .max(500, "Message is too long")
    .optional()
    .or(z.literal("")),

  amount: z.coerce
    .number({ invalid_type_error: "Enter a valid amount" })
    .int("Amount must be a whole number of rupees")
    .min(DONATION_MIN_AMOUNT, `Minimum donation is ₹${DONATION_MIN_AMOUNT}`)
    .max(DONATION_MAX_AMOUNT, `Maximum donation is ₹${DONATION_MAX_AMOUNT}`),
});

export const validateDonation = (data) => donationSchema.safeParse(data);

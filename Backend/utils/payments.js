// Pure helpers for the donation flow: money conversion, receipt ids, and
// Razorpay signature verification. No DB or network here — easy to reason
// about and to test.

import crypto from "node:crypto";
import { PAISE_PER_RUPEE } from "../config/constant.js";

/** Rupees (major unit) → paise (integer, smallest unit Razorpay expects). */
export const rupeesToPaise = (rupees) => Math.round(Number(rupees) * PAISE_PER_RUPEE);

/** Paise → rupees (number). */
export const paiseToRupees = (paise) => Number(paise) / PAISE_PER_RUPEE;

/** Format paise as a localised INR string, e.g. 150000 → "₹1,500". */
export const formatPaiseINR = (paise, currency = "INR") => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(paiseToRupees(paise));
  } catch {
    return `₹${paiseToRupees(paise)}`;
  }
};

/**
 * A short, unique-enough receipt id (≤ 40 chars, Razorpay's limit). Caller
 * passes the entropy so this stays a pure function (no Date.now/random here).
 */
export const buildReceipt = (seed) => `don_${seed}`.slice(0, 40);

/** Constant-time string compare to avoid timing attacks on signatures. */
const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Verify the checkout callback signature.
 * Razorpay signs `${order_id}|${payment_id}` with HMAC-SHA256(key_secret).
 */
export const verifyPaymentSignature = ({ orderId, paymentId, signature, secret }) => {
  if (!orderId || !paymentId || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeEqual(expected, signature);
};

/**
 * Verify a webhook payload. Razorpay signs the *raw request body* with
 * HMAC-SHA256(webhook_secret) and sends it as the X-Razorpay-Signature header.
 * `rawBody` must be the exact bytes received (a Buffer or string).
 */
export const verifyWebhookSignature = ({ rawBody, signature, secret }) => {
  if (!rawBody || !signature || !secret) return false;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");
  return safeEqual(expected, signature);
};

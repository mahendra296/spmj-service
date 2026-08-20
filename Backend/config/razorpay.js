// Razorpay client + configuration helpers.
//
// Keys are optional in the environment so the app boots in any setup; the
// donation flow calls `isPaymentsConfigured()` and degrades gracefully (shows
// a notice, returns 503 from the API) when the keys are missing.

import Razorpay from "razorpay";
import { env } from "../validators/env.js";
import logger from "../utils/logger.js";

const keyId = env.RAZORPAY_KEY_ID;
const keySecret = env.RAZORPAY_KEY_SECRET;

/** True only when both the key id and secret are present. */
export const isPaymentsConfigured = () => Boolean(keyId && keySecret);

/** The public key id, safe to embed in the browser checkout. */
export const razorpayKeyId = keyId;

/** The webhook signing secret (empty string when unset). */
export const razorpayWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

// Instantiate once and reuse. Created only when configured so a missing-key
// setup can't throw at import time.
let client = null;
if (isPaymentsConfigured()) {
  client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  logger.info("Razorpay client initialised");
} else {
  logger.warn(
    "Razorpay is not configured (RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET missing) — donations are disabled."
  );
}

/** The shared Razorpay client. Throws if accessed while unconfigured. */
export const getRazorpay = () => {
  if (!client) {
    throw new Error("Razorpay is not configured.");
  }
  return client;
};

/** The raw key secret — used only server-side for signature verification. */
export const razorpayKeySecret = keySecret;

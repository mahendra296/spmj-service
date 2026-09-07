// Transactional email. Two layers on purpose:
//
//   sendMail / sendDonationReceipt   — awaitable, throw on failure (tests,
//                                      admin "resend" actions, scripts).
//   queueDonationReceipt             — fire-and-forget, never throws. This is
//                                      what request handlers call: the send
//                                      runs after the response, and a mail
//                                      failure only produces a log line — it
//                                      can never fail the payment API.

import path from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";
import {
  isMailConfigured,
  getTransporter,
  mailFrom,
  mailReplyTo,
} from "../config/mailer.js";
import { env } from "../validators/env.js";
import { formatRupees } from "../utils/payments.js";
import {
  MAIL_MAX_ATTEMPTS,
  MAIL_RETRY_DELAY_MS,
  ORG_NAME,
  ORG_REG_NO,
  ORG_ADDRESS_LINES,
  ORG_EMAIL,
  ORG_PHONE,
} from "../config/constant.js";
import logger from "../utils/logger.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EMAIL_VIEWS_DIR = path.join(__dirname, "..", "views", "emails");

const org = {
  name: ORG_NAME,
  regNo: ORG_REG_NO,
  addressLines: ORG_ADDRESS_LINES,
  email: ORG_EMAIL,
  phone: ORG_PHONE,
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** Render one of the `views/emails/*.ejs` templates to an HTML string. */
const renderTemplate = (template, data) =>
  ejs.renderFile(path.join(EMAIL_VIEWS_DIR, `${template}.ejs`), data);

/**
 * Send one email over the shared Gmail transport, retrying transient
 * failures up to MAIL_MAX_ATTEMPTS. Throws if Gmail is unconfigured or every
 * attempt fails — callers that must not fail should use the `queue*` helpers below.
 *
 * @param {object} options
 * @param {string} options.to        Recipient address.
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.text]    Plain-text alternative (improves delivery).
 * @returns {Promise<object>} nodemailer's send info (`messageId`, ...).
 */
export const sendMail = async ({ to, subject, html, text }) => {
  if (!isMailConfigured()) {
    throw new Error("Gmail is not configured.");
  }
  if (!to) {
    throw new Error("Cannot send mail without a recipient.");
  }

  const message = {
    from: mailFrom,
    to,
    subject,
    html,
    ...(text ? { text } : {}),
    ...(mailReplyTo ? { replyTo: mailReplyTo } : {}),
  };

  let lastError;
  for (let attempt = 1; attempt <= MAIL_MAX_ATTEMPTS; attempt++) {
    try {
      const info = await getTransporter().sendMail(message);
      logger.info("Email sent to {} (subject: {}) messageId={}", to, subject, info.messageId);
      return info;
    } catch (error) {
      lastError = error;
      logger.warn(
        "Email send attempt {}/{} to {} failed",
        attempt,
        MAIL_MAX_ATTEMPTS,
        to,
        error
      );
      if (attempt < MAIL_MAX_ATTEMPTS) await sleep(MAIL_RETRY_DELAY_MS);
    }
  }
  throw lastError;
};

/** Plain-text fallback body, mirroring the HTML receipt. */
const buildReceiptText = ({ donation, amountDisplay, dateDisplay, receiptUrl }) => {
  const lines = [
    donation.status === "paid"
      ? `Thank you, ${donation.donorName}!`
      : `Hello ${donation.donorName},`,
    "",
    donation.status === "paid"
      ? `We've received your donation of ${amountDisplay}. This email is your receipt.`
      : `Your donation of ${amountDisplay} is still processing — we'll email you once it's confirmed.`,
    "",
    "Donation receipt",
    `Reference:   ${donation.receipt}`,
    `Donor name:  ${donation.donorName}`,
    `Donor email: ${donation.donorEmail}`,
  ];
  if (donation.donorPhone) lines.push(`Donor phone: ${donation.donorPhone}`);
  lines.push(`Amount:      ${amountDisplay}`);
  lines.push(`Status:      ${donation.status}`);
  lines.push(`Date:        ${dateDisplay}`);
  if (donation.razorpayPaymentId) lines.push(`Payment ID:  ${donation.razorpayPaymentId}`);
  if (receiptUrl) {
    lines.push("", `View or download your receipt: ${receiptUrl}`);
  }
  lines.push(
    "",
    org.name,
    org.regNo,
    ...org.addressLines,
    `${org.email} · ${org.phone}`
  );
  return lines.join("\n");
};

/**
 * Render and send the donation receipt for one donation row. Awaitable and
 * throws on failure — use `queueDonationReceipt` from request handlers.
 *
 * @param {object} donation A `donations` row (see drizzle/schema.js).
 */
export const sendDonationReceipt = async (donation) => {
  if (!donation) throw new Error("Cannot send a receipt without a donation.");

  const amountDisplay = formatRupees(donation.amount, donation.currency);
  const dateDisplay = new Date(donation.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  // Absolute link to the public receipt lookup (it takes ?ref=<receipt>).
  const receiptUrl = env.APP_BASE_URL
    ? `${env.APP_BASE_URL.replace(/\/+$/, "")}/receipt?ref=${encodeURIComponent(donation.receipt)}`
    : "";

  const view = { donation, amountDisplay, dateDisplay, receiptUrl, org };
  const html = await renderTemplate("donation-receipt", view);

  return sendMail({
    to: donation.donorEmail,
    subject:
      donation.status === "paid"
        ? `Receipt for your donation — ${donation.receipt}`
        : `We're confirming your donation — ${donation.receipt}`,
    html,
    text: buildReceiptText(view),
  });
};

/**
 * Fire-and-forget receipt send. Returns immediately (the promise it starts is
 * deliberately not awaited by the caller) and swallows every error, so a mail
 * outage can never fail or delay the payment request that triggered it.
 *
 * Call this only where the donation actually transitioned to `paid`, so the
 * checkout callback and the webhook don't both email the same donor.
 *
 * @param {object} donation A `donations` row.
 */
export const queueDonationReceipt = (donation) => {
  if (!donation?.donorEmail) {
    logger.warn("Skipping donation receipt email — no donor email on the record");
    return;
  }
  if (!isMailConfigured()) {
    logger.warn(
      "Skipping donation receipt email for {} — Gmail is not configured",
      donation.receipt
    );
    return;
  }

  // setImmediate defers the work past the current tick so the HTTP response
  // is already on its way out before we touch Gmail's SMTP server.
  setImmediate(() => {
    sendDonationReceipt(donation)
      .then(() =>
        logger.info(
          "Donation receipt email sent for {} to {}",
          donation.receipt,
          donation.donorEmail
        )
      )
      .catch((error) =>
        // Intentionally terminal: the donor can still retrieve the receipt at
        // /receipt?ref=..., and the payment itself is unaffected.
        logger.error(
          "Failed to send donation receipt email for {} to {}",
          donation.receipt,
          donation.donorEmail,
          error
        )
      );
  });
};

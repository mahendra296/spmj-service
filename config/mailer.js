// Gmail SMTP transport + configuration helpers for outgoing mail.
//
// Uses nodemailer's well-known "gmail" service, which resolves to
// smtp.gmail.com with implicit TLS — no host/port to configure. Auth needs a
// Google **App Password** (16 chars, generated at
// https://myaccount.google.com/apppasswords with 2-Step Verification on); a
// normal account password is rejected by Google.
//
// Like Razorpay (see config/razorpay.js), the credentials are optional in the
// environment so the app boots in any setup. Callers check
// `isMailConfigured()`; the mail service degrades to a warning log instead of
// throwing, so a missing or broken mail setup can never break a request.

import nodemailer from "nodemailer";
import { env } from "../validators/env.js";
import logger from "../utils/logger.js";
import {
  MAIL_CONNECTION_TIMEOUT_MS,
  MAIL_SOCKET_TIMEOUT_MS,
  ORG_NAME,
} from "./constant.js";

const user = env.GMAIL_USER;
const pass = env.GMAIL_APP_PASSWORD;

/** True only when both the Gmail address and its App Password are present. */
export const isMailConfigured = () => Boolean(user && pass);

/**
 * The display From address. Gmail only accepts a From that is the
 * authenticated account or one of its verified "Send mail as" aliases, so this
 * defaults to GMAIL_USER and MAIL_FROM is just an alias override.
 */
export const mailFrom = (() => {
  const address = env.MAIL_FROM || user;
  if (!address) return "";
  const name = env.MAIL_FROM_NAME || ORG_NAME;
  return `"${name}" <${address}>`;
})();

/** Optional Reply-To (empty string when unset — then simply omitted). */
export const mailReplyTo = env.MAIL_REPLY_TO;

// Instantiate once and reuse (nodemailer pools connections). Created only when
// configured so a credential-less setup can't throw at import time.
let transporter = null;
if (isMailConfigured()) {
  transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
    pool: true,
    connectionTimeout: MAIL_CONNECTION_TIMEOUT_MS,
    greetingTimeout: MAIL_CONNECTION_TIMEOUT_MS,
    socketTimeout: MAIL_SOCKET_TIMEOUT_MS,
  });
  logger.info("Gmail SMTP transport initialised for {}", user);
} else {
  logger.warn(
    "Gmail is not configured (GMAIL_USER / GMAIL_APP_PASSWORD missing) — transactional emails will be skipped."
  );
}

/** The shared Gmail transport. Throws if accessed while unconfigured. */
export const getTransporter = () => {
  if (!transporter) {
    throw new Error("Gmail is not configured.");
  }
  return transporter;
};

/**
 * One-off connectivity / credential check — catches a wrong App Password at
 * startup instead of on the first donation. Returns true or false instead of
 * throwing, so it is safe to call from a health check.
 */
export const verifyMailConnection = async () => {
  if (!transporter) return false;
  try {
    await transporter.verify();
    logger.info("Gmail SMTP connection verified for {}", user);
    return true;
  } catch (error) {
    logger.error("Gmail SMTP connection verification failed", error);
    return false;
  }
};

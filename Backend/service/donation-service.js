import { db } from "../config/db.js";
import { donationsTable } from "../drizzle/schema.js";
import { eq, and, ne, desc, count, sum } from "drizzle-orm";
import { getRazorpay } from "../config/razorpay.js";
import { DONATION_CURRENCY } from "../config/constant.js";
import logger from "../utils/logger.js";

/**
 * Create a Razorpay order and persist a matching "created" donation row.
 * The order amount is authoritative — Razorpay will only collect this exact
 * amount, so a tampered client can't change what's charged.
 *
 * @param {object} input
 * @param {string} input.receipt      Our unique receipt id.
 * @param {number} input.amountPaise  Amount in paise (already validated).
 * @param {string} input.donorName
 * @param {string} input.donorEmail
 * @param {string} [input.donorPhone]
 * @param {string} [input.message]
 * @returns {Promise<object>} the persisted donation row (with razorpayOrderId).
 */
export const createDonationOrder = async (input) => {
  logger.info("Invoke createDonationOrder method")
  const order = await getRazorpay().orders.create({
    amount: input.amountPaise,
    currency: DONATION_CURRENCY,
    receipt: input.receipt,
    notes: {
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      purpose: "donation",
    },
  });
  logger.info("Found the order form give doner eamil : {}", input.donorEmail )

  const [donation] = await db
    .insert(donationsTable)
    .values({
      receipt: input.receipt,
      donorName: input.donorName,
      donorEmail: input.donorEmail,
      donorPhone: input.donorPhone || null,
      message: input.message || null,
      amount: input.amountPaise,
      currency: DONATION_CURRENCY,
      status: "created",
      razorpayOrderId: order.id,
    })
    .returning();

  return donation;
};

export const getDonationByOrderId = async (orderId) => {
  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.razorpayOrderId, orderId));
  return donation;
};

export const getDonationByReceipt = async (receipt) => {
  const [donation] = await db
    .select()
    .from(donationsTable)
    .where(eq(donationsTable.receipt, receipt));
  return donation;
};

/**
 * Mark a donation paid — idempotent. Only transitions rows that aren't already
 * "paid", so the checkout callback and the webhook can both call this safely
 * without double-processing. Returns the updated row, or undefined if it was
 * already paid / not found.
 */
export const markDonationPaid = async (orderId, { paymentId, signature } = {}) => {
  const [donation] = await db
    .update(donationsTable)
    .set({
      status: "paid",
      razorpayPaymentId: paymentId || null,
      razorpaySignature: signature || null,
    })
    .where(
      and(
        eq(donationsTable.razorpayOrderId, orderId),
        ne(donationsTable.status, "paid")
      )
    )
    .returning();
  return donation;
};

/**
 * Mark a donation failed — never overrides an already-paid row (a late failure
 * webhook after a successful capture must not undo success).
 */
export const markDonationFailed = async (orderId, { paymentId } = {}) => {
  const [donation] = await db
    .update(donationsTable)
    .set({
      status: "failed",
      razorpayPaymentId: paymentId || null,
    })
    .where(
      and(
        eq(donationsTable.razorpayOrderId, orderId),
        ne(donationsTable.status, "paid")
      )
    )
    .returning();
  return donation;
};

/** Newest-first page of donations for the admin list. */
export const getDonations = async ({ limit, offset = 0 } = {}) => {
  let query = db
    .select()
    .from(donationsTable)
    .orderBy(desc(donationsTable.createdAt));
  if (limit != null) query = query.limit(limit).offset(offset);
  return query;
};

export const countDonations = async () => {
  const [row] = await db.select({ value: count() }).from(donationsTable);
  return row?.value ?? 0;
};

/** Headline stats for the admin list: totals + amount actually raised. */
export const getDonationStats = async () => {
  const [totals] = await db
    .select({ total: count() })
    .from(donationsTable);
  const [paid] = await db
    .select({ paidCount: count(), raised: sum(donationsTable.amount) })
    .from(donationsTable)
    .where(eq(donationsTable.status, "paid"));
  return {
    totalCount: totals?.total ?? 0,
    paidCount: paid?.paidCount ?? 0,
    raisedPaise: Number(paid?.raised ?? 0),
  };
};

/** Every donation, newest first — for the CSV export. */
export const getAllDonations = async () =>
  db.select().from(donationsTable).orderBy(desc(donationsTable.createdAt));

import crypto from "node:crypto";
import {
  createDonationOrder,
  getDonationByReceipt,
  getDonationByOrderId,
  markDonationPaid,
  markDonationFailed,
  getDonations,
  countDonations,
  getDonationStats,
  getAllDonations,
} from "../service/donation-service.js";
import { validateDonation } from "../validators/donation-validator.js";
import {
  isPaymentsConfigured,
  razorpayKeyId,
  razorpayKeySecret,
  razorpayWebhookSecret,
} from "../config/razorpay.js";
import {
  rupeesToPaise,
  buildReceipt,
  verifyPaymentSignature,
  verifyWebhookSignature,
  formatPaiseINR,
} from "../utils/payments.js";
import {
  DONATION_PRESETS,
  DONATION_MIN_AMOUNT,
  DONATION_MAX_AMOUNT,
  DONATION_CURRENCY,
  PAGE_SIZE_OPTIONS,
} from "../config/constant.js";
import { parsePage, parsePageSize, pageSizeQuery, buildPagination } from "../utils/pagination.js";
import ApiResponse from "../utils/api-response.js";
import logger from "../utils/logger.js";

/* ---------- Public: donation page ---------- */

export const getDonatePage = (req, res) => {
  return res.render("donate", {
    title: "Donate — SPMJ Foundation",
    page: "donate",
    paymentsEnabled: isPaymentsConfigured(),
    presets: DONATION_PRESETS,
    minAmount: DONATION_MIN_AMOUNT,
    maxAmount: DONATION_MAX_AMOUNT,
    currency: DONATION_CURRENCY,
  });
};

/* ---------- Public: create order (JSON) ---------- */

export const createOrder = async (req, res) => {
  if (!isPaymentsConfigured()) {
    return res
      .status(503)
      .json(ApiResponse.error("Donations are temporarily unavailable."));
  }

  const validation = validateDonation(req.body);
  if (!validation.success) {
    const issue = (validation.error.issues || validation.error.errors || [])[0];
    return res
      .status(400)
      .json(ApiResponse.error(issue?.message || "Please check the form and try again."));
  }

  const { donorName, donorEmail, donorPhone, message, amount } = validation.data;

  try {
    // A unique, ≤40-char receipt: base36 timestamp + random bytes.
    const seed = `${Date.now().toString(36)}${crypto.randomBytes(4).toString("hex")}`;
    const donation = await createDonationOrder({
      receipt: buildReceipt(seed),
      amountPaise: rupeesToPaise(amount),
      donorName,
      donorEmail,
      donorPhone,
      message,
    });

    return res.json(
      ApiResponse.success(
        {
          keyId: razorpayKeyId,
          orderId: donation.razorpayOrderId,
          amount: donation.amount,
          currency: donation.currency,
          receipt: donation.receipt,
          donor: { name: donorName, email: donorEmail, phone: donorPhone || "" },
        },
        "Order created."
      )
    );
  } catch (error) {
    logger.logError(error, req);
    return res
      .status(502)
      .json(ApiResponse.error("Could not start the payment. Please try again."));
  }
};

/* ---------- Public: verify payment (JSON, called from checkout handler) ---------- */

export const verifyPayment = async (req, res) => {
  const {
    razorpay_order_id: orderId,
    razorpay_payment_id: paymentId,
    razorpay_signature: signature,
  } = req.body || {};

  const valid = verifyPaymentSignature({
    orderId,
    paymentId,
    signature,
    secret: razorpayKeySecret,
  });

  if (!valid) {
    // Signature mismatch — do not trust the client; flag the attempt.
    logger.warn("Razorpay payment signature verification failed", { orderId, paymentId });
    if (orderId) await markDonationFailed(orderId, { paymentId }).catch(() => {});
    return res
      .status(400)
      .json(ApiResponse.error("Payment could not be verified."));
  }

  try {
    let donation = await markDonationPaid(orderId, { paymentId, signature });
    // markDonationPaid returns undefined if it was already paid (e.g. the
    // webhook beat us to it) — that's still a success for the donor, so fall
    // back to looking the row up for its receipt.
    if (!donation) donation = await getDonationByOrderId(orderId);
    return res.json(
      ApiResponse.success(
        { redirect: `/donate/success?ref=${encodeURIComponent(donation?.receipt || "")}` },
        "Payment verified."
      )
    );
  } catch (error) {
    logger.logError(error, req);
    return res
      .status(500)
      .json(ApiResponse.error("Payment verified but could not be recorded. Please contact us."));
  }
};

/* ---------- Public: thank-you page ---------- */

export const getDonationSuccessPage = async (req, res, next) => {
  try {
    const ref = req.query.ref;
    const donation = ref ? await getDonationByReceipt(ref) : null;
    if (!donation) return next(); // unknown receipt → 404
    return res.render("donate-success", {
      title: "Thank you — SPMJ Foundation",
      page: "donate",
      donation,
      amountDisplay: formatPaiseINR(donation.amount, donation.currency),
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

/* ---------- Webhook (server-to-server, source of truth) ---------- */

export const handleWebhook = async (req, res) => {
  // `req.rawBody` is captured by the express.json verify hook in index.js.
  const signature = req.headers["x-razorpay-signature"];
  const valid = verifyWebhookSignature({
    rawBody: req.rawBody,
    signature,
    secret: razorpayWebhookSecret,
  });

  if (!valid) {
    logger.warn("Razorpay webhook signature verification failed");
    return res.status(400).json(ApiResponse.error("Invalid signature."));
  }

  try {
    const event = req.body?.event;
    const payment = req.body?.payload?.payment?.entity;
    const order = req.body?.payload?.order?.entity;
    const orderId = payment?.order_id || order?.id;

    if (orderId) {
      if (event === "payment.captured" || event === "order.paid") {
        await markDonationPaid(orderId, { paymentId: payment?.id });
      } else if (event === "payment.failed") {
        await markDonationFailed(orderId, { paymentId: payment?.id });
      }
    }

    // Always 200 on a valid signature so Razorpay stops retrying.
    return res.json(ApiResponse.successMessage("ok"));
  } catch (error) {
    logger.logError(error, req);
    // 500 → Razorpay will retry later, which is what we want on a transient DB error.
    return res.status(500).json(ApiResponse.error("Processing error."));
  }
};

/* ---------- Admin: list + CSV export ---------- */

export const listDonationsAdmin = async (req, res) => {
  try {
    const pageSize = parsePageSize(req.query.size);
    const [totalCount, stats] = await Promise.all([
      countDonations(),
      getDonationStats(),
    ]);
    const pagination = buildPagination({
      page: parsePage(req.query.page),
      pageSize,
      totalCount,
      baseUrl: "/admin/donations",
      query: pageSizeQuery(pageSize),
    });
    const donations = await getDonations({
      limit: pageSize,
      offset: pagination.offset,
    });
    return res.render("admin/donations/index", {
      title: "Donations — SPMJ Admin",
      page: "admin",
      donations,
      pagination,
      pageSize,
      pageSizeOptions: PAGE_SIZE_OPTIONS,
      stats,
      fmt: formatPaiseINR,
    });
  } catch (error) {
    logger.logError(error, req);
    return res.status(500).send("Internal server error.");
  }
};

// Quote a CSV field per RFC 4180 (wrap in quotes, double embedded quotes).
const csvCell = (value) => {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
};

export const exportDonationsCsv = async (req, res) => {
  try {
    const rows = await getAllDonations();
    const header = [
      "Receipt",
      "Date",
      "Donor name",
      "Email",
      "Phone",
      "Amount (INR)",
      "Currency",
      "Status",
      "Razorpay order id",
      "Razorpay payment id",
      "Message",
    ];
    const lines = [header.map(csvCell).join(",")];
    for (const r of rows) {
      lines.push(
        [
          r.receipt,
          new Date(r.createdAt).toISOString(),
          r.donorName,
          r.donorEmail,
          r.donorPhone || "",
          (r.amount / 100).toFixed(2),
          r.currency,
          r.status,
          r.razorpayOrderId,
          r.razorpayPaymentId || "",
          r.message || "",
        ]
          .map(csvCell)
          .join(",")
      );
    }
    // Prepend a BOM so Excel reads UTF-8 (₹, accented names) correctly.
    const csv = "﻿" + lines.join("\r\n");

    const stamp = new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="donations-${stamp}.csv"`
    );
    return res.send(csv);
  } catch (error) {
    logger.logError(error, req);
    req.flash("error", "Could not export donations.");
    return res.redirect("/admin/donations");
  }
};

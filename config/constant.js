export const MILLISECONDS_PER_SECOND = 1000;
export const SECONDS_PER_MINUTE = 60;
export const MINUTE_PER_HOUR = 60;
export const HOUR_PER_DAY = 24;
export const DAY_PER_WEEK = 7;

// Session lifetime: 8 hours (flash messages only)
export const SESSION_MAX_AGE =
  8 * MINUTE_PER_HOUR * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// JWT access token: short-lived (15 minutes)
export const ACCESS_TOKEN_EXPIRY =
  15 * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND;

// JWT refresh token: long-lived (7 days)
export const REFRESH_TOKEN_EXPIRY =
  DAY_PER_WEEK *
  HOUR_PER_DAY *
  MINUTE_PER_HOUR *
  SECONDS_PER_MINUTE *
  MILLISECONDS_PER_SECOND;

// Slider auto-advance interval (used in client script)
export const SLIDER_INTERVAL_MS = 5000;

// Role-based access control
export const ROLES = {
  ADMIN: "ROLE_ADMIN",
  USER: "ROLE_USER",
};

// Blog / News categories
export const BLOG_CATEGORIES = ["article", "press", "announcement"];

// Gallery media types
export const MEDIA_TYPES = ["image", "video"];

// Upload limits
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

// Pagination — items per page (chosen from the UI dropdown)
export const DEFAULT_PAGE_SIZE = 5;
export const PAGE_SIZE_OPTIONS = [5, 10, 25, 50];

/* ---------- Donations (Razorpay) ---------- */

// Currency for donations (ISO 4217). The DB stores amounts in rupees
// (decimal); Razorpay's API always wants paise, converted only at the point
// of calling Razorpay (see utils/payments.js `rupeesToPaise`).
export const DONATION_CURRENCY = "INR";

// Preset amounts shown as quick-pick buttons, in major units (rupees).
export const DONATION_PRESETS = [500, 1000, 2500, 5000];

// Bounds for the custom amount (major units / rupees).
export const DONATION_MIN_AMOUNT = 10; // Razorpay's floor is ₹1; we keep ₹10.
export const DONATION_MAX_AMOUNT = 500000; // ₹5,00,000 sanity cap.

// Payment lifecycle states (mirrors paymentStatusEnum in the schema).
export const PAYMENT_STATUSES = ["created", "paid", "failed", "refunded"];

// One rupee = 100 paise.
export const PAISE_PER_RUPEE = 100;

/* ---------- Organisation details (letterhead for receipts / emails) ---------- */

export const ORG_NAME = "SPMJ Foundation";
export const ORG_REG_NO = "Reg. No. F-723/B.K, Guj-737/B.K";
export const ORG_ADDRESS_LINES = [
  "103/104 Shop No, Virat Complex, Prabhat Typing Gali, Near Jilla Panchayat,",
  "Palanpur, Banaskantha, Gujarat - 385001",
];
export const ORG_EMAIL = "sahyogjasali@gmail.com";
export const ORG_PHONE = "+91 99986 70081";

/* ---------- Transactional email ---------- */

// Gmail SMTP timeouts — kept short so a slow or unreachable mail server
// can't hold a pooled connection (or a background send) open for long.
export const MAIL_CONNECTION_TIMEOUT_MS = 10 * MILLISECONDS_PER_SECOND;
export const MAIL_SOCKET_TIMEOUT_MS = 20 * MILLISECONDS_PER_SECOND;

// Retries for a failed send. Receipts are worth one retry (transient SMTP
// blips and Gmail throttling are common); after that we give up and log —
// the donor can always look the receipt up at /receipt.
export const MAIL_MAX_ATTEMPTS = 2;
export const MAIL_RETRY_DELAY_MS = 3 * MILLISECONDS_PER_SECOND;

# SPMJ Foundation

Website for **SPMJ Foundation**, an educational non-profit working to bring free,
quality education to underprivileged children through schooling, after-school
learning, digital & STEM labs, scholarships, and child welfare programs.

Built with Node.js, Express, and EJS templates.

## Getting started

```bash
npm install
npm run db:generate   # generate SQL migration from drizzle/schema.js
npm run db:migrate    # apply migrations to MySQL
npm run db:seed       # create the admin + user accounts
npm run dev
```

The site runs at `http://localhost:3000` (configurable via `PORT` in `.env`).

## Authentication & database

Login is backed by **MySQL** (via Drizzle ORM) with **JWT access + refresh
tokens**, **role-based access control**, and **argon2**-hashed passwords.

- Connection: set `MYSQL_DATABASE_URL` in `.env`.
- Schema: `drizzle/schema.js` — `users` (role `ROLE_ADMIN` / `ROLE_USER`),
  `refresh_tokens` (one row per signed-in session), the content tables
  `events`, `blog_posts`, and `gallery_items`, plus `donations` (Razorpay).
- Tokens: a short-lived `access_token` and long-lived `refresh_token` are stored
  as **httpOnly cookies**. `verifyAuthToken` (in `middlewares/verify-auth-middleware.js`)
  validates the access token on every request and silently refreshes it from the
  refresh token when it expires. The role is embedded in the access token.
- Sessions: each login creates a `refresh_tokens` row; an in-memory cache
  (`service/session-cache.js`) gives O(1) validity checks so **logout takes effect
  immediately**. The cache is warmed from the DB on startup.
- Set `JWT_SECRET` and `REFRESH_TOKEN_SECRET` in `.env`. Cookies are only marked
  `secure` when `NODE_ENV=production` (so login works over `http://localhost`).
- Roles are enforced by `requireRole(...)` / `requireAdmin`. Login is by **email**.
  Only `ROLE_ADMIN` users may open the `/admin/*` management pages.

## Content management (admin only)

Signed-in admins manage all site content from `/admin/dashboard`:

| Section   | Manage at           | Public page                |
|-----------|---------------------|----------------------------|
| Events    | `/admin/events`     | `/events`, `/events/:slug` |
| Blog      | `/admin/blog`       | `/blog`, `/blog/:slug`     |
| Gallery   | `/admin/gallery`    | `/gallery`                 |
| Donations | `/admin/donations`  | `/donate`                  |

- Full create / edit / delete for each type, guarded by `requireAdmin`.
- **Gallery** accepts an uploaded image/video **or** an external URL (e.g. YouTube).
  Uploads use `multer` (`middlewares/upload-middleware.js`) and are stored under
  `public/uploads/` (git-ignored).
- **Events** are split into upcoming/past on the public page by their date.
- **Blog** posts are categorised as `article`, `press`, or `announcement`.

Other DB commands: `npm run db:push` (push schema without migration files),
`npm run db:studio` (open Drizzle Studio).

## Donations (Razorpay)

Public, secure one-time donations are processed by **Razorpay**.

- **Setup**: create a Razorpay account, then add to `.env`:
  `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
  Use **test-mode** keys while developing. If the keys are absent the app still
  boots and `/donate` shows a friendly "temporarily unavailable" notice.
- **Donor flow** (`/donate`): pick a preset (₹500 / ₹1,000 / ₹2,500 / ₹5,000) or
  enter a custom amount, then pay via Razorpay Checkout. On success the donor
  lands on a thank-you page (`/donate/success`).
- **How it works**:
  1. `POST /donate/order` validates the form and creates a Razorpay **order**
     server-side (the order amount is authoritative — the client can't change
     what's charged) plus a `donations` row with status `created`.
  2. Razorpay Checkout collects payment in the browser (`public/donate.js`).
  3. `POST /donate/verify` verifies the **HMAC-SHA256 signature** of the callback
     before marking the donation `paid`.
  4. `POST /donate/webhook` is the server-to-server **source of truth** — it
     verifies the webhook signature against the raw request body and reconciles
     `payment.captured` / `order.paid` / `payment.failed`. Status updates are
     **idempotent**, so the callback and webhook can't double-process.
- **Money** is stored in **paise** (integer) in `donations.amount` to avoid
  float bugs; divide by 100 only for display.
- **Admin** (`/admin/donations`, ROLE_ADMIN): read-only paginated list with
  headline stats (total raised, successful count) and a **Download CSV** export.
- **Webhook setup**: in the Razorpay dashboard add a webhook pointing at
  `https://<your-host>/donate/webhook` for the `payment.captured`,
  `payment.failed`, and `order.paid` events, using the same secret as
  `RAZORPAY_WEBHOOK_SECRET`.

## Transactional email (donation receipts)

When a donation transitions to `paid`, the donor is emailed a receipt.

- **Setup** (Gmail): in the Google account, turn on **2-Step Verification**,
  generate an **App Password** at <https://myaccount.google.com/apppasswords>,
  then add to `.env`:
  ```
  GMAIL_USER=you@gmail.com
  GMAIL_APP_PASSWORD=abcd efgh ijkl mnop   # App Password, NOT the account password
  MAIL_FROM_NAME=SPMJ Foundation
  APP_BASE_URL=https://<your-host>
  ```
  Mail goes out through nodemailer's built-in `service: "gmail"` (smtp.gmail.com
  over TLS) — there is no host or port to configure. `MAIL_FROM` and
  `MAIL_REPLY_TO` are optional; `MAIL_FROM` must be a verified "Send mail as"
  alias of `GMAIL_USER` or Gmail will rewrite it.
- **Optional by design**: if `GMAIL_USER` / `GMAIL_APP_PASSWORD` are unset the
  app still boots and payments work exactly as before — each skipped send just
  logs a warning.
- **Gmail limits**: a free Gmail account allows roughly 500 recipients/day
  (Workspace ~2,000). Fine for donation receipts; move to a dedicated sending
  provider before doing bulk mail.
- **Never blocks a payment**: `queueDonationReceipt()`
  (`service/mail-service.js`) is **fire-and-forget** — it defers the send with
  `setImmediate` so the HTTP response goes out first, and swallows every error
  into a log line. A mail outage cannot fail `/donate/verify` or the webhook.
  Failed sends are retried once (`MAIL_MAX_ATTEMPTS`); after that the donor can
  still retrieve the receipt at `/receipt?ref=<reference>`.
- **Sent exactly once**: only the code path that actually flipped the row to
  `paid` sends the mail, so the checkout callback and the webhook never both
  email the same donor.
- **Template**: `views/emails/donation-receipt.ejs` (table-based HTML with
  inline styles, plus a plain-text alternative for deliverability). It mirrors
  the on-site receipt card and the downloadable PDF.
- **Awaitable variants**: `sendDonationReceipt(donation)` and
  `sendMail({ to, subject, html, text })` throw on failure — use those for
  scripts or an admin "resend" action. `verifyMailConnection()` in
  `config/mailer.js` checks the Gmail credentials (catching a wrong App
  Password) without throwing.

## Pages

- `/` — Home (mission, programs, impact, stories)
- `/about` — Mission, vision, story, and values
- `/services` — Programs and ways to give
- `/events` — Upcoming & past events (detail at `/events/:slug`)
- `/gallery` — Photos and videos from events/camps
- `/blog` — Articles, press coverage, announcements (detail at `/blog/:slug`)
- `/contact` — Get in touch / volunteer
- `/donate` — Make a secure donation via Razorpay (thank-you at `/donate/success`)
- `/admin/login` — Admin console (demo credentials in `.env`)
- `/admin/dashboard` — Manage events, blog posts, gallery, and donations (ROLE_ADMIN only)

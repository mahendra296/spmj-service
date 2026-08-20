# SPMJ Foundation

Website for **SPMJ Foundation**, an educational non-profit — built as a
**React (Vite + TypeScript)** frontend and a **Node.js (Express) JSON API**
backend.

## Project structure

```
spmj-service/
  Backend/     Express JSON API — auth, content, donations, the Postgres/Drizzle data layer
  Frontend/    React UI — public site + admin console, talks to the Backend over /api
  start.bat    Launches both dev servers (Windows)
  stop.bat     Stops both dev servers (Windows)
```

### Backend (`Backend/`)

```
Backend/
  index.js                          # entry point — wires middleware, mounts routers, starts the server
  config/
    constant.js                     # app constants (roles, token expiries, pagination, donation limits)
    db.js                           # drizzle-orm/postgres-js connection
    razorpay.js                     # Razorpay client + isPaymentsConfigured()
  drizzle/
    schema.js                       # users, refresh_tokens, events, blog_posts, gallery_items, donations
    seed.js                         # creates the admin + user accounts, sample content
    migrations/
  routes/                           # one file per resource, each exporting a public + admin sub-router
  controller/                       # request handling — every response uses the ApiResponse envelope
  service/                          # DB access (Drizzle queries)
  middlewares/
    verify-auth-middleware.js       # JWT cookie auth (soft) + requireAuth/requireRole/requireAdmin guards
    upload-middleware.js            # multer (disk storage, public/uploads/{events,blog,gallery}/)
    error-handler.js                # errorHandler, notFoundHandler, asyncHandler — all JSON
    http-logger.js, metrics-middleware.js
  utils/
    api-response.js                 # ApiResponse — { success, message, data, timestamp }
    pagination.js                   # parsePage/parsePageSize/buildPagination/toPaginationMeta
    zod-errors.js                   # fieldErrors(validation) — flattens Zod issues to { field: message }
    payments.js                     # Razorpay signature verification, paise/rupee conversion
    logger.js, metrics.js, slugify.js
  validators/                       # Zod schemas + env.js
```

### Frontend (`Frontend/`)

```
Frontend/
  src/
    main.tsx                        # BrowserRouter + AuthProvider root
    App.tsx                         # route table (public layout, admin login layout, protected admin layout)
    constants.ts                    # UI-only constants (slider timing, static Programs list, page sizes)
    types.ts                        # TS types mirroring the Backend's response shapes
    api/                            # one module per resource + client.ts (fetch wrapper, unwraps ApiResponse)
    context/AuthContext.tsx         # current user, login/logout/refresh (GET /api/auth/me on load)
    layout/                         # PublicLayout, AdminLayout, AdminLoginLayout
    components/                     # Header, Footer, HeroSlider, Pagination, PageSizeSelect,
                                     #   EventCard, ContentCard, GalleryGrid, RowActions, Toast, ProtectedRoute
    hooks/                          # usePagedList (page/pageSize state + fetch), useScrollReveal
    pages/
      public/                       # Home, About, Services, Events, EventDetail, Blog, BlogDetail,
                                     #   Gallery, Contact, Donate, DonateSuccess, NotFound
      admin/                        # Login, Dashboard, {Events,Blog,Gallery}ListAdmin + Form, DonationsListAdmin
    styles/style.css                # ported near-verbatim from the original site (design tokens + component classes)
  public/images/                    # hero slider background SVGs
  vite.config.ts                    # dev server + /api and /uploads proxy to the Backend
```

## Prerequisites

- Node.js 22+ (uses `--watch` and `--env-file`)
- PostgreSQL

## Running the backend

```bash
cd Backend
cp .env.example .env   # then fill in real secrets
npm install
npm run db:migrate
npm run db:seed        # creates the admin + user accounts
npm run dev
```

- Starts on `http://localhost:5000` (reads `PORT` from `Backend/.env`).
- Other scripts: `npm start` (same as `dev`), `npm run debug` (adds `--inspect`),
  `npm run db:generate` / `db:push` / `db:studio`.
- Logs are written to `Backend/logs/` as well as the console.

## Running the frontend

Open a second terminal:

```bash
cd Frontend
npm install
npm run dev
```

- Starts on `http://localhost:5173`.
- Requests to `/api/*` and `/uploads/*` are proxied to the Backend at
  `http://localhost:5000` (see `Frontend/vite.config.ts`), so the Backend must
  be running first.

Or on Windows, run `start.bat` from the repo root to launch both at once
(`stop.bat` to stop them).

## Authentication

httpOnly cookie-based JWT auth (`access_token` 15 min, `refresh_token` 7
days), `sameSite: "lax"` so the cookies ride along on the Frontend's
credentialed cross-origin requests during development. The Backend allows
CORS only from `FRONTEND_ORIGIN` with `credentials: true`. Sessions are
tracked in the `refresh_tokens` table (one row per signed-in device); an
in-memory cache gives O(1) validity checks so logout takes effect
immediately, warmed from the DB on Backend startup.

Seeded demo accounts (override via `ADMIN_*` / `USER_*` in `Backend/.env`):

| Role        | Email                             | Password   |
|-------------|------------------------------------|------------|
| ROLE_ADMIN  | admin@sahayogpragatimandal.org     | Admin@123  |
| ROLE_USER   | user@sahayogpragatimandal.org      | User@123   |

## Content management (admin only)

Signed-in admins manage all site content from `/admin/dashboard`:

| Section   | Manage at           | Public page                |
|-----------|---------------------|-----------------------------|
| Events    | `/admin/events`     | `/events`, `/events/:slug`  |
| Blog      | `/admin/blog`       | `/blog`, `/blog/:slug`      |
| Gallery   | `/admin/gallery`    | `/gallery`, `/services#gallery` |
| Donations | `/admin/donations`  | `/donate`                   |

- Full create / edit / delete for each type, guarded server-side by `requireAdmin`.
- **Gallery** accepts an uploaded image/video **or** an external URL (e.g. YouTube).
  Uploads use `multer` and are stored under `Backend/public/uploads/` (git-ignored).
- **Events** are split into upcoming/past on the public page by their date.
- **Blog** posts are categorised as `article`, `press`, or `announcement`.

## Donations (Razorpay)

Public, secure one-time donations are processed by **Razorpay**.

- **Setup**: create a Razorpay account, then add to `Backend/.env`:
  `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`.
  Use **test-mode** keys while developing. If the keys are absent the Backend
  still boots and `/api/donations/config` reports `paymentsEnabled: false`.
- **Donor flow** (`/donate`): pick a preset (₹500 / ₹1,000 / ₹2,500 / ₹5,000)
  or enter a custom amount, then pay via Razorpay Checkout. On success the
  donor lands on `/donate/success?ref=<receipt>`.
- **How it works**:
  1. `POST /api/donations/order` validates the form and creates a Razorpay
     **order** server-side (the order amount is authoritative) plus a
     `donations` row with status `created`.
  2. Razorpay Checkout collects payment in the browser.
  3. `POST /api/donations/verify` verifies the **HMAC-SHA256 signature** of
     the callback before marking the donation `paid`.
  4. `POST /api/donations/webhook` is the server-to-server **source of
     truth** — verifies the webhook signature against the raw request body
     and reconciles `payment.captured` / `order.paid` / `payment.failed`.
     Status updates are **idempotent**.
- **Money** is stored in **paise** (integer) in `donations.amount`; the
  Frontend formats for display.
- **Admin** (`/admin/donations`): read-only paginated list with headline
  stats and a **Download CSV** export (`GET /api/admin/donations/export.csv`
  — a plain link, since Backend and Frontend share an origin via the dev
  proxy / a single reverse proxy in production).

## API

All responses use the envelope `{ success, message, data, timestamp }`
(`Backend/utils/api-response.js`). Validation failures return
`data.errors: { field: message }`.

| Method | Path | Auth | Notes |
|---|---|---|---|
| POST | `/api/auth/login` | — | sets cookies |
| POST | `/api/auth/logout` | — | clears cookies |
| POST | `/api/auth/refresh` | cookie | |
| GET | `/api/auth/me` | — | current user or `{ user: null }` |
| GET | `/api/admin/dashboard` | admin | |
| GET | `/api/events` | — | `?upPage=&pastPage=&size=` |
| GET | `/api/events/:slug` | — | |
| */api/admin/events[/:id]* | admin | full CRUD |
| GET | `/api/blog` | — | `?page=&size=` |
| GET | `/api/blog/:slug` | — | |
| */api/admin/blog[/:id]* | admin | full CRUD |
| GET | `/api/gallery` | — | `?page=&size=` |
| */api/admin/gallery[/:id]* | admin | full CRUD |
| GET | `/api/admin/meta/events` | admin | dropdown data for the gallery form |
| GET | `/api/donations/config` | — | |
| POST | `/api/donations/order` | — | |
| POST | `/api/donations/verify` | — | |
| POST | `/api/donations/webhook` | — (HMAC) | server-to-server |
| GET | `/api/donations/receipt/:ref` | — | |
| GET | `/api/admin/donations` | admin | `?page=&size=` |
| GET | `/api/admin/donations/export.csv` | admin | CSV download |
| POST | `/api/contact` | — | logged, not persisted |

## Environment variables (`Backend/.env`)

See `Backend/.env.example`. Notable: `FRONTEND_ORIGIN` (CORS allow-list),
`JWT_SECRET` / `REFRESH_TOKEN_SECRET`, `POSTGRES_DATABASE_URL`,
`RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET`.

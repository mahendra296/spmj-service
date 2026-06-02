# SPMJ Foundation

Website for **SPMJ Foundation**, an educational non-profit working to bring free,
quality education to underprivileged children through schooling, after-school
learning, digital & STEM labs, scholarships, and child welfare programs.

Built with Node.js, Express, and EJS templates.

## Getting started

```bash
npm install
npm run db:generate   # generate SQL migration from drizzle/schema.js
npm run db:migrate    # apply migrations to PostgreSQL
npm run db:seed       # create the admin + user accounts
npm run dev
```

The site runs at `http://localhost:3000` (configurable via `PORT` in `.env`).

## Authentication & database

Login is backed by **PostgreSQL** (via Drizzle ORM) with **JWT access + refresh
tokens**, **role-based access control**, and **argon2**-hashed passwords.

- Connection: set `POSTGRES_DATABASE_URL` in `.env`.
- Schema: `drizzle/schema.js` — `users` (role `ROLE_ADMIN` / `ROLE_USER`),
  `refresh_tokens` (one row per signed-in session), plus the content tables
  `events`, `blog_posts`, and `gallery_items`.
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

| Section | Manage at        | Public page                |
|---------|------------------|----------------------------|
| Events  | `/admin/events`  | `/events`, `/events/:slug` |
| Blog    | `/admin/blog`    | `/blog`, `/blog/:slug`     |
| Gallery | `/admin/gallery` | `/gallery`                 |

- Full create / edit / delete for each type, guarded by `requireAdmin`.
- **Gallery** accepts an uploaded image/video **or** an external URL (e.g. YouTube).
  Uploads use `multer` (`middlewares/upload-middleware.js`) and are stored under
  `public/uploads/` (git-ignored).
- **Events** are split into upcoming/past on the public page by their date.
- **Blog** posts are categorised as `article`, `press`, or `announcement`.

Seeded demo accounts (override via `ADMIN_*` / `USER_*` in `.env`):

| Role        | Email                        | Password   |
|-------------|------------------------------|------------|
| ROLE_ADMIN  | admin@spmjfoundation.org     | Admin@123  |
| ROLE_USER   | user@spmjfoundation.org      | User@123   |

Other DB commands: `npm run db:push` (push schema without migration files),
`npm run db:studio` (open Drizzle Studio).

## Pages

- `/` — Home (mission, programs, impact, stories)
- `/about` — Mission, vision, story, and values
- `/services` — Programs and ways to give
- `/events` — Upcoming & past events (detail at `/events/:slug`)
- `/gallery` — Photos and videos from events/camps
- `/blog` — Articles, press coverage, announcements (detail at `/blog/:slug`)
- `/contact` — Get in touch / donate / volunteer
- `/admin/login` — Admin console (demo credentials in `.env`)
- `/admin/dashboard` — Manage events, blog posts, and gallery (ROLE_ADMIN only)

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

Admin login is backed by **PostgreSQL** (via Drizzle ORM) with **role-based access
control** and **argon2**-hashed passwords.

- Connection: set `POSTGRES_DATABASE_URL` in `.env`.
- Schema: `drizzle/schema.js` (`users` table with a `role` of `ROLE_ADMIN` or `ROLE_USER`).
- Service layer: `service/auth-service.js` (hash/verify) and `service/user-service.js` (queries).
- Roles are enforced by `requireRole(...)` / `requireAdmin` in `middlewares/verify-auth-middleware.js`.
- Login is by **email**. Only `ROLE_ADMIN` users may open `/admin/dashboard`.

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
- `/contact` — Get in touch / donate / volunteer
- `/admin/login` — Admin console (demo credentials in `.env`)

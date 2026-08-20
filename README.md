# SPMJ Foundation

Website for **SPMJ Foundation** — a **React (Vite + TypeScript)** frontend and a
**Node.js (Express) JSON API** backend.

## Project structure

```
spmj-service/
  Backend/     Express JSON API — auth, content, donations, Postgres/Drizzle data layer
  Frontend/    React UI — public site + admin console, talks to the Backend over /api
  start.bat    Launches both dev servers (Windows)
  stop.bat     Stops both dev servers (Windows)
```

## Prerequisites

- Node.js 22+
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

Starts on `http://localhost:5000`.

## Running the frontend

```bash
cd Frontend
npm install
npm run dev
```

Starts on `http://localhost:5173`. Requests to `/api/*` and `/uploads/*` are
proxied to the Backend, so start the Backend first.

Or on Windows, run `start.bat` from the repo root to launch both at once
(`stop.bat` to stop them).

Seeded demo login:

| Role       | Email                           | Password  |
|------------|----------------------------------|-----------|
| ROLE_ADMIN | admin@sahayogpragatimandal.org  | Admin@123 |
| ROLE_USER  | user@sahayogpragatimandal.org   | User@123  |

## API

Base URL: `http://localhost:5000`. Every response is
`{ success, message, data, timestamp }`; validation failures add
`data.errors: { field: message }`. Admin (`/api/admin/*`) routes require the
`access_token` cookie set by login — curl needs `-c cookies.txt` on login and
`-b cookies.txt` on later requests to carry it (Postman does this
automatically once you're logged in through it, as long as cookies are
enabled for the domain).

### Auth

```bash
# Login (saves the auth cookie to cookies.txt)
curl -c cookies.txt -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sahayogpragatimandal.org","password":"Admin@123"}'

# Current user
curl -b cookies.txt http://localhost:5000/api/auth/me

# Logout
curl -b cookies.txt -X POST http://localhost:5000/api/auth/logout

# Admin dashboard counts
curl -b cookies.txt http://localhost:5000/api/admin/dashboard
```

### Events

```bash
# Public: upcoming + past, paginated
curl "http://localhost:5000/api/events?upPage=1&pastPage=1&size=5"

curl http://localhost:5000/api/events/some-event-slug

# Admin: list
curl -b cookies.txt "http://localhost:5000/api/admin/events?page=1&size=5"

# Admin: create (multipart, cover image optional)
curl -b cookies.txt -X POST http://localhost:5000/api/admin/events \
  -F "title=Health Camp" \
  -F "description=A free health check-up camp for the community." \
  -F "location=Palanpur" \
  -F "eventDate=2026-09-01T10:00" \
  -F "published=true" \
  -F "coverImage=@/path/to/cover.jpg"

# Admin: update
curl -b cookies.txt -X PUT http://localhost:5000/api/admin/events/1 \
  -F "title=Health Camp (Updated)" \
  -F "description=..." -F "eventDate=2026-09-02T10:00" -F "published=true"

# Admin: delete
curl -b cookies.txt -X DELETE http://localhost:5000/api/admin/events/1
```

### Blog

```bash
curl "http://localhost:5000/api/blog?page=1&size=5"
curl http://localhost:5000/api/blog/some-post-slug

curl -b cookies.txt "http://localhost:5000/api/admin/blog?page=1&size=5"

curl -b cookies.txt -X POST http://localhost:5000/api/admin/blog \
  -F "title=Our 2026 Update" -F "category=article" \
  -F "content=Long enough post content goes here." \
  -F "author=Communications" -F "published=true" \
  -F "coverImage=@/path/to/cover.jpg"

curl -b cookies.txt -X PUT http://localhost:5000/api/admin/blog/1 \
  -F "title=..." -F "category=article" -F "content=..." -F "published=true"

curl -b cookies.txt -X DELETE http://localhost:5000/api/admin/blog/1
```

### Gallery

```bash
curl "http://localhost:5000/api/gallery?page=1&size=5"

curl -b cookies.txt "http://localhost:5000/api/admin/gallery?page=1&size=5"
curl -b cookies.txt http://localhost:5000/api/admin/meta/events   # event dropdown

# Create — either an uploaded file OR a mediaUrl (one is required)
curl -b cookies.txt -X POST http://localhost:5000/api/admin/gallery \
  -F "mediaType=image" -F "title=Camp photo" \
  -F "mediaFile=@/path/to/photo.jpg"

curl -b cookies.txt -X POST http://localhost:5000/api/admin/gallery \
  -F "mediaType=video" -F "title=Highlight reel" \
  -F "mediaUrl=https://youtube.com/watch?v=..."

curl -b cookies.txt -X PUT http://localhost:5000/api/admin/gallery/1 \
  -F "mediaType=image" -F "mediaUrl=/uploads/gallery/existing-file.jpg"

curl -b cookies.txt -X DELETE http://localhost:5000/api/admin/gallery/1
```

### Donations (Razorpay)

```bash
curl http://localhost:5000/api/donations/config

curl -X POST http://localhost:5000/api/donations/order \
  -H "Content-Type: application/json" \
  -d '{"amount":500,"donorName":"Jane Doe","donorEmail":"jane@example.com"}'

# Called by the Razorpay Checkout handler after payment
curl -X POST http://localhost:5000/api/donations/verify \
  -H "Content-Type: application/json" \
  -d '{"razorpay_order_id":"order_xxx","razorpay_payment_id":"pay_xxx","razorpay_signature":"..."}'

curl http://localhost:5000/api/donations/receipt/don_xxx

curl -b cookies.txt "http://localhost:5000/api/admin/donations?page=1&size=10"
curl -b cookies.txt http://localhost:5000/api/admin/donations/export.csv -o donations.csv
```

`POST /api/donations/webhook` is called by Razorpay directly (server-to-server,
authenticated by an `X-Razorpay-Signature` HMAC header) — not something you'd
call by hand.

### Contact

```bash
curl -X POST http://localhost:5000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","message":"Hello, I would like to volunteer."}'
```

**Using Postman**: paste any of the commands above into Postman via
*Import → Raw text*, or just build the request manually — set the method/URL,
add `Content-Type: application/json` + the JSON body for JSON endpoints, or
switch the body type to `form-data` for the multipart (file upload) ones.
After calling `/api/auth/login` once in Postman, its cookie jar carries the
session automatically for later requests in the same collection/domain.

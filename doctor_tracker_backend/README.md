# Doctor Tracker

A small internal admin panel for a clinic to manage doctors, patients, and appointments — built as a real, layered full-stack application rather than a single demo script. An admin logs in, manages doctor and patient records, keeps track of the relationship between them, books appointments without double-booking a doctor's time slot, and gets a dashboard view of how the clinic is running.

The project intentionally favors clarity and correctness over flashy UI: consistent API responses, backend-enforced validation, soft deletes on anything healthcare-related, and a database-level guarantee (not just a UI check) that a doctor can never be double-booked.

---

## Tech Stack

**Frontend:** Next.js, Tailwind CSS, Axios, TanStack Query, Recharts
**Backend:** Node.js, Express, Sequelize, MySQL, JWT, bcrypt, Zod, Helmet, express-rate-limit
**File storage:** Cloudinary (avatar uploads)
**Testing:** Jest + Supertest

---

## Setup Guide

### Prerequisites
- Node.js 18+
- A MySQL instance (local or hosted)
- A free Cloudinary account (for avatar uploads)

### Backend

```bash
cd doctor_tracker_backend
npm install
cp .env.example .env      # fill in the values below
npx sequelize-cli db:migrate
npm run seed:admin        # creates the first admin account from ADMIN_EMAIL/ADMIN_PASSWORD
npm run dev
```

`.env.example`:
```
PORT=5000
NODE_ENV=development
DB_HOST=
DB_PORT=3306
DB_NAME=
DB_USER=
DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
ADMIN_EMAIL=
ADMIN_PASSWORD=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

### Frontend

```bash
cd doctor_tracker_frontend
npm install
cp .env.example .env.local
npm run dev
```

`.env.example`:
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Running tests
```bash
cd doctor_tracker_backend
npm test
```

---

## System Architecture

The backend follows a strict layered structure — every request travels the same path regardless of which resource it touches:

```
Route → Middleware (auth, validation, rate-limit) → Controller → Service → Sequelize → MySQL
```

Controllers stay thin — they pull the request, call a service, shape the response. All business rules (does this doctor have active patients, is this appointment slot free, does this email already belong to another user) live in the service layer, which is what actually gets tested.

On the frontend, pages don't talk to the API directly. A page calls a TanStack Query hook, which calls a typed fetcher in `lib/`, which goes through one shared Axios instance that attaches the auth token. Server data (doctors, patients, appointments) is managed by TanStack Query's cache; session state (who's logged in) is separate, held in a small Auth context.

The two halves meet at one shared contract: every API response follows the same `{ success, message, data }` shape, and pagination always returns the same `{ total, page, limit, totalPages }` metadata, so the frontend never has to special-case one endpoint's response format against another's.

---

## Technical Decisions

### 1. Migrations instead of `sequelize.sync()`

The obvious fast path during early development is `sequelize.sync({ alter: true })` — Sequelize looks at your model definitions and adjusts the database to match. It's convenient right up until it isn't: it can silently alter or drop a column if a model changes in a way `sync` can't reconcile safely, and it leaves no record of *why* the schema looks the way it does.

This project uses `sequelize-cli` migrations instead. Every schema change — adding a column, adding an index, changing a foreign key's delete behavior — is a timestamped file committed to Git. That means the schema's history is reviewable, the same migration set produces an identical schema on any machine, and rolling back a bad change is a documented command instead of a manual guess. The trade-off is more upfront ceremony for small changes, which is worth it the moment more than one person (or one future version of yourself) needs to trust what the database actually looks like.

### 2. Preventing double-booked appointments at two layers

The rule is simple to state — a doctor can't have two appointments at the same date and time — but enforcing it well took two layers, not one:

- A service-layer check runs before insert: query for a conflicting, non-cancelled appointment for that doctor/date/time, and reject early with a clear error if one exists.
- A database-level composite unique index backs this up, because the service check alone has a race condition — two nearly-simultaneous booking requests could both pass the check before either one commits.

The interesting part came from a bug the test suite caught: the plain unique index didn't know that a *cancelled* appointment should free up its slot for rebooking — to a database index, a cancelled row and a new booking at the same time are just two rows with the same values. The fix was a MySQL generated column, `slot_lock`, that evaluates to `NULL` for cancelled or soft-deleted appointments and `1` otherwise, with the unique index built on top of that column instead of the raw fields. MySQL treats multiple `NULL`s in a unique index as distinct from each other, so any number of cancelled appointments can share a slot, while two genuinely active ones still correctly collide. This keeps the database as the real source of truth for the rule, instead of the application quietly working around a constraint that didn't fully match the business logic.

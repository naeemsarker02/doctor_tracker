# Doctor Tracker — Backend Development Guide
### Full ownership documentation: what was built, why, how it connects, and how to explain it

> **Eita kivabe use korবা:** Eta ekta manual/reference document, code-diff na. Prottek section e "ki banano hoise", "keno eta e দরকার", "file/folder gulo ki kore", ar "interview e কিভাবে explain korবা" ache। Nijer moto pore pore project ta niজে **abar re-derive** korার moto bojha উচিত — just memorize na kore, "eta na thakle ki bhangbe" prosno nijeke jiggesh korতে করতে poro।

---

## Part 1 — Tech Stack: Ki Use Hoise, Keno Hoise

| Technology | Role | Keno eta, alternative ki chilo |
|---|---|---|
| **Node.js + Express.js** | HTTP server, routing | Lightweight, unopinionated — full control over architecture layers. Alternative: NestJS (more structure but heavier learning curve; overkill for this scope). |
| **Sequelize (ORM)** | JS ↔ MySQL translation layer | Model-based, migration support, association handling (FK, joins) without raw SQL everywhere. Alternative: Prisma (more modern, better TS support, but Sequelize is more widely used in existing Bangladeshi job-market codebases — worth knowing both). |
| **MySQL** | Relational data store | Data here is inherently relational (Doctor ↔ Patient ↔ Appointment, strict FK rules) — relational DB is the correct default, not a NoSQL doc store. |
| **sequelize-cli (migrations)** | Version-controlled schema changes | Every schema change is a file, in Git, reproducible on any machine/environment. Alternative was `sequelize.sync()` — fast for prototyping but dangerous in production (can silently alter/drop columns). |
| **JWT (jsonwebtoken)** | Stateless authentication | Server doesn't need to store sessions — token itself carries identity, verified with a secret. Trade-off: can't force-invalidate a single token before expiry without extra infra (token blacklist) — acceptable for this scope, an internal admin tool with a real session-based system. |
| **bcrypt** | Password hashing | One-way hash + salt, so even a DB leak doesn't expose plaintext passwords. Never store or compare plaintext passwords. |
| **Zod** | Request validation | Schema-based validation with good TypeScript-adjacent DX; parses AND validates in one place. Alternative: Joi (older, similar purpose). |
| **Helmet** | Security headers | Sets HTTP headers (CSP, X-Frame-Options, etc.) that block common attack vectors (clickjacking, MIME-sniffing) with near-zero config. |
| **CORS** | Cross-origin control | Without it, browsers block the Next.js frontend (different origin/port) from calling this API. Configured via `CORS_ORIGIN` env var — never wide-open (`*`) in a real app that also uses cookies/auth headers. |
| **Morgan** | Request logging | Every incoming request logged (method, path, status, response time) — essential for debugging and audit trail. |
| **express-rate-limit** | Brute-force protection | Caps login attempts per IP in a time window — cheap, effective first line of defense against credential-stuffing. |
| **Jest + Supertest** | Automated testing | Jest = test runner/assertions. Supertest = simulates real HTTP requests against the Express app without needing a running server — fast, reliable. |

---

## Part 2 — Architecture: The Request Lifecycle

```
Client (Postman / Next.js frontend)
        │
        ▼
   Express app (app.js)
        │
        ▼
   Route  (src/routes/*.js)          — "which URL maps to which handler"
        │
        ▼
   Middleware (src/middleware/*.js)  — auth check, validation, rate limit
        │
        ▼
   Controller (src/controllers/*.js) — "translate HTTP ↔ business logic"
        │
        ▼
   Service (src/services/*.js)       — ALL business logic lives here
        │
        ▼
   Model / Sequelize (src/models/*.js) — talks to MySQL
        │
        ▼
   MySQL Database
```

**Keno ei layering (interview answer):**
Prottek layer-er ekta-i dayitto (single responsibility):
- **Route** — শুধু bole kon URL + HTTP method কোন controller function এ যাবে।
- **Middleware** — request টা controller এ পৌঁছানোর আগে যা করতে হয় (auth verify, input validate, rate limit) — cross-cutting concerns।
- **Controller** — "থিন" রাখা হয়েছে ইচ্ছাকৃতভাবে: শুধু `req` থেকে ডেটা বের করে, service ডাকে, আর response পাঠায়। কোনো business decision এখানে নেয়া হয় না।
- **Service** — আসল সিদ্ধান্তগুলো এখানে: "doctor delete করার আগে patient আছে কিনা check করো", "doctorId exist করে কিনা verify করো" — এসব logic controller-এ না রেখে service-এ রাখলে সেটা reusable, testable, আর controller বদলালেও (e.g. REST → GraphQL) logic টা টিকে থাকে।
- **Model** — শুধু data shape + DB-level rules (validation, associations, hooks) define করে।

এই আলাদা করার ফলে: unit test লেখা সহজ (service কে controller ছাড়াই test করা যায়, যেটা Phase 10-এ করা হয়েছে), আর কোনো একটা layer বদলালে বাকি layer গুলো অক্ষত থাকে।

---

## Part 3 — Full Folder Structure & File-by-File Purpose

```
doctor_tracker_backend/
├── .env                        # actual secrets/config (NEVER committed to Git)
├── .env.example                # template listing required env vars, no real values
├── .sequelizerc                # tells sequelize-cli where to find models/migrations/config
├── package.json                # dependencies + npm scripts (start, test, db:migrate, seed:admin)
│
├── src/
│   ├── app.js                  # Express app setup: Helmet, CORS, Morgan, route mounting, error handlers
│   ├── server.js               # entry point: connects DB, then starts the HTTP listener on PORT
│   │
│   ├── config/
│   │   └── config.js           # Sequelize DB connection config, per NODE_ENV (dev/test/production)
│   │
│   ├── models/
│   │   ├── index.js            # bootstraps Sequelize instance, loads all models, wires associations
│   │   ├── user.js             # User model (admin account) — paranoid: true
│   │   ├── doctor.js           # Doctor model — paranoid: true, hasMany Patient (RESTRICT on delete)
│   │   ├── patient.js          # Patient model — paranoid: true, belongsTo Doctor
│   │   └── appointment.js      # Appointment model (created early; CRUD wiring comes in Phase 16)
│   │
│   ├── migrations/             # one timestamped file per schema change — the real source of truth for DB shape
│   │   ├── ..._create-users.js
│   │   ├── ..._create-doctors.js
│   │   └── ..._create-patients.js
│   │
│   ├── seeders/
│   │   └── seedAdmin.js        # creates the first admin user from ADMIN_EMAIL/ADMIN_PASSWORD env vars, idempotent
│   │
│   ├── routes/
│   │   ├── authRoutes.js       # /api/auth/login, /api/auth/me
│   │   ├── doctorRoutes.js     # /api/doctors/*
│   │   ├── patientRoutes.js    # /api/patients/*
│   │   └── dashboardRoutes.js  # /api/dashboard/* (being reworked into 5 spec-aligned endpoints)
│   │
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   └── dashboardController.js
│   │
│   ├── services/
│   │   ├── authService.js      # login logic, token issuing
│   │   ├── doctorService.js    # CRUD + delete-guard (409 if patients exist)
│   │   ├── patientService.js   # CRUD + assertDoctorExists() guard
│   │   └── dashboardService.js # aggregation queries (COUNT, GROUP BY)
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js   # verifies JWT, attaches req.user, else 401
│   │   ├── validate.js         # generic Zod-validation middleware — takes a "source" (body/params/query)
│   │   ├── rateLimiter.js      # express-rate-limit config for /api/auth/login
│   │   └── errorHandler.js     # global error handler + 404 handler + AppError mapping
│   │
│   ├── validators/
│   │   ├── authValidators.js
│   │   ├── doctorValidators.js # create (all required, email optional), update (partial), idParamSchema
│   │   └── patientValidators.js
│   │
│   └── utils/
│       └── AppError.js         # custom error class: (message, statusCode, errors?) — lets services throw
│                                # deliberate, typed errors that the global handler turns into the standard shape
│
└── tests/
    ├── setup/
    │   └── globalSetup.js      # creates doctor_tracker_test DB if missing, runs migrations before test run
    ├── helpers/
    │   └── testUtils.js        # resetDb(), createAdmin(), loginAsAdmin() — shared test scaffolding
    ├── auth.test.js
    ├── auth.ratelimit.test.js  # isolated file so its own rate-limit state doesn't bleed into other tests
    ├── doctors.test.js
    ├── patients.test.js
    ├── dashboard.test.js
    └── errorHandler.test.js
```

---

## Part 4 — Phase-by-Phase Build Log (What, Why, How It Connects)

### Phase 1–3: Foundation (models, DB connection, basic login)
Initial pass: Express server booted, DB connected, User/Doctor/Patient/Appointment models existed, login worked. But several shortcuts were taken that don't hold up under a "production-minded" bar — everything lived in one file, no security middleware, `sync()` instead of migrations, cascading deletes on healthcare records. This is normal for a first pass — the important part is Phase 4 caught and fixed every one of these before building further on top.

**Interview framing:** "প্রথমে আমি একটা কাজ-চলা version বানিয়েছিলাম, তারপর deliberately review করে production-grade practice-এ upgrade করেছি — এটা real engineering-এ normal, প্রথম দিন থেকেই perfect হওয়ার দরকার নেই, কিন্তু review করে fix করাটা জরুরি।"

### Phase 4: Hardening the Foundation
**What:** Split `server.js` into `app.js` (config) + `server.js` (bootstrap). Wired Helmet/CORS/Morgan. Introduced `sequelize-cli` migrations, dropped `sync()`. Added `paranoid: true` (soft delete) to User/Doctor/Patient. Changed Doctor→Patient FK from `CASCADE` to `RESTRICT`. Added rate limiting on login. Built the global error handler + `AppError` class + 404 handler. Added `GET /api/auth/me`. Fixed JWT expiry and admin seeding to read from env vars.

**Why `app.js`/`server.js` split matters:** Tests (Phase 10) need to import the Express app *without* starting a real network listener — Supertest works directly against the `app` object. If `app.js` also called `.listen()`, every test run would try to bind a port, causing conflicts and hangs. This is exactly the kind of thing that looks like a "style preference" early on but becomes a hard requirement later — good example of why foundational structure matters before building features on top.

**Why `RESTRICT` not `CASCADE` (core concept, know this cold for interview):**
- `CASCADE`: deleting a Doctor row auto-deletes all their Patients. Catastrophic for healthcare data — one accidental doctor delete wipes patient records.
- `RESTRICT`: the database itself *refuses* the delete at the SQL level if dependent rows exist — throws `SequelizeForeignKeyConstraintError`. This is the last line of defense, enforced by MySQL, not just application code.
- **On top of that**, Phase 5 added an *application-level* check (409 response with a clear message) — so the user gets a clean API error instead of a raw DB exception. Two layers: DB constraint = safety net, service check = good UX. Bangla: DB level-এ constraint টা "guarantee", কিন্তু raw SQL error user-friendly না, তাই service layer-এ আগে থেকেই check করে সুন্দর message দেওয়া হয়েছে।

**Why `paranoid: true` (soft delete):** Sequelize adds a `deletedAt` column. A "delete" sets this timestamp instead of removing the row. All default queries (`findAll`, `findOne`, etc.) automatically exclude soft-deleted rows — but the data still physically exists (`paranoid: false` on a query reveals it). For healthcare-adjacent records, this gives an audit trail and a recovery path instead of silent, permanent data loss.

### Phase 5: Doctor CRUD (+ search/filter/pagination absorbed)
**What:** Full CRUD at `/api/doctors`, with search across name/specialization/hospital and pagination baked into the same list endpoint (no separate phase needed — spec's Phase 6 was naturally satisfied here).

**Key design decision — the 409 guard:** `deleteDoctor` blocks with `409 Conflict` if the doctor still has any patients, telling the caller to reassign/remove patients first. This is *not* redundant with the DB's `RESTRICT` constraint — soft-delete (paranoid) never touches the FK at all (the row isn't physically removed), so without this guard you could soft-delete a doctor who still has active patients, and those patients would silently point at a doctor invisible to every default query. The guard exists specifically to catch the case the DB constraint *can't* catch.

**How it connects:** `doctorController` → calls `doctorService.deleteDoctor(id)` → service queries `Patient.count({ where: { doctorId: id } })` → if > 0, throws `AppError('Doctor has active patients...', 409)` → global error handler catches it, formats to `{success:false, message, errors?}`.

### Phase 7: Patient CRUD (+ search/filter/pagination absorbed)
**What:** Full CRUD at `/api/patients`, mirroring the Doctor pattern. List supports search (name/condition/phone) + `doctorId` filter + pagination. `getPatientById`/`getPatients` eager-load the related doctor (id, name, specialization) via the Sequelize association — one query, not N+1.

**Key design decision — `assertDoctorExists()`:** Called on both create and any update that changes `doctorId`. Without this, you could create a patient with `doctorId: 9999` (a nonexistent doctor) and Sequelize/MySQL would only catch it via a raw FK error — this gives a clean 400 with a clear message before it ever reaches the DB.

**Cross-cutting integrity, verified end-to-end:** Creating a patient under Doctor A makes Doctor A's own `DELETE` return 409 (Phase 5's guard fires because the patient now exists). Deleting that patient makes Doctor A deletable again. This proves the two services correctly share the same underlying data-integrity rule instead of each having its own disconnected notion of "is this doctor deletable."

### Phase 9: Dashboard APIs (rework flagged before proceeding)
**What was first built (off assumptions, not the spec):** one combined endpoint returning totals + `doctorsBySpecialization` + `patientsByGender` + recents.
**What the spec actually requires:** 5 separate endpoints — `/overview`, `/patients-per-doctor`, `/patient-trends`, `/conditions`, `/appointments`.
**Why this got caught before Phase 10:** the agent flagged the mismatch itself instead of assuming defaults were correct — this is exactly the review discipline this whole project has been built around. Caught here (before frontend chart-wiring in Phase 17), the fix is a same-day refactor. Caught after Phase 17, it would mean rewriting frontend fetch/Recharts code too.
*(If you're reading this after the Phase 9 rework is complete, update this section with the final 5-endpoint shape and remove this note.)*

### Phase 10: Automated Testing
**What:** Jest + Supertest, 6 suites / 29 tests, `--runInBand` (serial, not parallel — avoids test DB race conditions since tests share one MySQL instance).

**Key testing concepts (know these for interview):**
- **Test DB isolation:** `doctor_tracker_test` is a completely separate database from `doctor_tracker` (dev). `globalSetup.js` creates it and runs real migrations against it before any test runs — tests hit a real MySQL schema, not mocks, so they catch real FK/constraint issues.
- **`resetDb()` between tests:** force-destroys Doctor/Patient/User rows between test cases so tests don't leak state into each other (a patient created in one test doesn't silently affect the next test's counts).
- **Why `auth.ratelimit.test.js` is a separate file:** `express-rate-limit`'s counter is in-memory and keyed by IP within the process — if this test shared a file with other auth tests, earlier requests would count toward the rate limit and cause flaky failures. Isolating it means its own limit-state doesn't interfere with unrelated tests.
- **Idempotent re-runs:** running `npm test` twice in a row works cleanly — migrations use `SequelizeMeta` to track what's already applied, so a second `db:migrate` is a no-op, not an error.
- **No open handles / clean exit:** confirmed the test process actually exits after the suite finishes — an easy mistake is leaving a DB connection pool open, which makes Jest hang waiting for a handle that never closes. This was explicitly verified.

### Phase 16: Appointments (the double-booking constraint problem)

**The setup:** Business rule is "a doctor can't have two appointments at the same date+time" — enforced two ways, same pattern as the Doctor delete guard: a service-layer pre-check (`assertSlotAvailable`, for a clean 409) *and* a DB-level composite unique index on `(doctorId, appointmentDate, appointmentTime)` as the real guarantee against race conditions.

**The subtlety that broke it:** Cancelling an appointment should free up that slot for rebooking — a normal part of the workflow. The service layer's pre-check correctly excludes `Cancelled` appointments when checking availability. But the **raw DB unique index has no concept of status** — to the index, a cancelled row at 2025-01-01 10:00 and a new booking at the same slot are still two rows with the same `(doctorId, date, time)`, so the DB itself rejected the rebooking even though the application logic said it should be allowed.

**The fix — a generated column, not a workaround:**
```sql
-- conceptually:
slot_lock = CASE
  WHEN status = 'Cancelled' OR deletedAt IS NOT NULL THEN NULL
  ELSE 1
END  -- STORED, recomputed automatically whenever status/deletedAt changes
```
Then the unique index becomes 4 columns: `(doctorId, appointmentDate, appointmentTime, slot_lock)`.

**Why this works (the core fact to know cold for interview):** MySQL's unique index treats multiple `NULL` values as **distinct from each other** — they don't violate uniqueness. So:
- Two cancelled/soft-deleted appointments in the same slot → both have `slot_lock = NULL` → no collision, any number of them can coexist.
- Two *active* appointments in the same slot → both have `slot_lock = 1` → **collision, correctly rejected.**
- The DB constraint now perfectly mirrors the business rule, instead of the application having to work around a stricter database.

**Why not just remove the DB constraint and rely on the service-layer check alone?** Because that reintroduces the exact race condition the DB constraint exists to prevent — two near-simultaneous requests could both pass the pre-check before either commits. The generated column keeps the DB as the real source of truth while teaching it the one piece of business logic it needed to know.

**Interview framing:** "আমি প্রথমে assumed করেছিলাম DB constraint আর service-layer check duটাই same rule enforce করছে, কিন্তু test লেখার সময় ধরা পড়ল DB constraint status সম্পর্কে কিছুই জানে না — সেটা শুধু raw column values দেখে। এটা fix করতে আমি constraint টাকেই business-rule-aware বানিয়েছি একটা generated column দিয়ে, বদলে service-layer এ workaround বসিয়ে DB constraint কে bypass করার চেষ্টা না করে।"



```
PORT=                # which port Express listens on
NODE_ENV=             # development | test | production — controls which DB config Sequelize uses
DB_HOST=
DB_PORT=
DB_NAME=              # doctor_tracker (dev) — tests use a separate doctor_tracker_test automatically
DB_USER=
DB_PASSWORD=
JWT_SECRET=           # sign/verify JWTs — never commit, never reuse across projects
JWT_EXPIRES_IN=7d      # e.g. "1d", "7d" — how long a login token stays valid
CORS_ORIGIN=           # the frontend's origin (e.g. http://localhost:3000) — never "*" once auth is involved
ADMIN_EMAIL=           # used only by the seed script to create the first admin
ADMIN_PASSWORD=        # used only by the seed script
```

---

## Part 6 — How to Run Everything Manually (so you can do it yourself, no AI needed)

```bash
# 1. Install dependencies
npm install

# 2. Set up .env (copy from .env.example, fill in real values)
cp .env.example .env

# 3. Run migrations (creates all tables per the migration files)
npx sequelize-cli db:migrate

# 4. Seed the first admin account (reads ADMIN_EMAIL/ADMIN_PASSWORD from .env)
npm run seed:admin

# 5. Start the dev server
npm run dev      # or: node src/server.js

# 6. Run the automated test suite (uses a separate test DB automatically)
npm test

# 7. Undo the last migration if you need to roll back a schema change
npx sequelize-cli db:migrate:undo
```

**Manually testing an endpoint (Postman/curl), example — login:**
```bash
curl -X POST http://localhost:<PORT>/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
```
Response gives you a JWT — use it as `Authorization: Bearer <token>` on every protected route (`/api/auth/me`, `/api/doctors/*`, `/api/patients/*`, `/api/dashboard/*`).

---

## Part 7 — Common Errors & What They Mean

| Error | Meaning | Fix |
|---|---|---|
| `SequelizeForeignKeyConstraintError` | Tried to hard-delete a Doctor with existing Patient rows (or link a Patient to a nonexistent Doctor and somehow bypassed the app-level check) | This should normally be caught earlier by the service-layer guard (409) — if you see the raw DB error, the guard isn't firing; check `doctorService.deleteDoctor` / `patientService.assertDoctorExists` |
| `401 Unauthorized` on a protected route | Missing/invalid/expired JWT | Re-login, check `Authorization: Bearer <token>` header is present |
| `429 Too Many Requests` on login | Rate limiter threshold hit (10 attempts / 15 min) | Wait out the window, or during dev testing, restart the server to reset the in-memory counter |
| Jest hangs / "open handle" warning | A DB connection pool wasn't closed after tests | Check `globalTeardown` / `afterAll` closes the Sequelize connection |
| Migration fails on a fresh clone | `.env` not set up, or `doctor_tracker`/`doctor_tracker_test` DB doesn't exist yet | Create the DB manually first (`CREATE DATABASE doctor_tracker;`), then run `db:migrate` |

---

## Part 8 — Interview Cheat-Sheet (Quick Answers)

- **"Why layered architecture?"** → Single responsibility per layer, easier to test services in isolation, changing one layer (e.g. swapping REST for GraphQL) doesn't force rewriting business logic.
- **"Why migrations instead of sync()?"** → Version-controlled, reviewable, reproducible schema changes; `sync()` can silently alter/drop data in production.
- **"Why RESTRICT instead of CASCADE?"** → Healthcare data must never cascade-delete; DB-level guarantee against accidental data loss, backed up by an application-level check for good UX.
- **"Why soft delete (paranoid)?"** → Audit trail + recoverability; a "delete" in an admin panel is often a mistake waiting to happen.
- **"Why JWT over sessions?"** → Stateless, no server-side session store needed for a single-admin internal tool; trade-off is no instant token revocation, which is an acceptable trade-off at this scale.
- **"How do you know your API is correct?"** → 29 automated tests across 6 suites, run against a real (isolated) test database, verifying both success paths and edge cases (404s, validation errors, cross-model integrity).
- **"What was your biggest process discipline moment?"** → Catching the Phase 9 dashboard endpoints not matching the spec *before* building frontend charts against them — cheap fix caught early vs. expensive fix caught late.

---

## Log

| Date | Note |
|---|---|
| 2026-09-04 | Initial full documentation written, covering Phases 1–10. Update Part 4's Phase 9 section once the dashboard rework (5 spec-aligned endpoints) is verified. |

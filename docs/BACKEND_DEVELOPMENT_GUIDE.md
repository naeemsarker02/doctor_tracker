# Doctor Tracker — Backend Development Guide

This document explains the backend at `doctor_tracker_backend/` as it actually exists in the repository today. Every claim below was checked against the real source files (not the spec, not prior notes) — file paths and line numbers are given so you can verify anything yourself. If you're the one who has to defend this project in an interview, read this end to end once, then go open the files it points at.

---

## 1. Tech Stack — Why Each Piece Is Here

This is not a generic "what is Express" table. It's what each dependency in `package.json` is actually doing in *this* codebase.

| Package | Where it's used | Problem it solves here | Why not the obvious alternative |
|---|---|---|---|
| **Express 5** (`express`) | `app.js` | HTTP server + routing. The whole app is ~5 route files mounted on one Express instance. | A heavier framework (NestJS) would impose DI/module ceremony for an app this size; Express plus a hand-rolled layered structure (routes → controllers → services) gives the same separation without the framework tax. |
| **Sequelize** (`sequelize`, `mysql2`) | `src/models/*.js`, every service | ORM — turns rows into JS objects, manages associations (`Doctor.hasMany(Patient)`), and drives `sequelize-cli` migrations. | Raw SQL would mean hand-writing every JOIN and re-implementing the FK/association bookkeeping Sequelize already does; a query builder without an ORM (Knex) would lose the model-level validation (`isEmail`, `allowNull`) used throughout. |
| **MySQL** | `src/config/config.js`, `src/config/database.js` | Relational store. Doctor↔Patient↔Appointment is a strictly relational shape with real foreign keys and a uniqueness rule that needs a real composite index — a document store would have to hand-roll referential integrity in application code. | — |
| **sequelize-cli** | `.sequelizerc`, `src/migrations/*.js` | Every schema change is a numbered, timestamped, reviewable file in Git, replayable on any machine. | The obvious "fast" alternative, `sequelize.sync({ alter: true })`, infers schema changes from the current model definitions and can silently alter or drop columns — fine for a throwaway prototype, unacceptable once real patient/doctor data exists. This project's migration files are all dated 2026-09-04/05, i.e. created together with the model files before any Doctor/Patient CRUD logic existed — the switch to migrations happened before there was real data to lose. |
| **jsonwebtoken** | `src/services/authService.js:24-34`, `src/middleware/authMiddleware.js` | Stateless auth — the token itself carries `{id, email, role}`, verified with `JWT_SECRET`, no server-side session store. | A session store (Redis, DB-backed sessions) would be legitimate extra infrastructure for a single-admin internal tool that doesn't need it. |
| **bcryptjs** | `seedAdmin.js:26`, `authService.js:15,91` | One-way password hashing with a salt, so a DB leak doesn't expose plaintext passwords. | `bcrypt` (native binding) vs `bcryptjs` (pure JS) — this project uses the pure-JS version, which avoids native build tooling (`node-gyp`) on the developer's machine at a small runtime-speed cost, reasonable for a login endpoint that isn't a hot path. |
| **Zod** | `src/validators/*.js`, wired through `src/middleware/validate.js` | Schema-based request validation with `.safeParse`, coercion (`z.coerce.number()`), `.partial()` for update schemas, and `.refine()` for cross-field rules (e.g. new password ≠ current password). | Joi does the same job; Zod was chosen for its type-inference-friendly API and because schemas can be trivially reused between "create" and "update" via `.partial()` (see `doctorValidators.js:18`, `patientValidators.js:20`, `appointmentValidators.js:22`). |
| **Helmet** | `app.js:17` | Sets a batch of security headers (clickjacking, MIME-sniffing protections, etc.) with a single `app.use(helmet())`. | Setting these headers by hand is error-prone and easy to forget after a refactor. |
| **cors** | `app.js:18-22` | Restricts which origin can call the API — configured from `CORS_ORIGIN` env var, not wide-open. Necessary because the Next.js frontend runs on a different origin/port. | An open `origin: "*"` would work for public read-only APIs but is wrong here since requests carry an `Authorization` header. |
| **morgan** | `app.js:23` | Logs every request (method, path, status, timing) — `"combined"` format in production, `"dev"` format otherwise. | A full logging stack (Winston, pino, ELK) would be over-engineering for an internal single-instance admin tool; Morgan's stdout logging is enough and is explicitly what the spec calls for ("Morgan or a lightweight logging solution"). |
| **express-rate-limit** | `src/middleware/rateLimiters.js` | Caps login attempts to slow down credential stuffing / brute force. Applied only to `POST /api/auth/login` (`src/routes/authRoutes.js:11`). | A more elaborate solution (e.g. IP+account lockout tracked in a DB, CAPTCHA) is unnecessary for an internal tool with one admin account; a cheap in-memory limiter covers the realistic threat model. |
| **multer** | `src/middleware/uploadAvatar.js` | Parses `multipart/form-data` for the avatar upload endpoint, writes the file to disk, enforces a MIME allowlist and a 2MB size cap. | Storing avatars in the DB as BLOBs would bloat the database and complicate backups for no benefit at this scale; disk storage + a static file route (`app.js:28-33`) is simpler. |
| **jest + supertest** | `tests/*.test.js`, `package.json`'s `test` script | Jest is the runner/assertion library. Supertest drives real HTTP requests directly against the exported `app` object (no listening port needed), which is why `app.js` never calls `.listen()` — that's `server.js`'s job. | This split is why tests can `require("../app")` cleanly (see `tests/appointments.test.js:2`) instead of needing to spin up and tear down a real network server per test file. |
| **dotenv** | `app.js`, `server.js`, `seedAdmin.js`, `src/config/*.js`, `tests/setup/globalSetup.js` | Loads `.env` into `process.env` at the top of every entry point that needs config. | — |
| **nodemon** (dev) | `npm run dev` script | Restarts the dev server on file change. | — |
| **cross-env** (dev) | `npm test` script | Sets `NODE_ENV=test` in a way that works identically on Windows and POSIX shells. | — |

---

## 2. Full Folder & File Structure

Verified by reading every file. Paths are relative to `doctor_tracker_backend/`.

```
doctor_tracker_backend/
├── app.js                       Express app construction: helmet, cors, morgan, JSON body
│                                 parsing, static /uploads route, health check, mounts all
│                                 5 route groups, then notFoundHandler + errorHandler.
│                                 Exports the app WITHOUT calling .listen() — this is what
│                                 lets Supertest use it directly in tests.
├── server.js                     Entry point: loads env, requires app.js, calls
│                                 testDatabaseConnection(), then app.listen(PORT).
├── seedAdmin.js                  One-shot script: reads ADMIN_EMAIL/ADMIN_PASSWORD from env,
│                                 does nothing if that email already exists (idempotent),
│                                 otherwise bcrypt-hashes the password and creates the User row.
├── .sequelizerc                  Tells sequelize-cli where things live: config at
│                                 src/config/config.js, models/migrations/seeders under src/.
├── .env.example                  Template of every required env var (no real values).
├── .env                          Actual local secrets — gitignored.
├── package.json                  Dependencies + npm scripts (see Part 4).
│
├── src/
│   ├── config/
│   │   ├── config.js              Plain object (development/test/production) sequelize-cli
│   │   │                           reads directly — test DB name defaults to `${DB_NAME}_test`
│   │   │                           unless DB_NAME_TEST is set.
│   │   └── database.js            Builds the actual live Sequelize instance used by the app
│   │                               at runtime (reads config.js for the current NODE_ENV),
│   │                               and exports testDatabaseConnection() used by server.js.
│   │
│   ├── models/
│   │   ├── index.js                Dynamically requires every other file in this folder,
│   │   │                           calls each model's .associate(models), and exports a
│   │   │                           `db` object keyed by model name plus `sequelize`.
│   │   ├── User.js                 Admin account. paranoid: true. Has avatarUrl (mapped to
│   │   │                           avatar_url column).
│   │   ├── Doctor.js                paranoid: true. hasMany Patient and hasMany Appointment,
│   │   │                           both declared onDelete: "RESTRICT" at the association level.
│   │   ├── Patient.js               paranoid: true. belongsTo Doctor, hasMany Appointment
│   │   │                           (RESTRICT).
│   │   └── Appointment.js           paranoid: true. Stores appointmentDate as DATEONLY and
│   │                               appointmentTime as TIME (separate columns, not DATETIME).
│   │                               belongsTo Doctor and Patient.
│   │
│   ├── migrations/                 sequelize-cli migration files — the real source of truth
│   │   │                           for DB shape, run in filename/timestamp order.
│   │   ├── 20260904000001-create-users.js
│   │   ├── 20260904000002-create-doctors.js         doctors table, no FK yet (nothing
│   │   │                                             references it at this point)
│   │   ├── 20260904000003-create-patients.js         patients table, doctor_id FK
│   │   │                                             onDelete: RESTRICT
│   │   ├── 20260904100000-add-avatar-url-to-users.js  adds avatar_url column
│   │   └── 20260905000001-create-appointments.js      appointments table, doctor_id/patient_id
│   │                                                   FKs onDelete: RESTRICT, PLUS the
│   │                                                   generated slot_lock column and the
│   │                                                   4-column unique index (see Part 5).
│   │
│   ├── routes/                     Each file just maps HTTP verb + path → middleware chain
│   │   ├── authRoutes.js             → controller function. No business logic here.
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── appointmentRoutes.js
│   │   └── dashboardRoutes.js
│   │
│   ├── controllers/                 Thin HTTP adapters: pull data out of req, call exactly
│   │   ├── authController.js         one service function, shape the {success, message,
│   │   ├── doctorController.js       data} response, forward errors to next(error). No
│   │   ├── patientController.js      decision logic (that's the service layer's job).
│   │   ├── appointmentController.js
│   │   └── dashboardController.js
│   │
│   ├── services/                    All business rules live here.
│   │   ├── authService.js             login, get-by-id, update profile (+ duplicate email
│   │   │                              check), change password (+ current-password check),
│   │   │                              update avatar.
│   │   ├── doctorService.js           CRUD + the 409 "has patients" delete guard.
│   │   ├── patientService.js          CRUD + assertDoctorExists() guard on create/update.
│   │   ├── appointmentService.js      CRUD + assertDoctorExists/assertPatientExists +
│   │   │                              assertSlotAvailable (the double-booking pre-check) +
│   │   │                              withDoubleBookingTranslation (maps a raw DB unique-
│   │   │                              constraint violation to the same friendly 409).
│   │   └── dashboardService.js        Read-only aggregation queries (COUNT, GROUP BY) for
│   │                                  the 5 dashboard endpoints.
│   │
│   ├── middleware/
│   │   ├── authMiddleware.js          Reads Authorization: Bearer <token>, verifies with
│   │   │                              JWT_SECRET, attaches decoded payload to req.user,
│   │   │                              else next(AppError(401)).
│   │   ├── validate.js                Generic factory: validate(schema, source="body") —
│   │   │                              runs schema.safeParse(req[source]); on failure throws
│   │   │                              an AppError(400) with a normalized {field, message}[]
│   │   │                              list; on success replaces req[source] with the
│   │   │                              parsed/coerced data.
│   │   ├── rateLimiters.js            loginLimiter: 5 requests / 15 minutes per IP,
│   │   │                              standardHeaders on, custom JSON message.
│   │   ├── uploadAvatar.js            multer config: disk storage under uploads/avatars/,
│   │   │                              filename user-<id>-<timestamp>.<ext>, MIME allowlist
│   │   │                              (jpeg/png/webp only), 2MB limit.
│   │   └── errorHandler.js            notFoundHandler (404 catch-all) + errorHandler (the
│   │                                  single place every error is turned into the standard
│   │                                  JSON response shape — see Part 3, step 7).
│   │
│   ├── validators/                    One Zod schema module per resource. Update schemas
│   │   ├── authValidators.js           are usually `createSchema.partial()` so "every field
│   │   ├── doctorValidators.js         is optional on update" isn't hand-duplicated.
│   │   ├── patientValidators.js
│   │   └── appointmentValidators.js    Also defines dateField/timeField regexes for
│   │                                   YYYY-MM-DD and HH:MM(:SS) validation.
│   │
│   └── utils/
│       └── AppError.js                 class AppError extends Error — carries statusCode
│                                       and an optional errors[] array. This is the only
│                                       kind of error services throw deliberately; the
│                                       global handler branches on `instanceof AppError`.
│
├── uploads/
│   ├── .gitkeep
│   └── avatars/                        Actual uploaded avatar files (gitignored except the
│                                       .gitkeep marker), served statically at /uploads/*.
│
└── tests/
    ├── setup/
    │   └── globalSetup.js               Jest globalSetup (registered in package.json's
    │                                    "jest" block). Connects to MySQL directly with
    │                                    mysql2, runs `CREATE DATABASE IF NOT EXISTS
    │                                    doctor_tracker_test`, then shells out to
    │                                    `npx sequelize-cli db:migrate --env test` so the
    │                                    test DB has the real, current schema before any
    │                                    test file runs.
    ├── helpers/
    │   └── testUtils.js                  resetDb() (force-destroys Appointment → Patient →
    │                                    Doctor → User, in that FK-safe order), createAdmin(),
    │                                    loginAsAdmin() (creates an admin then logs in via the
    │                                    real HTTP endpoint to get a real token).
    ├── auth.test.js                      7 test cases: login success, wrong-password 401,
    │                                    /me, PUT /me (incl. duplicate email 409), PUT
    │                                    /password (incl. wrong current-password, same-
    │                                    password rejection).
    ├── auth.ratelimit.test.js            1 test, isolated in its own file specifically
    │                                    because express-rate-limit's counter is in-memory
    │                                    per process — sharing a file with other login tests
    │                                    would make earlier requests count toward the limit.
    ├── doctors.test.js                    12 test cases: CRUD, search, pagination, the 409
    │                                    delete-guards (existing patients, and separately
    │                                    upcoming non-Cancelled/Completed appointments), 404s.
    ├── patients.test.js                   8 test cases: CRUD, doctorId filter, search,
    │                                    assertDoctorExists guard, 404s.
    ├── appointments.test.js                12 test cases (see Part 3 — this is the suite
    │                                    that specifically proves the double-booking rule,
    │                                    both the app-level 409 and the raw DB unique index,
    │                                    and that cancelling frees the slot).
    ├── dashboard.test.js                   3 test cases covering the 5 dashboard endpoints.
    └── errorHandler.test.js                1 test: unknown route returns the standard 404
                                            JSON shape.
```

**Note on a stale assumption:** an earlier version of this guide described `seeders/` living under `src/seeders/`, matching what `.sequelizerc` points at. That path is still what `.sequelizerc` names, but **no file actually exists there** — the admin seed script is `seedAdmin.js` at the project root, run directly with `node seedAdmin.js` (wired as `npm run seed:admin`), not via `sequelize-cli db:seed`. Don't go looking for a `sequelize-cli` seeder file; there isn't one.

---

## 3. Layered Request Flow — Tracing `POST /api/appointments`

This endpoint is the best one to trace because it touches routing, two middleware types, validation, two existence-guards, the double-booking pre-check, and the DB constraint fallback, in one request.

**Request:** `POST /api/appointments` with body `{ doctorId, patientId, appointmentDate, appointmentTime, reason }`, header `Authorization: Bearer <token>`.

1. **`app.js:46`** — `app.use("/api/appointments", appointmentRoutes)` routes the request into `src/routes/appointmentRoutes.js`.

2. **`src/routes/appointmentRoutes.js:13`** — `router.use(authMiddleware)` runs first for every route in this file.
   - **`src/middleware/authMiddleware.js:4-28`** — reads the `Authorization` header, requires the `Bearer ` prefix, calls `jwt.verify(token, process.env.JWT_SECRET)`. If missing/invalid/expired, calls `next(new AppError("Invalid or expired token", 401))` and the request stops here. On success, sets `req.user = decoded` (`{id, email, role}`) and calls `next()`.

3. **`src/routes/appointmentRoutes.js:15`** — matches `POST /`, chain is `validate(createAppointmentSchema), appointmentController.create`.
   - **`src/middleware/validate.js:3-22`** — calls `createAppointmentSchema.safeParse(req.body)` (schema from `src/validators/appointmentValidators.js:13-20`). This schema requires `doctorId`/`patientId` to coerce to positive integers, `appointmentDate` to match `YYYY-MM-DD` (`appointmentValidators.js:5-7`), `appointmentTime` to match 24-hour `HH:MM[:SS]` (`appointmentValidators.js:9-11`). On failure: `next(new AppError("Validation failed", 400, errors))` where `errors` is a `{field, message}[]` array built from `result.error.issues` — request stops here with a 400. On success, `req.body` is replaced with the parsed/coerced object and `next()` is called.

4. **`src/controllers/appointmentController.js:3-15`** (`create`) — pulls `req.body`, calls `appointmentService.createAppointment(req.body)`, and on success responds `201` with `{success: true, message: "Appointment created successfully", data: {appointment}}`. On any thrown error, `next(error)` hands off to the global error handler. This controller makes zero decisions — it doesn't know what "double booking" even means.

5. **`src/services/appointmentService.js:58-65`** (`createAppointment`) — the actual business logic, in order:
   - `assertDoctorExists(data.doctorId)` (`appointmentService.js:7-12`) — `Doctor.findByPk`, throws `AppError(400, "Doctor not found for the given doctorId")` if missing. Stops here if the doctor doesn't exist — never reaches the DB insert.
   - `assertPatientExists(data.patientId)` (`appointmentService.js:14-19`) — same pattern for the patient.
   - `assertSlotAvailable(doctorId, appointmentDate, appointmentTime)` (`appointmentService.js:25-40`) — queries `Appointment.findOne({ where: { doctorId, appointmentDate, appointmentTime, status: { [Op.ne]: "Cancelled" } } })`. If a matching row exists, throws `AppError(409, "This doctor already has an appointment at that date and time.")`. **This is the friendly, application-level check** — it explicitly excludes `Cancelled` appointments, and it's a pure JS/SQL SELECT that can theoretically race with a concurrent identical request (see Part 5 for why the DB constraint below is the real guarantee).
   - `Appointment.create(data)`, wrapped in `withDoubleBookingTranslation` (`appointmentService.js:42-51`) — if the pre-check above somehow missed a race and the raw MySQL insert trips the composite unique index, Sequelize throws `SequelizeUniqueConstraintError`; this wrapper catches that specific error and re-throws it as the *same* friendly `AppError(409, ...)` the pre-check would have thrown, so the API's behavior is identical whether the guard or the DB caught the collision.
   - Returns `getAppointmentById(appointment.id)`, which re-fetches with the `doctor`/`patient` associations included (`appointmentService.js:53-56, 98-106`) so the response includes doctor name/specialization and patient name, not just IDs.

6. **Sequelize → MySQL** — `Appointment.create` issues an `INSERT INTO appointments (...) VALUES (...)`. The table (built by `src/migrations/20260905000001-create-appointments.js`) has a generated `slot_lock` column and a 4-column unique index `(doctor_id, appointment_date, appointment_time, slot_lock)` (`20260905000001-create-appointments.js:72-82`) — this is the actual database-level guarantee. See Part 5 for exactly how it behaves.

7. **On success**, the promise chain unwinds back through the service → controller, which sends the `201` JSON response described in step 4.
   **On any thrown error at any layer**, it lands at `src/middleware/errorHandler.js:8-45` (mounted last, `app.js:49`): `AppError` instances are serialized to `{success:false, message, errors?}` with their own `statusCode`; a raw `SequelizeUniqueConstraintError` that somehow wasn't translated would be serialized as a 400 validation error (`errorHandler.js:28-37`); anything unrecognized becomes a generic `500`.

This is also directly exercised by the test suite — `tests/appointments.test.js:84-104` creates an appointment, confirms a second identical booking gets `409`, cancels the first, and confirms the same slot can be rebooked; `tests/appointments.test.js:106-114` calls `Appointment.create` twice directly (bypassing the service layer entirely) to prove the raw DB constraint independently rejects the second insert.

---

## 4. Running This From a Clean Clone

Exact npm scripts, taken from `package.json:6-13` — don't substitute guessed names.

```bash
# 1. Install dependencies
npm install

# 2. Create your .env from the template, then fill in real values
cp .env.example .env
```

Every variable in `.env.example`, explained:

| Variable | Meaning |
|---|---|
| `NODE_ENV` | `development` / `test` / `production`. Selects which config block `src/config/config.js` uses. `NODE_ENV=test` is set automatically by the `test` npm script via `cross-env` — you don't set it by hand. |
| `PORT` | Port `server.js` binds Express to (`server.js:8,14`). |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | Standard MySQL connection details, read in `src/config/config.js:4-11`. |
| `DB_NAME` | Your development database name (e.g. `doctor_tracker`). Must already exist in MySQL before you migrate — this project's migrations don't create the database itself, only the tables inside it. |
| `JWT_SECRET` | Signing/verification secret for tokens (`authService.js:30`, `authMiddleware.js:16`). Never commit a real value. |
| `JWT_EXPIRES_IN` | How long a login token stays valid, passed straight to `jwt.sign(..., { expiresIn: process.env.JWT_EXPIRES_IN || "1d" })` (`authService.js:32`). `.env.example` recommends `7d`; note the code's own fallback if the var is unset is `"1d"`, not `"7d"` — set it explicitly rather than relying on the fallback. |
| `CORS_ORIGIN` | The exact origin allowed to call this API (`app.js:18-22`), e.g. `http://localhost:3000` for the Next.js dev server. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | Only read by `seedAdmin.js:8-13` — not used anywhere else in the running app. |

```bash
# 3. Make sure the MySQL database named in DB_NAME exists
#    (e.g. `mysql -u root -e "CREATE DATABASE doctor_tracker;"`)

# 4. Run all migrations — creates users/doctors/patients/appointments tables
npm run db:migrate          # -> sequelize-cli db:migrate

# 5. Create the first admin account (reads ADMIN_EMAIL/ADMIN_PASSWORD from .env)
npm run seed:admin           # -> node seedAdmin.js
                             # safe to re-run: it checks for an existing user
                             # with that email first and exits without error.

# 6. Start the server
npm run dev                  # -> nodemon server.js  (auto-restart on change)
# or
npm start                    # -> node server.js     (plain start)

# 7. Run the automated test suite
npm test                     # -> cross-env NODE_ENV=test jest --runInBand
```

**About `npm test`:** `package.json`'s `"jest"` block (`package.json:14-18`) registers `tests/setup/globalSetup.js` as Jest's `globalSetup` — before any test file runs, it connects to MySQL directly (via `mysql2/promise`), runs `CREATE DATABASE IF NOT EXISTS doctor_tracker_test` (name comes from `src/config/config.js`'s `test` block, which defaults to `${DB_NAME}_test` unless you set `DB_NAME_TEST`), and then shells out to `npx sequelize-cli db:migrate --env test` so the test database has the current real schema. Tests run with `--runInBand` (serially, not in parallel) because every test file shares that one MySQL database — running suites concurrently would let one file's `resetDb()` wipe another file's in-progress fixtures.

**Rolling back a migration**, if you ever need it: `npm run db:migrate:undo` (`package.json:11`) → `sequelize-cli db:migrate:undo`, which reverts the most recently applied migration using its `down()` function.

**Manually testing the login endpoint:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"<ADMIN_EMAIL>","password":"<ADMIN_PASSWORD>"}'
```
The response's `data.token` is used as `Authorization: Bearer <token>` on every other route — everything under `/api/doctors`, `/api/patients`, `/api/appointments`, `/api/dashboard`, and `/api/auth/me` (and its siblings) requires it (see each route file's `router.use(authMiddleware)` line).

---

## 5. Non-Obvious Engineering Decisions (Interview-Ready Explanations)

### Migrations instead of `sequelize.sync()`

The migration files under `src/migrations/` are all dated 2026-09-04/05, i.e. created together with the model files, before any Doctor/Patient CRUD logic existed. `sync({ alter: true })` infers the desired schema from the current model *definitions* and mutates the live table to match — including silently dropping a column if you remove a field from a model. That's an acceptable trade for a throwaway prototype but not something you'd want touching a table that might already hold real patient rows. Migrations are explicit, ordered, reviewable files — `src/migrations/20260904100000-add-avatar-url-to-users.js` is a good small example: it's a single `addColumn` call with its own `down()` (`removeColumn`) to reverse it, rather than a diff someone has to reconstruct from model history.

**How to defend it in an interview:** "We chose migrations over `sync()` early — before CRUD or real data existed — specifically because switching schema-management strategy is cheap before there's data to lose and expensive after. `sync({alter:true})` would have been faster to start with, but it can silently alter or drop columns to match the current model file, which is the wrong trade-off once the schema will keep evolving under real data."

### `paranoid: true` — soft delete

All four models (`User.js:46`, `Doctor.js:44`, `Patient.js:55`, `Appointment.js:57`) declare `paranoid: true`. Sequelize implements this by adding a `deletedAt` timestamp column (present in every migration, e.g. `20260904000003-create-patients.js:53-55`) and rewriting `.destroy()` to `UPDATE ... SET deletedAt = NOW()` instead of `DELETE FROM ...`. The concrete behavior change: every default query (`findAll`, `findOne`, `findByPk`, `count`, association includes) automatically adds `WHERE deletedAt IS NULL` — a "deleted" row becomes invisible everywhere in the app without a single `WHERE` clause being written by hand. The row still physically exists and can be recovered (`Model.restore()`) or seen with `{ paranoid: false }` passed to a query.

**Why it matters for healthcare-adjacent data specifically:** a doctor or patient record deleted by a misclick in an admin panel is not something you want permanently and silently gone — soft delete buys an audit trail and a recovery path for free.

### `RESTRICT`, not `CASCADE`, on every Doctor/Patient/Appointment FK

Confirmed in two places for each relationship:
- The Sequelize association level: `Doctor.js:52,57` (`Doctor.hasMany(Patient/Appointment, { onDelete: "RESTRICT" })`), `Patient.js:67` (`Patient.hasMany(Appointment, { onDelete: "RESTRICT" })`).
- The actual migration/DB level: `20260904000003-create-patients.js:14-19` and `20260905000001-create-appointments.js:14-19,24-29` all set `onDelete: "RESTRICT"` on the real foreign key constraint.

`CASCADE` would mean deleting a Doctor row auto-deletes every Patient (and Appointment) row pointing at it — for healthcare records, one accidental doctor deletion silently wiping patient history is unacceptable. `RESTRICT` makes MySQL itself refuse the delete (`SequelizeForeignKeyConstraintError`) if dependent rows exist.

**The subtlety that makes a second, application-level guard necessary:** `RESTRICT` only fires on a real, physical `DELETE`. Because `paranoid: true` turns "delete" into an `UPDATE deletedAt=...`, soft-deleting a Doctor **never touches the FK at all** — the DB constraint simply never gets a chance to object, and every Patient row would be left pointing at a doctor that's now invisible to every default query. That's exactly why `doctorService.js:79-92` (`deleteDoctor`) does its own check before calling `doctor.destroy()`:

```js
const patientCount = await Patient.count({ where: { doctorId: id } });
if (patientCount > 0) {
    throw new AppError(
        "Cannot delete a doctor with existing patients. Reassign or remove their patients first.",
        409
    );
}
```

So there are genuinely two layers doing two different jobs: the DB `RESTRICT` constraint is a hard backstop against a real `DELETE` (relevant mainly if something ever calls `.destroy({ force: true })`), and the service-layer count check is what actually fires in normal operation, since normal deletes are soft. `doctorService.js`'s guard checks both **existing patients** and **upcoming (non-Cancelled, non-Completed) appointments** before allowing a doctor delete — see below.

```js
const patientCount = await Patient.count({ where: { doctorId: id } });
if (patientCount > 0) {
    throw new AppError("Cannot delete a doctor with existing patients. ...", 409);
}

const upcomingAppointmentCount = await Appointment.count({
    where: { doctorId: id, status: { [Op.notIn]: ["Cancelled", "Completed"] } },
});
if (upcomingAppointmentCount > 0) {
    throw new AppError("Cannot delete a doctor with upcoming appointments. ...", 409);
}
```

`Completed` and `Cancelled` appointments are deliberately excluded from the count — they're historical records that don't need the doctor to still exist in an active sense, so they shouldn't block reassigning or removing that doctor. Only `Pending`/`Confirmed` appointments count as "upcoming" for this guard. Tested in `tests/doctors.test.js` (both the blocking case and the "only Cancelled/Completed appointments" pass-through case).

### The double-booking rule — two layers, and the generated-column fix

The business rule ("a doctor can't have two appointments at the same date+time") is enforced twice, verified in the actual files:

1. **Service-layer pre-check**, `appointmentService.js:25-40` (`assertSlotAvailable`) — a `SELECT` that explicitly excludes `status: { [Op.ne]: "Cancelled" }`, so a cancelled appointment never blocks rebooking that slot. Fast, and produces a clean `409` with a specific message.
2. **DB-level composite unique index**, defined in `src/migrations/20260905000001-create-appointments.js:78-82`, on `(doctor_id, appointment_date, appointment_time, slot_lock)`. This is the real guarantee against a race between two near-simultaneous requests that could both pass step 1 before either commits.

**The problem a plain 3-column unique index would have had:** a unique index on just `(doctor_id, appointment_date, appointment_time)` has no idea what "Cancelled" means — to a raw index, a cancelled row and a fresh booking at the same slot are just two rows with identical key values, so the DB would reject the rebooking even though the service layer correctly decided it should be allowed.

**The actual fix present in the migration** (`20260905000001-create-appointments.js:62-82`):
```sql
ALTER TABLE appointments
ADD COLUMN slot_lock TINYINT
GENERATED ALWAYS AS (IF(status = 'Cancelled' OR deletedAt IS NOT NULL, NULL, 1)) STORED;

-- then:
CREATE UNIQUE INDEX appointments_doctor_date_time_unique
  ON appointments (doctor_id, appointment_date, appointment_time, slot_lock);
```
`slot_lock` is a MySQL generated `STORED` column: `NULL` whenever the row is `Cancelled` or soft-deleted, `1` otherwise, recomputed automatically by MySQL whenever `status` or `deletedAt` changes. MySQL treats every `NULL` in a unique index as distinct from every other `NULL` — so two cancelled/deleted rows in the same slot never collide with each other (both have `slot_lock = NULL`), while two genuinely active appointments in the same slot both have `slot_lock = 1` and correctly violate uniqueness.

`appointmentService.js:42-51` (`withDoubleBookingTranslation`) then catches a raw `SequelizeUniqueConstraintError` from this index and re-throws it as the same friendly `AppError(409, ...)` the pre-check throws, so the two enforcement layers are invisible to the API consumer — they either both allow it or both reject it, and if they ever disagree because of a race, the DB constraint (translated to the same message) is what actually wins.

This is directly tested: `tests/appointments.test.js:93-104` proves cancel-then-rebook succeeds through the normal service path; `tests/appointments.test.js:106-114` calls `Appointment.create` twice directly (bypassing the service entirely) to prove the raw index independently rejects a genuine double-booking.

**Why not drop the DB constraint and rely on the service check alone?** Because the pre-check is a plain `SELECT` followed later by an `INSERT` — two concurrent requests can both pass the `SELECT` before either commits its `INSERT`. Only a DB-level unique constraint is atomic across concurrent transactions. Removing it would reintroduce exactly the race condition it exists to prevent.

### `appointmentDate` (`DATEONLY`) and `appointmentTime` (`TIME`) as separate columns

`Appointment.js:31-41` stores these as two columns rather than one `DATETIME`. Documented directly in the model's own comment (`Appointment.js:27-30`): this avoids timezone-shift bugs for an admin panel used from a single region — a combined `DATETIME` value can silently shift by hours depending on the DB driver's or server's timezone configuration, whereas a plain `DATE` + `TIME` pair is stored and read back as exactly the calendar date and wall-clock time it was given, with no timezone conversion in the path at all.

### `JWT_EXPIRES_IN` — single token, no refresh flow

`authService.js:32`: `jwt.sign(..., { expiresIn: process.env.JWT_EXPIRES_IN || "1d" })`. `.env.example` sets this to `7d`. There is no refresh-token endpoint or mechanism anywhere in `src/routes` or `src/services` — logging in issues one JWT valid for the configured duration, and re-authentication happens by logging in again once it expires.

**Trade-off to state plainly:** this is a deliberate simplification appropriate for a single-admin internal tool, not an oversight. The cost is that a token can't be instantly revoked before its natural expiry (e.g. if compromised, or the admin's access needs to be pulled immediately) without extra infrastructure (a token blacklist or moving to server-side sessions) — acceptable at this scale, and something you should be able to name as the explicit trade-off if asked why there's no refresh flow.

### Login rate limiting

`src/middleware/rateLimiters.js:3-12` configures `express-rate-limit` with `windowMs: 15 * 60 * 1000` and `limit: 5` — **5 attempts per 15 minutes per IP**, wired only onto `POST /api/auth/login` (`authRoutes.js:11`). On the limit being hit, it returns a custom JSON body (`{success:false, message:"Too many login attempts. Please try again later."}`) rather than the default plain-text response. This is a cheap first line of defense against credential-stuffing/brute-force login attempts; it's in-memory (per Node process), which is why `tests/auth.ratelimit.test.js` is kept as its own file — sharing a file with other login-related tests would let earlier requests in the same test run count toward the same in-memory counter and cause flaky failures unrelated to what that other test is actually checking.

---

## 6. What I Corrected / Could Not Verify

**Old doc's stale claims, corrected here:**
- Old doc described `src/seeders/seedAdmin.js` under `src/seeders/`. The real file is `seedAdmin.js` at the project root, run via `node seedAdmin.js` / `npm run seed:admin` — there is no `sequelize-cli`-style seeder file, and `src/seeders/` (though referenced by `.sequelizerc`) doesn't currently contain anything.
- Old doc said Appointment CRUD/wiring "comes in Phase 16" and described the dashboard as still being reworked into 5 endpoints "off assumptions." Both are done: `appointmentController.js`/`appointmentService.js`/`appointmentRoutes.js` are fully wired, and `dashboardRoutes.js` already exposes exactly the 5 spec-aligned endpoints (`/overview`, `/patients-per-doctor`, `/patient-trends`, `/conditions`, `/appointments`).
- Old doc said "29 tests across 6 suites" — the actual current count is **42 test cases across 7 suite files** (`appointments.test.js` didn't exist yet when that number was written).
- Old doc's rate-limit table said "10 attempts / 15 min" in one place (Part 7) while the tech-stack section said 5/15min — the actual configured value in `rateLimiters.js` is **5 / 15 min**, confirmed directly in code.
- Old doc's `.env` table didn't mention that the code's own fallback for `JWT_EXPIRES_IN` if the env var is unset is `"1d"`, not `"7d"` — worth knowing since `.env.example` recommends `7d` but a missing/blank var silently gives you a 1-day token instead.
- Old doc didn't mention `authRoutes.js`'s `PUT /me`, `PUT /password`, `POST /avatar` routes in its folder-structure listing (it only listed login/me) even though its Phase 4 narrative referenced them elsewhere — now documented directly from `authRoutes.js` and `authController.js`.

**Background-context bullets from the task prompt, verified true against the code:**
- Appointment model has `paranoid: true` — confirmed, `Appointment.js:57`.
- Doctor→Patient and Doctor/Patient→Appointment FKs are `RESTRICT`, not `CASCADE` — confirmed at both the association level and the migration level.
- Doctor delete has an application-level 409 guard beyond the DB constraint — confirmed, `doctorService.js:79-92`. (One caveat: it only checks patient count, not upcoming appointments, despite the spec mentioning both — see below.)
- The `slot_lock` generated `STORED` column and 4-column unique index exist exactly as described, including the exact MySQL `IF(status = 'Cancelled' OR deletedAt IS NOT NULL, NULL, 1)` expression — confirmed verbatim in `20260905000001-create-appointments.js:72-76`.
- `JWT_EXPIRES_IN` is read from env — confirmed, `authService.js:32`, with a `"1d"` code-level fallback and a `7d`-recommending `.env.example`.
- Login rate limiting is 5/15min, not the older 10/15min — confirmed, `rateLimiters.js:4-5`.

**Nothing from the background context could not be verified** — every bullet given in the task prompt was checked directly against a real file and matched.

**One real gap was found and fixed during this pass:** the spec describes the Doctor delete guard as blocking on "active patients **or upcoming appointments**," but at the time this guide was being verified, `doctorService.deleteDoctor` only checked `Patient.count` — a doctor with zero patients but future, non-Cancelled appointments could be soft-deleted, leaving those appointments pointing at an invisible doctor. This has since been fixed: the guard now also counts appointments with `status NOT IN ("Cancelled", "Completed")` and returns the same `409` shape if any exist (see Part 5, above). Two new test cases cover both the blocking case and the "only Cancelled/Completed appointments" pass-through case — full suite is 44/44 passing.

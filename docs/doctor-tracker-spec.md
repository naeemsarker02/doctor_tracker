# Doctor Tracker — Engineering Development Specification (v1.1, reviewed)

> Reviewed and updated by Claude on 2026-09-04. Changes from v1 are marked with **[UPDATED]**.

You are assisting me as a senior software engineer, but I am the developer who must understand, own, and be able to explain the entire codebase.

Build this project like a real small production-minded software project, NOT like an AI-generated coding assignment.

## Product

Doctor Tracker is an internal healthcare administration web application.

An authenticated admin can:

* Manage doctors
* Manage patients
* Maintain doctor-patient relationships
* View dashboard analytics
* Manage basic patient appointments/bookings

The goal is a clean, reliable, maintainable admin system rather than a visually flashy demo.

## Required Core Features

### Authentication

* Secure admin login
* Password hashing with bcrypt
* JWT-based authentication
* Protected application routes
* Protected backend APIs
* `/api/auth/login`
* `/api/auth/me`
* **[ADDED post-Phase-11]** `PUT /api/auth/me` — update name/email, rejects duplicate email
* **[ADDED post-Phase-11]** `PUT /api/auth/password` — change password; verifies current password, rejects new password equal to current
* **[ADDED post-Phase-11]** `POST /api/auth/avatar` — multer upload, JPEG/PNG/WEBP only, 2MB limit, old file deleted on replace, served with a cross-origin resource policy header since the frontend is a different origin
* **[UPDATED] No `/api/auth/register` endpoint** — this is an admin-only internal tool. The first admin account is created via a **seed script**, not a public signup route.
* **[UPDATED] Token strategy:** single JWT access token, expiry via `JWT_EXPIRES_IN` env var (recommend 7d for an internal admin panel — no refresh-token flow needed at this scale; document this as a deliberate trade-off, not an oversight).
* **[UPDATED] Rate limiting:** apply `express-rate-limit` on `/api/auth/login` (e.g. 5 attempts / 15 min per IP) to reduce brute-force risk.
* **[UPDATED] Logout:** JWT is stateless, so logout is client-side (discard token). No server-side session/blacklist needed for MVP — explicitly note this as the reasoning if asked in interview.

### Doctor Management

* Create doctor
* List doctors
* Search doctors
* Filter doctors
* Pagination
* View doctor details
* View doctor's patients
* Edit doctor
* Delete doctor — **[UPDATED]** soft delete (see Database section), and blocked/warned if the doctor has active patients or upcoming appointments.

Doctor fields:

* name
* specialization
* hospital
* phone
* email

### Patient Management

* Create patient
* List patients
* Search patients
* Filter patients
* Pagination
* View patient details
* Edit patient
* Delete patient — **[UPDATED]** soft delete, not hard delete.

Patient fields:

* name
* age
* gender
* phone
* email
* condition
* doctor relationship

### Dashboard

Provide meaningful administrative insights:

* Total doctors
* Total patients
* Today's appointments
* Pending appointments
* Patients per doctor
* Patient registration trends
* Condition distribution
* Appointment status distribution
* Useful recent/upcoming information

### Optional Bonus — Mini Appointment System

Implement only after all required features are stable.

Appointment fields:

* doctor
* patient
* appointment date
* appointment time
* reason
* status

Statuses:

* Pending
* Confirmed
* Completed
* Cancelled

Business rule:

A doctor cannot have two appointments at the same date and time.

**[UPDATED] Enforcement:** implement this at **two levels**:

1. DB-level composite **unique index** on `(doctorId, appointmentDate, appointmentTime)` — this is the real guarantee, prevents race conditions under concurrent requests.
2. App-level check in the service layer before insert — for a clean, user-friendly error message (the DB constraint is the fallback safety net, not the primary UX).

**[UPDATED] Timezone handling:** store `appointmentDate` as `DATE` and `appointmentTime` as `TIME` (separate columns, not a combined DATETIME) to avoid timezone-shift bugs on an admin panel used from one region. Document this choice.

Do not over-engineer this booking system.

## Technology

Frontend:

* Next.js
* Tailwind CSS
* Axios
* TanStack Query
* Recharts

Backend:

* Node.js
* Express.js
* Sequelize
* MySQL
* JWT
* bcrypt
* Zod
* Helmet
* CORS
* Morgan or a lightweight logging solution
* **[UPDATED]** `express-rate-limit` (login brute-force protection)
* **[UPDATED]** `sequelize-cli` (migrations + seeders)
* **[UPDATED]** `jest` + `supertest` (backend testing, phase 10)

## Architecture

Follow a clean layered architecture:

Request
→ Route
→ Middleware
→ Controller
→ Service
→ Data access/Sequelize
→ MySQL

Keep controllers thin.
Business logic belongs in services.
Do not introduce unnecessary abstractions. Use a repository/data-access layer only where it genuinely improves complex query organization.

## Database

Tables:

* users
* doctors
* patients
* appointments

Relationships:

* Doctor has many Patients
* Patient belongs to Doctor
* Doctor has many Appointments
* Patient has many Appointments
* Appointment belongs to Doctor
* Appointment belongs to Patient

Use proper:

* primary keys
* foreign keys
* unique constraints
* indexes
* timestamps

**[UPDATED] Soft delete:** use Sequelize `paranoid: true` (adds `deletedAt`) on `doctors`, `patients`, and `appointments`. Healthcare-adjacent records should never be permanently and silently erased by a single click — soft delete gives you an audit trail and a recovery path.

Do NOT blindly use cascading deletes for healthcare-related records.

Before deleting a doctor, check whether related records exist and prevent destructive deletion when necessary.

**[UPDATED] Schema management:** use `sequelize-cli` migrations + seeders instead of `sequelize.sync({ alter: true })`. Migrations are the production-safe, version-controlled way to evolve schema — `sync` is fine for a throwaway prototype but not for something you'll defend as "production-minded" in an interview.

## API Design

Use RESTful conventions.

Doctors:

* GET `/api/doctors`
* POST `/api/doctors`
* GET `/api/doctors/:id`
* PUT `/api/doctors/:id`
* DELETE `/api/doctors/:id`
* GET `/api/doctors/:id/patients`

Patients:

* GET `/api/patients`
* POST `/api/patients`
* GET `/api/patients/:id`
* PUT `/api/patients/:id`
* DELETE `/api/patients/:id`

Appointments:

* GET `/api/appointments`
* POST `/api/appointments`
* GET `/api/appointments/:id`
* PUT `/api/appointments/:id`
* DELETE `/api/appointments/:id`

Dashboard:

* GET `/api/dashboard/overview`
* GET `/api/dashboard/patients-per-doctor`
* GET `/api/dashboard/patient-trends`
* GET `/api/dashboard/conditions`
* GET `/api/dashboard/appointments`

## API Response Standard

Success:

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

Error:

```json
{
  "success": false,
  "message": "..."
}
```

Validation error:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": {}
}
```

Keep API responses consistent.

## Backend Structure

Use:

```
src/
  config/
  models/
  routes/
  controllers/
  services/
  middleware/
  validators/
  utils/
  migrations/      [UPDATED]
  seeders/         [UPDATED]
  tests/           [UPDATED]
```

Keep `app.js` responsible for Express application configuration and `server.js` responsible for starting the server.

## Validation

Use Zod for backend request validation.

Never rely only on frontend validation.
Frontend validation improves UX; backend validation protects the application.

## Security

Implement:

* bcrypt password hashing
* JWT authentication
* protected routes
* Helmet
* appropriate CORS configuration
* environment variables
* input validation
* safe error responses
* no passwords in API responses
* no secrets committed to Git
* **[UPDATED]** rate limiting on login

**[UPDATED] Required environment variables:**

```
PORT=
NODE_ENV=
DB_HOST=
DB_PORT=
DB_NAME=
DB_USER=
DB_PASSWORD=
JWT_SECRET=
JWT_EXPIRES_IN=7d
CORS_ORIGIN=
ADMIN_EMAIL=        # used only by the seed script
ADMIN_PASSWORD=      # used only by the seed script
```

## Search, Filtering and Pagination

Implement these at the backend/database level.
Do not fetch the entire dataset and filter it in React.

Use query parameters such as:
`?search=rahim&page=1&limit=10`

**[UPDATED] Pagination contract (make this explicit so frontend/backend don't drift):**

* Defaults: `page=1`, `limit=10`
* Max allowed `limit`: 100 (reject/clamp anything higher)
* Response metadata shape:

```json
{
  "total": 124,
  "page": 1,
  "limit": 10,
  "totalPages": 13
}
```

Use appropriate MySQL indexes based on actual query patterns.

## Frontend

Build a professional admin dashboard.

Pages:

* Login
* Dashboard
* Doctors
* Doctor Details
* Patients
* Patient Details
* Appointments
* **[ADDED post-Phase-11] Profile** — basic-info edit (name/email, duplicate-email check), password change (current-password verification, reject new==current), avatar upload with hover-to-change UI. Not in the original spec's page list; added as a real-product-feel addition. Login page also redesigned as a split-screen branded layout (dark brand panel + form panel, collapsing to centered-card on smaller screens) rather than a bare generic form.

Reusable components should be used for:

* tables
* forms
* inputs
* buttons
* modals
* pagination
* filters
* loading states
* empty states
* confirmation dialogs
* toast notifications

Avoid excessive gradients, animations, decorative UI, or random colors.

Prioritize:

* usability
* consistency
* accessibility
* responsive design
* visual hierarchy
* clear feedback

## Engineering Rules

1. Do not generate the entire application at once.
2. Work in small, verifiable milestones.
3. Before implementing a feature, briefly explain:
   * What we are building
   * Why we need it
   * How it will work
4. After implementation, provide:
   * Files changed
   * What each file does
   * How to run/test it
   * Expected result
   * Common errors
5. Never hide important logic behind unnecessary abstractions.
6. Do not introduce libraries unless they provide clear value.
7. Do not duplicate business logic.
8. Keep controllers thin.
9. Keep business logic in services.
10. Use meaningful variable and function names.
11. Prefer readable code over clever code.
12. Handle errors deliberately.
13. Use proper HTTP status codes.
14. Do not ignore edge cases.
15. Do not claim a feature is complete without explaining how it was tested.
16. Do not modify unrelated files unnecessarily.
17. Preserve existing working functionality when adding new features.

## AI-Ownership Requirement

I will personally explain and defend this project in a technical interview.

Therefore, for every significant implementation, teach me the underlying concept in simple English and Bangla.

For each major decision, explain:

* What it does
* Why we chose it
* Alternative approaches
* Trade-offs
* How it works internally at a high level
* How I can explain it in an interview

Do not encourage blind copy-paste.

## Development Order

1. Backend foundation
2. Database models and relationships (migrations + seeders) **[UPDATED]**
3. Authentication (incl. admin seed script, rate limiting) **[UPDATED]**
4. Global error handling and validation
5. Doctor CRUD (soft delete + relation-check on delete) **[UPDATED]**
6. Doctor search/filter/pagination
7. Patient CRUD (soft delete) **[UPDATED]**
8. Patient search/filter/pagination
9. Dashboard APIs and aggregations
10. Backend testing (Jest + Supertest) **[UPDATED]**
11. Next.js frontend foundation
12. Login UI
13. Dashboard UI
14. Doctor UI
15. Patient UI
16. Appointment feature (incl. DB-level unique constraint) **[UPDATED]**
17. Charts and analytics
18. Responsive UX
19. Performance optimization
20. Security review
21. Production deployment — **[OPEN QUESTION: decide target before this phase — Railway / Render / a VPS? affects connection pooling & migration-on-deploy steps]**
22. README/documentation
23. Final QA

Do not start later phases until the current phase is working and verified.

## Definition of Done

A feature is considered complete only when:

* Code is implemented
* Validation exists where necessary
* Errors are handled
* API has been tested
* Edge cases are considered
* Frontend state is handled properly
* UI has loading/error/empty states where relevant
* The feature does not break existing functionality
* I understand how it works

Start from the current project state and continue one milestone at a time.
Do not rewrite working code unnecessarily.

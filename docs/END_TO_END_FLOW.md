# Doctor Tracker — End-to-End Flow: Booking an Appointment

This document connects the two halves of the system that `BACKEND_DEVELOPMENT_GUIDE.md` and `FRONTEND_DEVELOPMENT_GUIDE.md` each document separately. Read on its own it should be enough to explain, in an interview, exactly what happens between a click in the browser and a row appearing in MySQL — and back. It uses **booking an appointment** as the running example because it's the one feature that touches every layer: auth, client-side form state, HTTP, backend validation, a service-layer business rule, a database constraint, and multi-key cache invalidation on the way back.

Every numbered step below cites the real file and line/function it corresponds to. Where a step is explained in more depth in one of the two guides, that's noted so you can go deeper without this document repeating it.

---

## The walkthrough

**1. Admin clicks "Book Appointment"** on `/dashboard/appointments` (`doctor_tracker_frontend/src/app/dashboard/appointments/page.tsx`). This sets `editingAppointment` to `null` and `formOpen` to `true`, rendering `<AppointmentFormModal>` with `appointment={null}` — so the modal knows it's in "create" mode (`isEditing = Boolean(appointment)` evaluates to `false`).

**2. The modal loads its dropdown data.** `AppointmentFormModal.tsx` runs two `useQuery` calls — `["doctors", "select-list"]` and `["patients", "select-list"]` — each `enabled: isOpen`, so they only fire once the modal is actually open. These hit `GET /api/doctors` and `GET /api/patients` through the same shared Axios instance described in step 5 below.

**3. Admin fills the form and submits.** `handleSubmit` builds a payload of `{ doctorId, patientId, appointmentDate, appointmentTime, reason }` — note `status` is **only** included when editing (`...(isEditing ? { status: ... } : {})`), so a brand-new booking never sends a status at all. This is a deliberate business rule (see `FRONTEND_DEVELOPMENT_GUIDE.md` §6.2) — a booking is always a request until confirmed, enforced on both ends (frontend never shows the field on create; backend defaults it regardless).

**4. The typed fetcher fires the request.** `mutation.mutationFn` calls `createAppointment(input)` from `src/lib/appointments.ts`, which does `api.post("/appointments", input)`.

**5. The shared Axios instance attaches auth and dispatches.** `src/lib/api.ts`'s request interceptor reads the JWT from `localStorage` (key `"doctor_tracker_token"`) and sets `Authorization: Bearer <token>` on the outgoing request, which is sent to `{NEXT_PUBLIC_API_URL}/appointments` — a different origin than the Next.js app, since the backend runs as a separate Express process. *(Full detail: `FRONTEND_DEVELOPMENT_GUIDE.md` §3.)*

**6. Express receives the request.** `app.js` has already run `helmet()`, `cors()` (checked against `CORS_ORIGIN`), `morgan()`, and `express.json()` on every incoming request, then routes `POST /api/appointments` to `appointmentRoutes.js`.

**7. Middleware runs before the controller.** `appointmentRoutes.js` has `router.use(authMiddleware)` at the top of the file, so it runs first: it verifies the JWT signature against `JWT_SECRET` and attaches `req.user = { id, email, role }`, or short-circuits straight to the error handler with a `401` if the token is missing/invalid/expired. Then `validate(createAppointmentSchema)` runs the Zod schema from `appointmentValidators.js` against `req.body` — checking `appointmentDate` matches `YYYY-MM-DD`, `appointmentTime` matches `HH:MM`, and coercing `doctorId`/`patientId` to positive integers. Any failure produces a `400` with field-level errors, in the same request/response cycle, before the controller ever runs.

**8. The controller stays thin.** `appointmentController.create` does exactly three things: pull the validated `req.body`, call `appointmentService.createAppointment(req.body)`, and shape the `201` response. No business decision is made here — that's a deliberate layering choice explained in `BACKEND_DEVELOPMENT_GUIDE.md` Part 3.

**9. The service enforces the actual business rule.** `appointmentService.createAppointment`:
   - Confirms the doctor and patient both exist (`assertDoctorExists`/`assertPatientExists`), throwing a `400` if either foreign key is bad — caught here, before it ever becomes a raw SQL error.
   - Runs `assertSlotAvailable(doctorId, appointmentDate, appointmentTime)` — a `SELECT` for a conflicting, non-Cancelled appointment. If one exists, throws `AppError("This doctor already has an appointment at that date and time.", 409)` immediately, without touching the database's write path at all.
   - Calls `Appointment.create(data)`, wrapped so that if a raw `SequelizeUniqueConstraintError` slips through anyway (a genuine race between two near-simultaneous requests), it's translated into the same friendly `409`.

**10. MySQL is the actual source of truth for uniqueness.** The `INSERT` is checked against the composite unique index `(doctor_id, appointment_date, appointment_time, slot_lock)` from the `create-appointments` migration — where `slot_lock` is a generated column that's `NULL` for Cancelled/soft-deleted rows and `1` otherwise. This is what makes the rule airtight under concurrency: step 9's pre-check is a fast, friendly UX layer, but this index is what actually prevents two live bookings for the same doctor/date/time from both committing, no matter how close together the requests arrive. *(Full mechanics and why the generated column exists at all: `BACKEND_DEVELOPMENT_GUIDE.md` §5.5.)*

**11. The row is re-fetched with its associations.** `getAppointmentById` loads the new row back with `doctor: {id, name, specialization}` and `patient: {id, name}` joined in, so the frontend never has to make a second request just to display names instead of raw IDs.

**12. The response travels back up.** Service → controller → Express → the same HTTP response the browser's `axios.post` call is awaiting: `{ success: true, message: "Appointment created successfully", data: { appointment: {...} } }` with status `201`.

**13. `onSuccess` fires in the modal.** `AppointmentFormModal`'s mutation `onSuccess` shows a `sonner` toast (`"Appointment booked"`), then invalidates two TanStack Query key prefixes: `["appointments"]` and `["dashboard"]`.

**14. Cache invalidation, not a manual refetch call.** TanStack Query matches by key **prefix**: invalidating `["appointments"]` marks the appointments list page's own query (keyed `["appointments", { page, date, status, doctorFilter }]`) as stale; invalidating `["dashboard"]` covers all five dashboard queries (`["dashboard", "overview"]`, `["dashboard", "appointments"]`, etc.), because appointment counts feed the "Appointments Today"/"Upcoming" stat cards and the status-distribution numbers. *(The general mechanism, and the real bug this project hit when a similar invalidation was once missed: `FRONTEND_DEVELOPMENT_GUIDE.md` §6.1.)*

**15. The UI updates itself.** Because both queries are now stale and their components are still mounted, TanStack Query automatically refetches in the background — the appointments table gets the new row (status "Pending"), the dashboard's stat cards and charts update the next time they're viewed, and the modal closes. No page reload, no manually-threaded "please refresh" callback between components.

---

## Why this is worth understanding as one picture, not two

The backend guide's trace of this same request stops at "the response is sent." The frontend guide's trace starts at "the user clicked a button" and treats the backend as a black box that "returns the new appointment." Neither half, alone, shows *why* the specific design choices on one side only make sense in light of the other:

- The backend's decision to default `status` to `"Pending"` at the model layer (not just in a service `if`) means the frontend can safely omit the field entirely on create and never worry about a client that forgets to set it landing in a bad state.
- The backend's two-layer double-booking guard (service pre-check + DB constraint) exists *because* the frontend has no way to prevent two admins submitting the same slot at nearly the same moment — the UI can't solve a race condition, only the database can.
- The frontend's `["appointments"]` / `["dashboard"]` invalidation choice only makes sense once you know the backend's dashboard aggregation queries (`dashboardService.getAppointmentsSummary`, etc.) read from the same `appointments` table — the two "sides" are invalidating a cache because they know they share a database, not because of a convention picked at random.

If you're asked in an interview "walk me through what happens when you book an appointment," this document — steps 1 through 15 — is the answer, with a file and function name behind every step.

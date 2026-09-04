const request = require("supertest");
const app = require("../app");
const { resetDb, loginAsAdmin, sequelize } = require("./helpers/testUtils");
const { Doctor, Patient, Appointment } = require("../src/models");

describe("Appointment CRUD", () => {
    let token;
    let doctor;
    let patient;

    beforeAll(async () => {
        await resetDb();
        token = await loginAsAdmin(request, app);
    });

    beforeEach(async () => {
        await resetDb();
        doctor = await Doctor.create({
            name: "Dr Alice",
            specialization: "Cardiology",
            hospital: "City Hospital",
            phone: "1",
        });
        patient = await Patient.create({
            doctorId: doctor.id,
            name: "John Doe",
            age: 30,
            gender: "male",
            phone: "1",
            condition: "flu",
        });
    });

    afterAll(async () => {
        await sequelize.close();
    });

    const authed = (req) => req.set("Authorization", `Bearer ${token}`);
    const basePayload = () => ({
        doctorId: doctor.id,
        patientId: patient.id,
        appointmentDate: "2026-12-01",
        appointmentTime: "10:00",
        reason: "Checkup",
    });

    it("rejects unauthenticated requests", async () => {
        const res = await request(app).get("/api/appointments");
        expect(res.status).toBe(401);
    });

    it("rejects an invalid date/time format", async () => {
        const res = await authed(request(app).post("/api/appointments")).send({
            ...basePayload(),
            appointmentDate: "12/01/2026",
            appointmentTime: "10 AM",
        });
        expect(res.status).toBe(400);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("rejects a nonexistent doctorId/patientId", async () => {
        const badDoctor = await authed(request(app).post("/api/appointments")).send({
            ...basePayload(),
            doctorId: 999999,
        });
        expect(badDoctor.status).toBe(400);

        const badPatient = await authed(request(app).post("/api/appointments")).send({
            ...basePayload(),
            patientId: 999999,
        });
        expect(badPatient.status).toBe(400);
    });

    it("creates an appointment, defaulting status to Pending", async () => {
        const res = await authed(request(app).post("/api/appointments")).send(basePayload());
        expect(res.status).toBe(201);
        expect(res.body.data.appointment.status).toBe("Pending");
        expect(res.body.data.appointment.doctor.name).toBe("Dr Alice");
        expect(res.body.data.appointment.patient.name).toBe("John Doe");
    });

    it("rejects double-booking the same doctor at the same date/time (app-level 409)", async () => {
        const first = await authed(request(app).post("/api/appointments")).send(basePayload());
        expect(first.status).toBe(201);

        const second = await authed(request(app).post("/api/appointments")).send(basePayload());
        expect(second.status).toBe(409);
        expect(second.body.message).toMatch(/already has an appointment/i);
    });

    it("allows rebooking the same slot once the conflicting appointment is Cancelled", async () => {
        const first = await authed(request(app).post("/api/appointments")).send(basePayload());
        expect(first.status).toBe(201);

        const cancelled = await authed(
            request(app).put(`/api/appointments/${first.body.data.appointment.id}`)
        ).send({ status: "Cancelled" });
        expect(cancelled.status).toBe(200);

        const second = await authed(request(app).post("/api/appointments")).send(basePayload());
        expect(second.status).toBe(201);
    });

    it("enforces the double-booking rule at the raw DB level too (composite unique index)", async () => {
        // Bypasses the service-layer pre-check entirely — this is the real
        // safety net the spec asked for under concurrent requests.
        await Appointment.create(basePayload());

        await expect(Appointment.create(basePayload())).rejects.toThrow(
            /SequelizeUniqueConstraintError|Validation error/i
        );
    });

    it("lists appointments and supports doctorId/status/date filters", async () => {
        await authed(request(app).post("/api/appointments")).send(basePayload());
        await authed(request(app).post("/api/appointments")).send({
            ...basePayload(),
            appointmentDate: "2026-12-02",
        });

        const all = await authed(request(app).get("/api/appointments"));
        expect(all.body.data.pagination.total).toBe(2);

        const byDate = await authed(request(app).get("/api/appointments?date=2026-12-01"));
        expect(byDate.body.data.appointments).toHaveLength(1);

        const byStatus = await authed(request(app).get("/api/appointments?status=Pending"));
        expect(byStatus.body.data.appointments).toHaveLength(2);

        const byDoctor = await authed(request(app).get(`/api/appointments?doctorId=${doctor.id}`));
        expect(byDoctor.body.data.appointments).toHaveLength(2);
    });

    it("returns 404 for a missing appointment", async () => {
        const res = await authed(request(app).get("/api/appointments/999999"));
        expect(res.status).toBe(404);
    });

    it("updates an appointment's status", async () => {
        const created = await authed(request(app).post("/api/appointments")).send(basePayload());

        const res = await authed(
            request(app).put(`/api/appointments/${created.body.data.appointment.id}`)
        ).send({ status: "Confirmed" });

        expect(res.status).toBe(200);
        expect(res.body.data.appointment.status).toBe("Confirmed");
    });

    it("rejects rescheduling into an already-booked slot (409)", async () => {
        const first = await authed(request(app).post("/api/appointments")).send(basePayload());
        const second = await authed(request(app).post("/api/appointments")).send({
            ...basePayload(),
            appointmentDate: "2026-12-02",
        });

        const res = await authed(
            request(app).put(`/api/appointments/${second.body.data.appointment.id}`)
        ).send({ appointmentDate: "2026-12-01", appointmentTime: "10:00" });

        expect(res.status).toBe(409);
        expect(first.status).toBe(201);
    });

    it("deletes an appointment", async () => {
        const created = await authed(request(app).post("/api/appointments")).send(basePayload());

        const res = await authed(
            request(app).delete(`/api/appointments/${created.body.data.appointment.id}`)
        );
        expect(res.status).toBe(200);

        const getRes = await authed(
            request(app).get(`/api/appointments/${created.body.data.appointment.id}`)
        );
        expect(getRes.status).toBe(404);
    });
});

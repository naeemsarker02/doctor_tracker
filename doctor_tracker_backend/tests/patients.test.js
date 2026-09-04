const request = require("supertest");
const app = require("../app");
const { resetDb, loginAsAdmin, sequelize } = require("./helpers/testUtils");
const { Doctor, Patient } = require("../src/models");

describe("Patient CRUD", () => {
    let token;
    let doctor;

    beforeAll(async () => {
        await resetDb();
        // One login for the whole file — see doctors.test.js for why this is safe.
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
    });

    afterAll(async () => {
        await sequelize.close();
    });

    const authed = (req) => req.set("Authorization", `Bearer ${token}`);

    it("rejects creation with a nonexistent doctorId", async () => {
        const res = await authed(request(app).post("/api/patients")).send({
            doctorId: 999999,
            name: "John",
            age: 30,
            gender: "male",
            phone: "1",
            condition: "flu",
        });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/doctor/i);
    });

    it("rejects creation with missing fields", async () => {
        const res = await authed(request(app).post("/api/patients")).send({
            doctorId: doctor.id,
            name: "John",
        });

        expect(res.status).toBe(400);
    });

    it("creates a patient under a valid doctor", async () => {
        const res = await authed(request(app).post("/api/patients")).send({
            doctorId: doctor.id,
            name: "John Doe",
            age: 30,
            gender: "male",
            phone: "01711111111",
            condition: "flu",
        });

        expect(res.status).toBe(201);
        expect(res.body.data.patient.doctorId).toBe(doctor.id);
    });

    it("lists patients with search, doctorId filter, and embedded doctor info", async () => {
        await Patient.create({
            doctorId: doctor.id,
            name: "John Doe",
            age: 30,
            gender: "male",
            phone: "1",
            condition: "flu",
        });

        const list = await authed(request(app).get("/api/patients"));
        expect(list.body.data.patients).toHaveLength(1);
        expect(list.body.data.patients[0].doctor.name).toBe("Dr Alice");

        const filtered = await authed(request(app).get(`/api/patients?doctorId=${doctor.id}`));
        expect(filtered.body.data.patients).toHaveLength(1);

        const searched = await authed(request(app).get("/api/patients?search=flu"));
        expect(searched.body.data.patients).toHaveLength(1);
    });

    it("returns 404 for a missing patient", async () => {
        const res = await authed(request(app).get("/api/patients/999999"));
        expect(res.status).toBe(404);
    });

    it("updates a patient", async () => {
        const patient = await Patient.create({
            doctorId: doctor.id,
            name: "John Doe",
            age: 30,
            gender: "male",
            phone: "1",
            condition: "flu",
        });

        const res = await authed(request(app).put(`/api/patients/${patient.id}`)).send({
            condition: "recovered",
        });

        expect(res.status).toBe(200);
        expect(res.body.data.patient.condition).toBe("recovered");
    });

    it("rejects reassigning a patient to a nonexistent doctor", async () => {
        const patient = await Patient.create({
            doctorId: doctor.id,
            name: "John Doe",
            age: 30,
            gender: "male",
            phone: "1",
            condition: "flu",
        });

        const res = await authed(request(app).put(`/api/patients/${patient.id}`)).send({
            doctorId: 999999,
        });

        expect(res.status).toBe(400);
    });

    it("deletes a patient, which then unblocks deleting the doctor", async () => {
        const patient = await Patient.create({
            doctorId: doctor.id,
            name: "John Doe",
            age: 30,
            gender: "male",
            phone: "1",
            condition: "flu",
        });

        const blocked = await authed(request(app).delete(`/api/doctors/${doctor.id}`));
        expect(blocked.status).toBe(409);

        const del = await authed(request(app).delete(`/api/patients/${patient.id}`));
        expect(del.status).toBe(200);

        const nowAllowed = await authed(request(app).delete(`/api/doctors/${doctor.id}`));
        expect(nowAllowed.status).toBe(200);
    });
});

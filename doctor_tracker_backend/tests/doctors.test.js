const request = require("supertest");
const app = require("../app");
const { resetDb, loginAsAdmin, sequelize } = require("./helpers/testUtils");
const { Doctor, Patient, Appointment } = require("../src/models");

describe("Doctor CRUD", () => {
    let token;

    beforeAll(async () => {
        await resetDb();
        // Logged in once for the whole file, not per test — authMiddleware
        // verifies the JWT signature only, it never re-queries the user row,
        // so one token issued here stays valid across every resetDb() below.
        token = await loginAsAdmin(request, app);
    });

    beforeEach(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    const authed = (req) => req.set("Authorization", `Bearer ${token}`);

    it("rejects unauthenticated requests", async () => {
        const res = await request(app).get("/api/doctors");
        expect(res.status).toBe(401);
    });

    it("rejects creation with missing fields", async () => {
        const res = await authed(request(app).post("/api/doctors")).send({ name: "Dr A" });

        expect(res.status).toBe(400);
        expect(res.body.errors.length).toBeGreaterThan(0);
    });

    it("creates a doctor", async () => {
        const res = await authed(request(app).post("/api/doctors")).send({
            name: "Dr Alice",
            specialization: "Cardiology",
            hospital: "City Hospital",
            phone: "01700000000",
            email: "alice@test.com",
        });

        expect(res.status).toBe(201);
        expect(res.body.data.doctor.id).toEqual(expect.any(Number));
        expect(res.body.data.doctor.name).toBe("Dr Alice");
    });

    it("lists doctors and supports search + pagination", async () => {
        await Doctor.bulkCreate([
            { name: "Dr Alice", specialization: "Cardiology", hospital: "City Hospital", phone: "1" },
            { name: "Dr Bob", specialization: "Neurology", hospital: "Metro Hospital", phone: "2" },
        ]);

        const all = await authed(request(app).get("/api/doctors"));
        expect(all.body.data.pagination.total).toBe(2);

        const searched = await authed(request(app).get("/api/doctors?search=cardio"));
        expect(searched.body.data.doctors).toHaveLength(1);
        expect(searched.body.data.doctors[0].name).toBe("Dr Alice");

        const paged = await authed(request(app).get("/api/doctors?page=1&limit=1"));
        expect(paged.body.data.doctors).toHaveLength(1);
        expect(paged.body.data.pagination.totalPages).toBe(2);
    });

    it("returns 404 for a missing doctor", async () => {
        const res = await authed(request(app).get("/api/doctors/999999"));
        expect(res.status).toBe(404);
    });

    it("validates the id param", async () => {
        const res = await authed(request(app).get("/api/doctors/not-a-number"));
        expect(res.status).toBe(400);
    });

    it("lists a doctor's patients, 404s for a missing doctor", async () => {
        const doctor = await Doctor.create({
            name: "Dr Alice",
            specialization: "Cardiology",
            hospital: "City Hospital",
            phone: "1",
        });
        const otherDoctor = await Doctor.create({
            name: "Dr Zed",
            specialization: "Neurology",
            hospital: "Metro Hospital",
            phone: "2",
        });
        await Patient.create({
            doctorId: doctor.id,
            name: "Pat A",
            age: 20,
            gender: "female",
            phone: "1",
            condition: "flu",
        });
        await Patient.create({
            doctorId: otherDoctor.id,
            name: "Pat B",
            age: 25,
            gender: "male",
            phone: "2",
            condition: "asthma",
        });

        const res = await authed(request(app).get(`/api/doctors/${doctor.id}/patients`));
        expect(res.status).toBe(200);
        expect(res.body.data.patients).toHaveLength(1);
        expect(res.body.data.patients[0].name).toBe("Pat A");
        expect(res.body.data.pagination.total).toBe(1);

        const notFound = await authed(request(app).get("/api/doctors/999999/patients"));
        expect(notFound.status).toBe(404);
    });

    it("updates a doctor", async () => {
        const doctor = await Doctor.create({
            name: "Dr Alice",
            specialization: "Cardiology",
            hospital: "City Hospital",
            phone: "1",
        });

        const res = await authed(request(app).put(`/api/doctors/${doctor.id}`)).send({
            hospital: "Updated Hospital",
        });

        expect(res.status).toBe(200);
        expect(res.body.data.doctor.hospital).toBe("Updated Hospital");
    });

    it("deletes a doctor with no patients", async () => {
        const doctor = await Doctor.create({
            name: "Dr Alice",
            specialization: "Cardiology",
            hospital: "City Hospital",
            phone: "1",
        });

        const res = await authed(request(app).delete(`/api/doctors/${doctor.id}`));
        expect(res.status).toBe(200);

        const found = await Doctor.findByPk(doctor.id);
        expect(found).toBeNull();
    });

    it("blocks deleting a doctor that still has patients (409)", async () => {
        const doctor = await Doctor.create({
            name: "Dr Alice",
            specialization: "Cardiology",
            hospital: "City Hospital",
            phone: "1",
        });

        await Patient.create({
            doctorId: doctor.id,
            name: "Patient X",
            age: 30,
            gender: "female",
            phone: "1",
            condition: "flu",
        });

        const res = await authed(request(app).delete(`/api/doctors/${doctor.id}`));
        expect(res.status).toBe(409);

        const stillThere = await Doctor.findByPk(doctor.id);
        expect(stillThere).not.toBeNull();
    });

    it("blocks deleting a doctor with an upcoming (non-Cancelled) appointment (409)", async () => {
        const doctor = await Doctor.create({
            name: "Dr Bob",
            specialization: "Neurology",
            hospital: "City Hospital",
            phone: "1",
        });

        const patient = await Patient.create({
            doctorId: doctor.id,
            name: "Patient Y",
            age: 40,
            gender: "male",
            phone: "1",
            condition: "migraine",
        });
        // No patients left pointing at this doctor by the time of delete —
        // isolates the assertion to the appointment guard specifically.
        await patient.destroy();

        await Appointment.create({
            doctorId: doctor.id,
            patientId: patient.id,
            appointmentDate: "2027-01-01",
            appointmentTime: "10:00",
            status: "Pending",
        });

        const res = await authed(request(app).delete(`/api/doctors/${doctor.id}`));
        expect(res.status).toBe(409);

        const stillThere = await Doctor.findByPk(doctor.id);
        expect(stillThere).not.toBeNull();
    });

    it("allows deleting a doctor whose only appointments are Cancelled or Completed", async () => {
        const doctor = await Doctor.create({
            name: "Dr Carol",
            specialization: "Pediatrics",
            hospital: "City Hospital",
            phone: "1",
        });

        const patient = await Patient.create({
            doctorId: doctor.id,
            name: "Patient Z",
            age: 12,
            gender: "female",
            phone: "1",
            condition: "checkup",
        });
        await patient.destroy();

        await Appointment.create({
            doctorId: doctor.id,
            patientId: patient.id,
            appointmentDate: "2020-01-01",
            appointmentTime: "10:00",
            status: "Completed",
        });
        await Appointment.create({
            doctorId: doctor.id,
            patientId: patient.id,
            appointmentDate: "2020-01-02",
            appointmentTime: "10:00",
            status: "Cancelled",
        });

        const res = await authed(request(app).delete(`/api/doctors/${doctor.id}`));
        expect(res.status).toBe(200);

        const found = await Doctor.findByPk(doctor.id);
        expect(found).toBeNull();
    });
});

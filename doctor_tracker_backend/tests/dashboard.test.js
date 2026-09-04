const request = require("supertest");
const app = require("../app");
const { resetDb, loginAsAdmin, sequelize } = require("./helpers/testUtils");
const { Doctor, Patient } = require("../src/models");

describe("Dashboard", () => {
    let token;

    beforeEach(async () => {
        await resetDb();
        token = await loginAsAdmin(request, app);
    });

    afterAll(async () => {
        await sequelize.close();
    });

    const authed = (req) => req.set("Authorization", `Bearer ${token}`);

    it("all endpoints require auth", async () => {
        const endpoints = [
            "/api/dashboard/overview",
            "/api/dashboard/patients-per-doctor",
            "/api/dashboard/patient-trends",
            "/api/dashboard/conditions",
            "/api/dashboard/appointments",
        ];

        for (const endpoint of endpoints) {
            // eslint-disable-next-line no-await-in-loop
            const res = await request(app).get(endpoint);
            expect(res.status).toBe(401);
        }
    });

    it("returns zero/empty shapes on an empty database", async () => {
        const overview = await authed(request(app).get("/api/dashboard/overview"));
        expect(overview.body.data.totals).toEqual({ doctors: 0, patients: 0 });
        expect(overview.body.data.doctorsBySpecialization).toEqual([]);

        const perDoctor = await authed(request(app).get("/api/dashboard/patients-per-doctor"));
        expect(perDoctor.body.data).toEqual([]);

        const conditions = await authed(request(app).get("/api/dashboard/conditions"));
        expect(conditions.body.data).toEqual([]);

        const appointments = await authed(request(app).get("/api/dashboard/appointments"));
        expect(appointments.body.data).toEqual({
            total: 0,
            today: 0,
            upcoming: 0,
            statusDistribution: [],
            list: [],
        });
    });

    it("aggregates real data correctly", async () => {
        const d1 = await Doctor.create({
            name: "Dr Alice",
            specialization: "Cardiology",
            hospital: "City Hospital",
            phone: "1",
        });
        const d2 = await Doctor.create({
            name: "Dr Bob",
            specialization: "Neurology",
            hospital: "Metro Hospital",
            phone: "2",
        });

        await Patient.create({ doctorId: d1.id, name: "P1", age: 20, gender: "female", phone: "1", condition: "flu" });
        await Patient.create({ doctorId: d1.id, name: "P2", age: 25, gender: "male", phone: "2", condition: "flu" });
        await Patient.create({ doctorId: d2.id, name: "P3", age: 30, gender: "female", phone: "3", condition: "migraine" });

        const overview = await authed(request(app).get("/api/dashboard/overview"));
        expect(overview.body.data.totals).toEqual({ doctors: 2, patients: 3 });

        const perDoctor = await authed(request(app).get("/api/dashboard/patients-per-doctor"));
        const aliceEntry = perDoctor.body.data.find((row) => row.doctorId === d1.id);
        expect(aliceEntry.patientCount).toBe(2);

        const conditions = await authed(request(app).get("/api/dashboard/conditions"));
        const flu = conditions.body.data.find((row) => row.condition === "flu");
        expect(flu.count).toBe(2);

        const trends = await authed(request(app).get("/api/dashboard/patient-trends?days=1"));
        expect(trends.body.data).toHaveLength(1);
        expect(trends.body.data[0].count).toBe(3);
    });
});

const request = require("supertest");
const app = require("../app");
const { resetDb, createAdmin, loginAsAdmin, sequelize, ADMIN_PASSWORD } = require("./helpers/testUtils");

describe("Auth", () => {
    beforeEach(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    describe("POST /api/auth/login", () => {
        it("rejects missing fields with a validation error", async () => {
            const res = await request(app).post("/api/auth/login").send({});

            expect(res.status).toBe(400);
            expect(res.body.success).toBe(false);
            expect(res.body.errors.length).toBeGreaterThan(0);
        });

        it("rejects an unknown email", async () => {
            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "nobody@test.com", password: "whatever" });

            expect(res.status).toBe(401);
            expect(res.body.success).toBe(false);
        });

        it("rejects a wrong password", async () => {
            await createAdmin();

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "admin@test.com", password: "wrong-password" });

            expect(res.status).toBe(401);
        });

        it("logs in successfully and returns a token + user without password", async () => {
            await createAdmin();

            const res = await request(app)
                .post("/api/auth/login")
                .send({ email: "admin@test.com", password: ADMIN_PASSWORD });

            expect(res.status).toBe(200);
            expect(res.body.data.token).toEqual(expect.any(String));
            expect(res.body.data.user.email).toBe("admin@test.com");
            expect(res.body.data.user.password).toBeUndefined();
        });
    });

    describe("GET /api/auth/me", () => {
        it("returns 401 without a token", async () => {
            const res = await request(app).get("/api/auth/me");

            expect(res.status).toBe(401);
        });

        it("returns 401 with an invalid token", async () => {
            const res = await request(app)
                .get("/api/auth/me")
                .set("Authorization", "Bearer not-a-real-token");

            expect(res.status).toBe(401);
        });

        it("returns the current user without the password field", async () => {
            const token = await loginAsAdmin(request, app);

            const res = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body.data.user.email).toBe("admin@test.com");
            expect(res.body.data.user.password).toBeUndefined();
        });
    });
});

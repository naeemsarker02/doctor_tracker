const request = require("supertest");
const app = require("../app");
const { resetDb, sequelize } = require("./helpers/testUtils");

describe("Auth rate limiting", () => {
    beforeEach(async () => {
        await resetDb();
    });

    afterAll(async () => {
        await sequelize.close();
    });

    it("returns 429 after exceeding the login attempt threshold", async () => {
        const attempt = () =>
            request(app)
                .post("/api/auth/login")
                .send({ email: "nobody@test.com", password: "wrong" });

        const responses = [];
        for (let i = 0; i < 6; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            responses.push(await attempt());
        }

        const statuses = responses.map((res) => res.status);

        expect(statuses.slice(0, 5)).not.toContain(429);
        expect(statuses[5]).toBe(429);
    });
});

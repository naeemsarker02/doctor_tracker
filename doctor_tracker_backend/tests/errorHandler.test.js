const request = require("supertest");
const app = require("../app");
const { sequelize } = require("./helpers/testUtils");

describe("Global error handling", () => {
    afterAll(async () => {
        await sequelize.close();
    });

    it("returns the standard shape for an unmatched route", async () => {
        const res = await request(app).get("/api/does-not-exist");

        expect(res.status).toBe(404);
        expect(res.body).toEqual({
            success: false,
            message: expect.stringContaining("Route not found"),
        });
    });
});

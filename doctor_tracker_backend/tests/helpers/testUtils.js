const bcrypt = require("bcryptjs");
const { User, Doctor, Patient, Appointment, sequelize } = require("../../src/models");

const ADMIN_PASSWORD = "Admin@123";

const resetDb = async () => {
    // Appointments hold RESTRICT FKs to both Doctor and Patient, so they must
    // go first or deleting a doctor/patient with an appointment would throw.
    await Appointment.destroy({ where: {}, force: true });
    await Patient.destroy({ where: {}, force: true });
    await Doctor.destroy({ where: {}, force: true });
    await User.destroy({ where: {}, force: true });
};

const createAdmin = async (email = "admin@test.com") => {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
    return User.create({
        name: "Admin",
        email,
        password: hashed,
        role: "admin",
    });
};

const loginAsAdmin = async (request, app, email = "admin@test.com") => {
    await createAdmin(email);

    const res = await request(app)
        .post("/api/auth/login")
        .send({ email, password: ADMIN_PASSWORD });

    return res.body.data.token;
};

module.exports = {
    ADMIN_PASSWORD,
    resetDb,
    createAdmin,
    loginAsAdmin,
    sequelize,
};

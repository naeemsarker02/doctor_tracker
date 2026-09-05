require("dotenv").config();
const bcrypt = require("bcryptjs");
const { sequelize } = require("./src/config/database");
const { User } = require("./src/models");

const seedAdmin = async () => {
    try {
        const { ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

        if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
            console.error("❌ ADMIN_EMAIL and ADMIN_PASSWORD must be set in the environment.");
            process.exit(1);
        }

        await sequelize.authenticate();

        const existingAdmin = await User.findOne({
            where: { email: ADMIN_EMAIL },
        });

        const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

        if (existingAdmin) {
            existingAdmin.password = hashedPassword;
            await existingAdmin.save();
            console.log("✅ Admin password updated successfully.");
            process.exit(0);
        }

        await User.create({
            name: "Admin",
            email: ADMIN_EMAIL,
            password: hashedPassword,
            role: "admin",
        });

        console.log("✅ Admin user created successfully.");

        process.exit(0);
    } catch (error) {
        console.error("❌ Failed to create admin:", error.message);
        process.exit(1);
    }
};

seedAdmin();

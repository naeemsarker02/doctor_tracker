const { Sequelize } = require("sequelize");
require("dotenv").config();

const env = process.env.NODE_ENV || "development";
const config = require("./config.js")[env];

const sequelize = new Sequelize(
    config.database,
    config.username,
    config.password,
    {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: config.logging,
    }
);

const testDatabaseConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log("✅ MySQL database connected successfully.");
    } catch (error) {
        console.error("❌ Database connection failed:", error.message);
    }
};

module.exports = {
    sequelize,
    testDatabaseConnection,
};

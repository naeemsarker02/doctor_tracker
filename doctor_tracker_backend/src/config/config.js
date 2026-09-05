require("dotenv").config();

const fs = require("fs");
const path = require("path");

const getSslCertificate = () => {
    // Render / Production
    if (process.env.NODE_ENV === "production") {
        if (!process.env.DB_SSL_CA) {
            throw new Error("DB_SSL_CA environment variable is missing.");
        }

        return Buffer.from(process.env.DB_SSL_CA);
    }

    // Local / Development
    const caPath = path.join(__dirname, "../../.ca.pem");

    if (!fs.existsSync(caPath)) {
        throw new Error(`CA certificate not found at: ${caPath}`);
    }

    return fs.readFileSync(caPath);
};

const base = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    dialect: "mysql",
    logging: false,

    dialectOptions: {
        ssl: {
            ca: getSslCertificate(),
            rejectUnauthorized: true,
        },
    },
};

module.exports = {
    development: base,

    test: {
        ...base,
        database:
            process.env.DB_NAME_TEST ||
            `${process.env.DB_NAME}_test`,
    },

    production: base,
};
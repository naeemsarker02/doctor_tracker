require("dotenv").config();

const base = {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: "mysql",
    logging: false,
};

module.exports = {
    development: base,
    test: {
        ...base,
        database: process.env.DB_NAME_TEST || `${process.env.DB_NAME}_test`,
    },
    production: base,
};

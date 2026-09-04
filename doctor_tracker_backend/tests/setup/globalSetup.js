const mysql = require("mysql2/promise");
const { execSync } = require("child_process");
const path = require("path");

require("dotenv").config();

module.exports = async () => {
    const config = require("../../src/config/config.js").test;

    const connection = await mysql.createConnection({
        host: config.host,
        port: config.port,
        user: config.username,
        password: config.password || "",
    });

    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.database}\``);
    await connection.end();

    execSync("npx sequelize-cli db:migrate --env test", {
        cwd: path.resolve(__dirname, "../.."),
        stdio: "inherit",
        env: { ...process.env, NODE_ENV: "test" },
    });
};

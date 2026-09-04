const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const { notFoundHandler, errorHandler } = require("./src/middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
    })
);
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Doctor Tracker API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

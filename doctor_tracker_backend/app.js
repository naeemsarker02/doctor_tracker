const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
require("dotenv").config();

const authRoutes = require("./src/routes/authRoutes");
const doctorRoutes = require("./src/routes/doctorRoutes");
const patientRoutes = require("./src/routes/patientRoutes");
const dashboardRoutes = require("./src/routes/dashboardRoutes");
const appointmentRoutes = require("./src/routes/appointmentRoutes");
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

// Served cross-origin (frontend on a different port), so opt this path out of
// Helmet's default same-origin resource policy.
app.use(
    "/uploads",
    express.static(path.resolve(__dirname, "uploads"), {
        setHeaders: (res) => res.setHeader("Cross-Origin-Resource-Policy", "cross-origin"),
    })
);

app.get("/api/health", (req, res) => {
    res.json({
        success: true,
        message: "Doctor Tracker API is running",
    });
});

app.use("/api/auth", authRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/appointments", appointmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

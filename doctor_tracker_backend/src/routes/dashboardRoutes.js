const express = require("express");
const dashboardController = require("../controllers/dashboardController");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.get("/overview", dashboardController.overview);
router.get("/patients-per-doctor", dashboardController.patientsPerDoctor);
router.get("/patient-trends", dashboardController.patientTrends);
router.get("/conditions", dashboardController.conditions);
router.get("/appointments", dashboardController.appointments);

module.exports = router;

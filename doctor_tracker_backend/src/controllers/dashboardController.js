const dashboardService = require("../services/dashboardService");

const overview = async (req, res, next) => {
    try {
        const data = await dashboardService.getOverview();

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const patientsPerDoctor = async (req, res, next) => {
    try {
        const data = await dashboardService.getPatientsPerDoctor();

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const patientTrends = async (req, res, next) => {
    try {
        const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
        const data = await dashboardService.getPatientTrends(days);

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const conditions = async (req, res, next) => {
    try {
        const data = await dashboardService.getConditionsDistribution();

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

const appointments = async (req, res, next) => {
    try {
        const data = await dashboardService.getAppointmentsSummary();

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    overview,
    patientsPerDoctor,
    patientTrends,
    conditions,
    appointments,
};

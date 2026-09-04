const patientService = require("../services/patientService");

const create = async (req, res, next) => {
    try {
        const patient = await patientService.createPatient(req.body);

        res.status(201).json({
            success: true,
            message: "Patient created successfully",
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
};

const list = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const search = typeof req.query.search === "string" ? req.query.search.trim() : undefined;
        const doctorId = req.query.doctorId ? parseInt(req.query.doctorId, 10) : undefined;

        const result = await patientService.getPatients({ page, limit, search, doctorId });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const getOne = async (req, res, next) => {
    try {
        const patient = await patientService.getPatientById(req.params.id);

        res.status(200).json({
            success: true,
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const patient = await patientService.updatePatient(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Patient updated successfully",
            data: { patient },
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await patientService.deletePatient(req.params.id);

        res.status(200).json({
            success: true,
            message: "Patient deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    list,
    getOne,
    update,
    remove,
};

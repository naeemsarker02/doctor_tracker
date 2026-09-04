const doctorService = require("../services/doctorService");

const create = async (req, res, next) => {
    try {
        const doctor = await doctorService.createDoctor(req.body);

        res.status(201).json({
            success: true,
            message: "Doctor created successfully",
            data: { doctor },
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

        const result = await doctorService.getDoctors({ page, limit, search });

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
        const doctor = await doctorService.getDoctorById(req.params.id);

        res.status(200).json({
            success: true,
            data: { doctor },
        });
    } catch (error) {
        next(error);
    }
};

const getPatients = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);

        const result = await doctorService.getDoctorPatients(req.params.id, { page, limit });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const doctor = await doctorService.updateDoctor(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Doctor updated successfully",
            data: { doctor },
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await doctorService.deleteDoctor(req.params.id);

        res.status(200).json({
            success: true,
            message: "Doctor deleted successfully",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    list,
    getOne,
    getPatients,
    update,
    remove,
};

const appointmentService = require("../services/appointmentService");

const create = async (req, res, next) => {
    try {
        const appointment = await appointmentService.createAppointment(req.body);

        res.status(201).json({
            success: true,
            message: "Appointment created successfully",
            data: { appointment },
        });
    } catch (error) {
        next(error);
    }
};

const list = async (req, res, next) => {
    try {
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
        const doctorId = req.query.doctorId ? parseInt(req.query.doctorId, 10) : undefined;
        const patientId = req.query.patientId ? parseInt(req.query.patientId, 10) : undefined;
        const status = typeof req.query.status === "string" ? req.query.status : undefined;
        const date = typeof req.query.date === "string" ? req.query.date : undefined;

        const result = await appointmentService.getAppointments({
            page,
            limit,
            doctorId,
            patientId,
            status,
            date,
        });

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
        const appointment = await appointmentService.getAppointmentById(req.params.id);

        res.status(200).json({
            success: true,
            data: { appointment },
        });
    } catch (error) {
        next(error);
    }
};

const update = async (req, res, next) => {
    try {
        const appointment = await appointmentService.updateAppointment(req.params.id, req.body);

        res.status(200).json({
            success: true,
            message: "Appointment updated successfully",
            data: { appointment },
        });
    } catch (error) {
        next(error);
    }
};

const remove = async (req, res, next) => {
    try {
        await appointmentService.deleteAppointment(req.params.id);

        res.status(200).json({
            success: true,
            message: "Appointment deleted successfully",
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

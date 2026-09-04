const { Op } = require("sequelize");
const { Patient, Doctor } = require("../models");
const AppError = require("../utils/AppError");

const assertDoctorExists = async (doctorId) => {
    const doctor = await Doctor.findByPk(doctorId);

    if (!doctor) {
        throw new AppError("Doctor not found for the given doctorId", 400);
    }
};

const createPatient = async (data) => {
    await assertDoctorExists(data.doctorId);
    return Patient.create(data);
};

const getPatients = async ({ page, limit, search, doctorId }) => {
    const where = {};

    if (doctorId) {
        where.doctorId = doctorId;
    }

    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { condition: { [Op.like]: `%${search}%` } },
            { phone: { [Op.like]: `%${search}%` } },
        ];
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await Patient.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
        include: [{ model: Doctor, as: "doctor", attributes: ["id", "name", "specialization"] }],
    });

    return {
        patients: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.max(Math.ceil(count / limit), 1),
        },
    };
};

const getPatientById = async (id) => {
    const patient = await Patient.findByPk(id, {
        include: [{ model: Doctor, as: "doctor", attributes: ["id", "name", "specialization"] }],
    });

    if (!patient) {
        throw new AppError("Patient not found", 404);
    }

    return patient;
};

const updatePatient = async (id, data) => {
    const patient = await Patient.findByPk(id);

    if (!patient) {
        throw new AppError("Patient not found", 404);
    }

    if (data.doctorId) {
        await assertDoctorExists(data.doctorId);
    }

    await patient.update(data);
    return patient;
};

const deletePatient = async (id) => {
    const patient = await Patient.findByPk(id);

    if (!patient) {
        throw new AppError("Patient not found", 404);
    }

    await patient.destroy();
};

module.exports = {
    createPatient,
    getPatients,
    getPatientById,
    updatePatient,
    deletePatient,
};

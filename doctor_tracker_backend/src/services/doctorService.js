const { Op } = require("sequelize");
const { Doctor, Patient, Appointment } = require("../models");
const AppError = require("../utils/AppError");

const createDoctor = async (data) => {
    return Doctor.create(data);
};

const getDoctors = async ({ page, limit, search }) => {
    const where = {};

    if (search) {
        where[Op.or] = [
            { name: { [Op.like]: `%${search}%` } },
            { specialization: { [Op.like]: `%${search}%` } },
            { hospital: { [Op.like]: `%${search}%` } },
        ];
    }

    const offset = (page - 1) * limit;

    const { rows, count } = await Doctor.findAndCountAll({
        where,
        limit,
        offset,
        order: [["createdAt", "DESC"]],
    });

    return {
        doctors: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.max(Math.ceil(count / limit), 1),
        },
    };
};

const getDoctorById = async (id) => {
    const doctor = await Doctor.findByPk(id);

    if (!doctor) {
        throw new AppError("Doctor not found", 404);
    }

    return doctor;
};

const updateDoctor = async (id, data) => {
    const doctor = await getDoctorById(id);
    await doctor.update(data);
    return doctor;
};

const getDoctorPatients = async (id, { page, limit }) => {
    await getDoctorById(id);

    const offset = (page - 1) * limit;

    const { rows, count } = await Patient.findAndCountAll({
        where: { doctorId: id },
        limit,
        offset,
        order: [["createdAt", "DESC"]],
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

const deleteDoctor = async (id) => {
    const doctor = await getDoctorById(id);

    const patientCount = await Patient.count({ where: { doctorId: id } });

    if (patientCount > 0) {
        throw new AppError(
            "Cannot delete a doctor with existing patients. Reassign or remove their patients first.",
            409
        );
    }

    // "Upcoming" here means still-open appointments — Cancelled and Completed
    // ones are historical and shouldn't block reassigning/removing a doctor.
    const upcomingAppointmentCount = await Appointment.count({
        where: { doctorId: id, status: { [Op.notIn]: ["Cancelled", "Completed"] } },
    });

    if (upcomingAppointmentCount > 0) {
        throw new AppError(
            "Cannot delete a doctor with upcoming appointments. Cancel or reassign them first.",
            409
        );
    }

    await doctor.destroy();
};

module.exports = {
    createDoctor,
    getDoctors,
    getDoctorById,
    getDoctorPatients,
    updateDoctor,
    deleteDoctor,
};

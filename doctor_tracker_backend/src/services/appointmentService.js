const { Op } = require("sequelize");
const { Appointment, Doctor, Patient } = require("../models");
const AppError = require("../utils/AppError");

const DOUBLE_BOOKED_MESSAGE = "This doctor already has an appointment at that date and time.";

const assertDoctorExists = async (doctorId) => {
    const doctor = await Doctor.findByPk(doctorId);
    if (!doctor) {
        throw new AppError("Doctor not found for the given doctorId", 400);
    }
};

const assertPatientExists = async (patientId) => {
    const patient = await Patient.findByPk(patientId);
    if (!patient) {
        throw new AppError("Patient not found for the given patientId", 400);
    }
};

// Friendly, fast pre-check — the composite unique index on
// (doctor_id, appointment_date, appointment_time) is the real guarantee under
// concurrent requests; this just avoids a raw DB error reaching the user in
// the common (non-racing) case. A Cancelled appointment doesn't block the slot.
const assertSlotAvailable = async (doctorId, appointmentDate, appointmentTime, excludeId) => {
    const where = {
        doctorId,
        appointmentDate,
        appointmentTime,
        status: { [Op.ne]: "Cancelled" },
    };
    if (excludeId) {
        where.id = { [Op.ne]: excludeId };
    }

    const existing = await Appointment.findOne({ where });
    if (existing) {
        throw new AppError(DOUBLE_BOOKED_MESSAGE, 409);
    }
};

const withDoubleBookingTranslation = async (fn) => {
    try {
        return await fn();
    } catch (error) {
        if (error.name === "SequelizeUniqueConstraintError") {
            throw new AppError(DOUBLE_BOOKED_MESSAGE, 409);
        }
        throw error;
    }
};

const include = [
    { model: Doctor, as: "doctor", attributes: ["id", "name", "specialization"] },
    { model: Patient, as: "patient", attributes: ["id", "name"] },
];

const createAppointment = async (data) => {
    await assertDoctorExists(data.doctorId);
    await assertPatientExists(data.patientId);
    await assertSlotAvailable(data.doctorId, data.appointmentDate, data.appointmentTime);

    const appointment = await withDoubleBookingTranslation(() => Appointment.create(data));
    return getAppointmentById(appointment.id);
};

const getAppointments = async ({ page, limit, doctorId, patientId, status, date }) => {
    const where = {};
    if (doctorId) where.doctorId = doctorId;
    if (patientId) where.patientId = patientId;
    if (status) where.status = status;
    if (date) where.appointmentDate = date;

    const offset = (page - 1) * limit;

    const { rows, count } = await Appointment.findAndCountAll({
        where,
        limit,
        offset,
        order: [
            ["appointmentDate", "DESC"],
            ["appointmentTime", "DESC"],
        ],
        include,
    });

    return {
        appointments: rows,
        pagination: {
            total: count,
            page,
            limit,
            totalPages: Math.max(Math.ceil(count / limit), 1),
        },
    };
};

const getAppointmentById = async (id) => {
    const appointment = await Appointment.findByPk(id, { include });

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    return appointment;
};

const updateAppointment = async (id, data) => {
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    if (data.doctorId) {
        await assertDoctorExists(data.doctorId);
    }
    if (data.patientId) {
        await assertPatientExists(data.patientId);
    }

    const slotChanged = data.doctorId || data.appointmentDate || data.appointmentTime;
    if (slotChanged) {
        await assertSlotAvailable(
            data.doctorId ?? appointment.doctorId,
            data.appointmentDate ?? appointment.appointmentDate,
            data.appointmentTime ?? appointment.appointmentTime,
            id
        );
    }

    await withDoubleBookingTranslation(() => appointment.update(data));
    return getAppointmentById(id);
};

const deleteAppointment = async (id) => {
    const appointment = await Appointment.findByPk(id);

    if (!appointment) {
        throw new AppError("Appointment not found", 404);
    }

    await appointment.destroy();
};

module.exports = {
    createAppointment,
    getAppointments,
    getAppointmentById,
    updateAppointment,
    deleteAppointment,
};

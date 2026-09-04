const { Op } = require("sequelize");
const { Doctor, Patient, Appointment, sequelize } = require("../models");

const getOverview = async () => {
    const [totalDoctors, totalPatients, doctorsBySpecialization, patientsByGender, recentDoctors, recentPatients] =
        await Promise.all([
            Doctor.count(),
            Patient.count(),
            Doctor.findAll({
                attributes: [
                    "specialization",
                    [sequelize.fn("COUNT", sequelize.col("id")), "count"],
                ],
                group: ["specialization"],
                raw: true,
            }),
            Patient.findAll({
                attributes: [
                    "gender",
                    [sequelize.fn("COUNT", sequelize.col("id")), "count"],
                ],
                group: ["gender"],
                raw: true,
            }),
            Doctor.findAll({
                order: [["createdAt", "DESC"]],
                limit: 5,
            }),
            Patient.findAll({
                order: [["createdAt", "DESC"]],
                limit: 5,
                include: [{ model: Doctor, as: "doctor", attributes: ["id", "name", "specialization"] }],
            }),
        ]);

    return {
        totals: {
            doctors: totalDoctors,
            patients: totalPatients,
        },
        doctorsBySpecialization: doctorsBySpecialization.map((row) => ({
            specialization: row.specialization,
            count: Number(row.count),
        })),
        patientsByGender: patientsByGender.map((row) => ({
            gender: row.gender,
            count: Number(row.count),
        })),
        recentDoctors,
        recentPatients,
    };
};

const getPatientsPerDoctor = async () => {
    const [doctors, counts] = await Promise.all([
        Doctor.findAll({
            attributes: ["id", "name", "specialization"],
            order: [["name", "ASC"]],
        }),
        Patient.findAll({
            attributes: ["doctorId", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
            group: ["doctorId"],
            raw: true,
        }),
    ]);

    const countMap = new Map(counts.map((row) => [row.doctorId, Number(row.count)]));

    return doctors
        .map((doctor) => ({
            doctorId: doctor.id,
            doctorName: doctor.name,
            specialization: doctor.specialization,
            patientCount: countMap.get(doctor.id) || 0,
        }))
        .sort((a, b) => b.patientCount - a.patientCount);
};

const formatLocalDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getPatientTrends = async (days = 30) => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1));

    // Bucketed in JS (not SQL DATE()) so the grouping uses the server's local
    // calendar day consistently, regardless of the DB driver's timezone handling.
    const patients = await Patient.findAll({
        attributes: ["createdAt"],
        where: { createdAt: { [Op.gte]: start } },
        raw: true,
    });

    const countMap = new Map();
    patients.forEach((patient) => {
        const key = formatLocalDateKey(new Date(patient.createdAt));
        countMap.set(key, (countMap.get(key) || 0) + 1);
    });

    const trends = [];
    for (let i = 0; i < days; i += 1) {
        const day = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
        const key = formatLocalDateKey(day);
        trends.push({ date: key, count: countMap.get(key) || 0 });
    }

    return trends;
};

const getConditionsDistribution = async () => {
    const rows = await Patient.findAll({
        attributes: ["condition", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: ["condition"],
        raw: true,
    });

    return rows
        .map((row) => ({ condition: row.condition, count: Number(row.count) }))
        .sort((a, b) => b.count - a.count);
};

const getAppointmentsSummary = async () => {
    const todayKey = formatLocalDateKey(new Date());

    const [total, today, upcoming, statusDistribution, todayList] = await Promise.all([
        Appointment.count(),
        Appointment.count({
            where: { appointmentDate: todayKey, status: { [Op.ne]: "Cancelled" } },
        }),
        Appointment.count({
            where: {
                appointmentDate: { [Op.gt]: todayKey },
                status: { [Op.ne]: "Cancelled" },
            },
        }),
        Appointment.findAll({
            attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
            group: ["status"],
            raw: true,
        }),
        Appointment.findAll({
            where: { appointmentDate: todayKey },
            order: [["appointmentTime", "ASC"]],
            limit: 10,
            include: [
                { model: Doctor, as: "doctor", attributes: ["id", "name"] },
                { model: Patient, as: "patient", attributes: ["id", "name"] },
            ],
        }),
    ]);

    return {
        total,
        today,
        upcoming,
        statusDistribution: statusDistribution.map((row) => ({
            status: row.status,
            count: Number(row.count),
        })),
        list: todayList,
    };
};

module.exports = {
    getOverview,
    getPatientsPerDoctor,
    getPatientTrends,
    getConditionsDistribution,
    getAppointmentsSummary,
};

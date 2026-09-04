const { DataTypes } = require("sequelize");

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

module.exports = (sequelize) => {
    const Appointment = sequelize.define(
        "Appointment",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            doctorId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: "doctor_id",
            },

            patientId: {
                type: DataTypes.INTEGER,
                allowNull: false,
                field: "patient_id",
            },

            // Stored as separate DATE/TIME columns (not a combined DATETIME) to
            // avoid timezone-shift bugs — this panel is used from one region and
            // "3pm" should always mean the same wall-clock 3pm regardless of how
            // the DB driver/server timezone happens to be configured.
            appointmentDate: {
                type: DataTypes.DATEONLY,
                allowNull: false,
                field: "appointment_date",
            },

            appointmentTime: {
                type: DataTypes.TIME,
                allowNull: false,
                field: "appointment_time",
            },

            reason: {
                type: DataTypes.STRING,
                allowNull: true,
            },

            status: {
                type: DataTypes.ENUM(...STATUSES),
                allowNull: false,
                defaultValue: "Pending",
            },
        },
        {
            tableName: "appointments",
            timestamps: true,
            paranoid: true,
        }
    );

    Appointment.STATUSES = STATUSES;

    Appointment.associate = (models) => {
        Appointment.belongsTo(models.Doctor, {
            foreignKey: "doctorId",
            as: "doctor",
        });
        Appointment.belongsTo(models.Patient, {
            foreignKey: "patientId",
            as: "patient",
        });
    };

    return Appointment;
};

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Doctor = sequelize.define(
        "Doctor",
        {
            id: {
                type: DataTypes.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },

            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            specialization: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            hospital: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            phone: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            email: {
                type: DataTypes.STRING,
                allowNull: true,
                validate: {
                    isEmail: true,
                },
            },
        },
        {
            tableName: "doctors",
            timestamps: true,
            paranoid: true,
        }
    );

    Doctor.associate = (models) => {
        Doctor.hasMany(models.Patient, {
            foreignKey: "doctorId",
            as: "patients",
            onDelete: "RESTRICT",
        });
        Doctor.hasMany(models.Appointment, {
            foreignKey: "doctorId",
            as: "appointments",
            onDelete: "RESTRICT",
        });
    };

    return Doctor;
};

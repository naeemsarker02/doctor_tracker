const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
    const Patient = sequelize.define(
        "Patient",
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

            name: {
                type: DataTypes.STRING,
                allowNull: false,
            },

            age: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },

            gender: {
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

            condition: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        },
        {
            tableName: "patients",
            timestamps: true,
            paranoid: true,
        }
    );

    Patient.associate = (models) => {
        Patient.belongsTo(models.Doctor, {
            foreignKey: "doctorId",
            as: "doctor",
        });
    };

    return Patient;
};

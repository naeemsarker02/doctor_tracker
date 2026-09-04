"use strict";

module.exports = {
    up: async (queryInterface, Sequelize) => {
        await queryInterface.createTable("appointments", {
            id: {
                type: Sequelize.INTEGER,
                autoIncrement: true,
                primaryKey: true,
            },
            doctor_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "doctors",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
            patient_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: "patients",
                    key: "id",
                },
                onUpdate: "CASCADE",
                onDelete: "RESTRICT",
            },
            appointment_date: {
                type: Sequelize.DATEONLY,
                allowNull: false,
            },
            appointment_time: {
                type: Sequelize.TIME,
                allowNull: false,
            },
            reason: {
                type: Sequelize.STRING,
                allowNull: true,
            },
            status: {
                type: Sequelize.ENUM("Pending", "Confirmed", "Completed", "Cancelled"),
                allowNull: false,
                defaultValue: "Pending",
            },
            createdAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            updatedAt: {
                type: Sequelize.DATE,
                allowNull: false,
            },
            deletedAt: {
                type: Sequelize.DATE,
                allowNull: true,
            },
        });

        // Generated column, NULL whenever the appointment is Cancelled or
        // soft-deleted, a constant 1 otherwise. MySQL unique indexes treat every
        // NULL as distinct from every other NULL, so cancelled/deleted rows never
        // collide with each other or with a live booking — while two genuinely
        // *active* appointments for the same doctor/date/time (both slot_lock = 1)
        // still correctly violate uniqueness. This is what makes "cancel to free
        // the doctor's slot" actually hold at the DB level under concurrent
        // requests, not just in the app-layer pre-check (appointmentService.js's
        // assertSlotAvailable already excludes Cancelled — this column makes the
        // raw constraint agree with that business rule instead of contradicting it).
        await queryInterface.sequelize.query(`
            ALTER TABLE appointments
            ADD COLUMN slot_lock TINYINT
            GENERATED ALWAYS AS (IF(status = 'Cancelled' OR deletedAt IS NOT NULL, NULL, 1)) STORED
        `);

        await queryInterface.addIndex("appointments", {
            fields: ["doctor_id", "appointment_date", "appointment_time", "slot_lock"],
            unique: true,
            name: "appointments_doctor_date_time_unique",
        });
    },

    down: async (queryInterface) => {
        await queryInterface.dropTable("appointments");
    },
};

const { z } = require("zod");

const STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"];

const dateField = z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "appointmentDate must be in YYYY-MM-DD format");

const timeField = z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/, "appointmentTime must be in HH:MM (24-hour) format");

const createAppointmentSchema = z.object({
    doctorId: z.coerce.number().int().positive("doctorId must be a positive integer"),
    patientId: z.coerce.number().int().positive("patientId must be a positive integer"),
    appointmentDate: dateField,
    appointmentTime: timeField,
    reason: z.string().max(255).optional(),
    status: z.enum(STATUSES).optional(),
});

const updateAppointmentSchema = createAppointmentSchema.partial();

const idParamSchema = z.object({
    id: z.coerce.number().int().positive("Id must be a positive integer"),
});

module.exports = { createAppointmentSchema, updateAppointmentSchema, idParamSchema, STATUSES };

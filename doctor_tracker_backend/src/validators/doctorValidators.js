const { z } = require("zod");

const emailField = z
    .string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value));

const createDoctorSchema = z.object({
    name: z.string().min(1, "Name is required"),
    specialization: z.string().min(1, "Specialization is required"),
    hospital: z.string().min(1, "Hospital is required"),
    phone: z.string().min(1, "Phone is required"),
    email: emailField,
});

const updateDoctorSchema = createDoctorSchema.partial();

const idParamSchema = z.object({
    id: z.coerce.number().int().positive("Id must be a positive integer"),
});

module.exports = { createDoctorSchema, updateDoctorSchema, idParamSchema };

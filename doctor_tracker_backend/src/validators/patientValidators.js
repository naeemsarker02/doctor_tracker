const { z } = require("zod");

const emailField = z
    .string()
    .email("Must be a valid email address")
    .optional()
    .or(z.literal(""))
    .transform((value) => (value === "" ? null : value));

const createPatientSchema = z.object({
    doctorId: z.coerce.number().int().positive("doctorId must be a positive integer"),
    name: z.string().min(1, "Name is required"),
    age: z.coerce.number().int().min(0, "Age must be a non-negative integer"),
    gender: z.string().min(1, "Gender is required"),
    phone: z.string().min(1, "Phone is required"),
    email: emailField,
    condition: z.string().min(1, "Condition is required"),
});

const updatePatientSchema = createPatientSchema.partial();

const idParamSchema = z.object({
    id: z.coerce.number().int().positive("Id must be a positive integer"),
});

module.exports = { createPatientSchema, updatePatientSchema, idParamSchema };

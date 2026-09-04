const { z } = require("zod");

const loginSchema = z.object({
    email: z.string().email("Must be a valid email address"),
    password: z.string().min(1, "Password is required"),
});

const updateProfileSchema = z.object({
    name: z.string().min(1, "Name is required").optional(),
    email: z.string().email("Must be a valid email address").optional(),
});

const changePasswordSchema = z
    .object({
        currentPassword: z.string().min(1, "Current password is required"),
        newPassword: z.string().min(6, "New password must be at least 6 characters"),
    })
    .refine((data) => data.currentPassword !== data.newPassword, {
        message: "New password must be different from the current password",
        path: ["newPassword"],
    });

module.exports = { loginSchema, updateProfileSchema, changePasswordSchema };

import { api } from "@/lib/api";
import type { User } from "@/context/AuthContext";

export type UpdateProfileInput = {
    name?: string;
    email?: string;
};

export type ChangePasswordInput = {
    currentPassword: string;
    newPassword: string;
};

export const updateProfile = async (input: UpdateProfileInput): Promise<User> => {
    const res = await api.put("/auth/me", input);
    return res.data.data.user;
};

export const changePassword = async (input: ChangePasswordInput): Promise<void> => {
    await api.put("/auth/password", input);
};

export const uploadAvatar = async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append("avatar", file);
    const res = await api.post("/auth/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.data.user;
};

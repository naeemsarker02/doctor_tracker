import { api } from "@/lib/api";

export type Doctor = {
    id: number;
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email: string | null;
    createdAt: string;
    updatedAt: string;
};

export type DoctorInput = {
    name: string;
    specialization: string;
    hospital: string;
    phone: string;
    email?: string;
};

export type Pagination = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
};

export type DoctorsListParams = {
    page?: number;
    limit?: number;
    search?: string;
};

export const listDoctors = async (
    params: DoctorsListParams
): Promise<{ doctors: Doctor[]; pagination: Pagination }> => {
    const res = await api.get("/doctors", { params });
    return res.data.data;
};

export const getDoctor = async (id: number): Promise<Doctor> => {
    const res = await api.get(`/doctors/${id}`);
    return res.data.data.doctor;
};

export type DoctorPatient = {
    id: number;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string | null;
    condition: string;
    createdAt: string;
};

export const listDoctorPatients = async (
    id: number,
    params: { page?: number; limit?: number }
): Promise<{ patients: DoctorPatient[]; pagination: Pagination }> => {
    const res = await api.get(`/doctors/${id}/patients`, { params });
    return res.data.data;
};

export const createDoctor = async (input: DoctorInput): Promise<Doctor> => {
    const res = await api.post("/doctors", input);
    return res.data.data.doctor;
};

export const updateDoctor = async (id: number, input: Partial<DoctorInput>): Promise<Doctor> => {
    const res = await api.put(`/doctors/${id}`, input);
    return res.data.data.doctor;
};

export const deleteDoctor = async (id: number): Promise<void> => {
    await api.delete(`/doctors/${id}`);
};

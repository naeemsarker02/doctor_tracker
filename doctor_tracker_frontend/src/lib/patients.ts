import { api } from "@/lib/api";
import type { Pagination } from "@/lib/doctors";

export type Patient = {
    id: number;
    doctorId: number;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email: string | null;
    condition: string;
    createdAt: string;
    updatedAt: string;
    doctor: { id: number; name: string; specialization: string } | null;
};

export type PatientInput = {
    doctorId: number;
    name: string;
    age: number;
    gender: string;
    phone: string;
    email?: string;
    condition: string;
};

export type PatientsListParams = {
    page?: number;
    limit?: number;
    search?: string;
    doctorId?: number;
};

export const listPatients = async (
    params: PatientsListParams
): Promise<{ patients: Patient[]; pagination: Pagination }> => {
    const res = await api.get("/patients", { params });
    return res.data.data;
};

export const getPatient = async (id: number): Promise<Patient> => {
    const res = await api.get(`/patients/${id}`);
    return res.data.data.patient;
};

export const createPatient = async (input: PatientInput): Promise<Patient> => {
    const res = await api.post("/patients", input);
    return res.data.data.patient;
};

export const updatePatient = async (id: number, input: Partial<PatientInput>): Promise<Patient> => {
    const res = await api.put(`/patients/${id}`, input);
    return res.data.data.patient;
};

export const deletePatient = async (id: number): Promise<void> => {
    await api.delete(`/patients/${id}`);
};

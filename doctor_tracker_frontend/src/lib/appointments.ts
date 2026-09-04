import { api } from "@/lib/api";
import type { Pagination } from "@/lib/doctors";

export const APPOINTMENT_STATUSES = ["Pending", "Confirmed", "Completed", "Cancelled"] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export type Appointment = {
    id: number;
    doctorId: number;
    patientId: number;
    appointmentDate: string;
    appointmentTime: string;
    reason: string | null;
    status: AppointmentStatus;
    createdAt: string;
    updatedAt: string;
    doctor: { id: number; name: string; specialization: string } | null;
    patient: { id: number; name: string } | null;
};

export type AppointmentInput = {
    doctorId: number;
    patientId: number;
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
    status?: AppointmentStatus;
};

export type AppointmentsListParams = {
    page?: number;
    limit?: number;
    doctorId?: number;
    patientId?: number;
    status?: AppointmentStatus;
    date?: string;
};

export const listAppointments = async (
    params: AppointmentsListParams
): Promise<{ appointments: Appointment[]; pagination: Pagination }> => {
    const res = await api.get("/appointments", { params });
    return res.data.data;
};

export const createAppointment = async (input: AppointmentInput): Promise<Appointment> => {
    const res = await api.post("/appointments", input);
    return res.data.data.appointment;
};

export const updateAppointment = async (
    id: number,
    input: Partial<AppointmentInput>
): Promise<Appointment> => {
    const res = await api.put(`/appointments/${id}`, input);
    return res.data.data.appointment;
};

export const deleteAppointment = async (id: number): Promise<void> => {
    await api.delete(`/appointments/${id}`);
};

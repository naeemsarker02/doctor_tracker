import { api } from "@/lib/api";

export type Overview = {
    totals: { doctors: number; patients: number };
    doctorsBySpecialization: { specialization: string; count: number }[];
    patientsByGender: { gender: string; count: number }[];
    recentDoctors: {
        id: number;
        name: string;
        specialization: string;
        hospital: string;
        createdAt: string;
    }[];
    recentPatients: {
        id: number;
        name: string;
        condition: string;
        createdAt: string;
        doctor: { id: number; name: string; specialization: string } | null;
    }[];
};

export type PatientsPerDoctor = {
    doctorId: number;
    doctorName: string;
    specialization: string;
    patientCount: number;
}[];

export type PatientTrend = { date: string; count: number }[];

export type ConditionsDistribution = { condition: string; count: number }[];

export type AppointmentsSummary = {
    total: number;
    today: number;
    upcoming: number;
    statusDistribution: { status: string; count: number }[];
    list: {
        id: number;
        appointmentDate: string;
        appointmentTime: string;
        status: string;
        doctor: { id: number; name: string } | null;
        patient: { id: number; name: string } | null;
    }[];
};

export const getOverview = async (): Promise<Overview> => {
    const res = await api.get("/dashboard/overview");
    return res.data.data;
};

export const getPatientsPerDoctor = async (): Promise<PatientsPerDoctor> => {
    const res = await api.get("/dashboard/patients-per-doctor");
    return res.data.data;
};

export const getPatientTrends = async (days = 14): Promise<PatientTrend> => {
    const res = await api.get(`/dashboard/patient-trends?days=${days}`);
    return res.data.data;
};

export const getConditions = async (): Promise<ConditionsDistribution> => {
    const res = await api.get("/dashboard/conditions");
    return res.data.data;
};

export const getAppointments = async (): Promise<AppointmentsSummary> => {
    const res = await api.get("/dashboard/appointments");
    return res.data.data;
};

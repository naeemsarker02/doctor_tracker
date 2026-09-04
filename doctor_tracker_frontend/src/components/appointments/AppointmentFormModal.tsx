"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { listDoctors } from "@/lib/doctors";
import { listPatients } from "@/lib/patients";
import {
    APPOINTMENT_STATUSES,
    createAppointment,
    updateAppointment,
    type Appointment,
    type AppointmentInput,
} from "@/lib/appointments";

type FormState = {
    doctorId: string;
    patientId: string;
    appointmentDate: string;
    appointmentTime: string;
    reason: string;
    status: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
    doctorId: "",
    patientId: "",
    appointmentDate: "",
    appointmentTime: "",
    reason: "",
    status: "Pending",
};

export function AppointmentFormModal({
    isOpen,
    onClose,
    appointment,
    defaultDoctorId,
    defaultPatientId,
}: {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    defaultDoctorId?: number;
    defaultPatientId?: number;
}) {
    const queryClient = useQueryClient();
    const isEditing = Boolean(appointment);

    const [form, setForm] = useState<FormState>(emptyForm);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const doctorsQuery = useQuery({
        queryKey: ["doctors", "select-list"],
        queryFn: () => listDoctors({ page: 1, limit: 100 }),
        enabled: isOpen,
    });

    const patientsQuery = useQuery({
        queryKey: ["patients", "select-list"],
        queryFn: () => listPatients({ page: 1, limit: 100 }),
        enabled: isOpen,
    });

    useEffect(() => {
        if (!isOpen) return;
        setFieldErrors({});
        setForm(
            appointment
                ? {
                      doctorId: String(appointment.doctorId),
                      patientId: String(appointment.patientId),
                      appointmentDate: appointment.appointmentDate,
                      appointmentTime: appointment.appointmentTime.slice(0, 5),
                      reason: appointment.reason ?? "",
                      status: appointment.status,
                  }
                : {
                      ...emptyForm,
                      doctorId: defaultDoctorId ? String(defaultDoctorId) : "",
                      patientId: defaultPatientId ? String(defaultPatientId) : "",
                  }
        );
    }, [isOpen, appointment, defaultDoctorId, defaultPatientId]);

    const mutation = useMutation({
        mutationFn: (input: AppointmentInput) =>
            isEditing ? updateAppointment(appointment!.id, input) : createAppointment(input),
        onSuccess: () => {
            toast.success(isEditing ? "Appointment updated" : "Appointment booked");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            onClose();
        },
        onError: (err) => {
            if (axios.isAxiosError(err) && err.response?.data?.errors) {
                const errors: FieldErrors = {};
                for (const item of err.response.data.errors as { field: string; message: string }[]) {
                    errors[item.field as keyof FormState] = item.message;
                }
                setFieldErrors(errors);
                return;
            }
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Something went wrong. Please try again.";
            toast.error(message);
        },
    });

    const handleSubmit = (event: FormEvent) => {
        event.preventDefault();
        setFieldErrors({});
        mutation.mutate({
            doctorId: Number(form.doctorId),
            patientId: Number(form.patientId),
            appointmentDate: form.appointmentDate,
            appointmentTime: form.appointmentTime,
            reason: form.reason,
            ...(isEditing ? { status: form.status as AppointmentInput["status"] } : {}),
        });
    };

    const doctors = doctorsQuery.data?.doctors ?? [];
    const patients = patientsQuery.data?.patients ?? [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Appointment" : "Book Appointment"}
            description={
                isEditing ? "Update this appointment's details." : "Schedule a new appointment."
            }
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                <Select
                    id="doctorId"
                    label="Doctor"
                    value={form.doctorId}
                    onChange={(event) => setForm((prev) => ({ ...prev, doctorId: event.target.value }))}
                    error={fieldErrors.doctorId}
                    required
                >
                    <option value="" disabled>
                        {doctorsQuery.isLoading ? "Loading doctors..." : "Select a doctor"}
                    </option>
                    {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                            {doctor.name} — {doctor.specialization}
                        </option>
                    ))}
                </Select>

                <Select
                    id="patientId"
                    label="Patient"
                    value={form.patientId}
                    onChange={(event) => setForm((prev) => ({ ...prev, patientId: event.target.value }))}
                    error={fieldErrors.patientId}
                    required
                >
                    <option value="" disabled>
                        {patientsQuery.isLoading ? "Loading patients..." : "Select a patient"}
                    </option>
                    {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>
                            {patient.name}
                        </option>
                    ))}
                </Select>

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        id="appointmentDate"
                        label="Date"
                        type="date"
                        value={form.appointmentDate}
                        onChange={(event) =>
                            setForm((prev) => ({ ...prev, appointmentDate: event.target.value }))
                        }
                        error={fieldErrors.appointmentDate}
                        required
                    />
                    <Input
                        id="appointmentTime"
                        label="Time"
                        type="time"
                        value={form.appointmentTime}
                        onChange={(event) =>
                            setForm((prev) => ({ ...prev, appointmentTime: event.target.value }))
                        }
                        error={fieldErrors.appointmentTime}
                        required
                    />
                </div>

                <Input
                    id="reason"
                    label="Reason (optional)"
                    placeholder="Follow-up checkup"
                    value={form.reason}
                    onChange={(event) => setForm((prev) => ({ ...prev, reason: event.target.value }))}
                    error={fieldErrors.reason}
                />

                {isEditing && (
                    <Select
                        id="status"
                        label="Status"
                        value={form.status}
                        onChange={(event) => setForm((prev) => ({ ...prev, status: event.target.value }))}
                    >
                        {APPOINTMENT_STATUSES.map((status) => (
                            <option key={status} value={status}>
                                {status}
                            </option>
                        ))}
                    </Select>
                )}

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={mutation.isPending}>
                        {isEditing ? "Save changes" : "Book appointment"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

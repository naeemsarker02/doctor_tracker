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
import { createPatient, updatePatient, type Patient, type PatientInput } from "@/lib/patients";

type FormState = {
    doctorId: string;
    name: string;
    age: string;
    gender: string;
    phone: string;
    email: string;
    condition: string;
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

const emptyForm: FormState = {
    doctorId: "",
    name: "",
    age: "",
    gender: "female",
    phone: "",
    email: "",
    condition: "",
};

export function PatientFormModal({
    isOpen,
    onClose,
    patient,
    defaultDoctorId,
}: {
    isOpen: boolean;
    onClose: () => void;
    patient: Patient | null;
    defaultDoctorId?: number;
}) {
    const queryClient = useQueryClient();
    const isEditing = Boolean(patient);

    const [form, setForm] = useState<FormState>(emptyForm);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    const doctorsQuery = useQuery({
        queryKey: ["doctors", "select-list"],
        queryFn: () => listDoctors({ page: 1, limit: 100 }),
        enabled: isOpen,
    });

    useEffect(() => {
        if (!isOpen) return;
        // Reset local form state to match whichever patient (or none) this modal
        // was opened for - intentional prop-driven sync, not derivable at render time.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setFieldErrors({});
        setForm(
            patient
                ? {
                      doctorId: String(patient.doctorId),
                      name: patient.name,
                      age: String(patient.age),
                      gender: patient.gender,
                      phone: patient.phone,
                      email: patient.email ?? "",
                      condition: patient.condition,
                  }
                : { ...emptyForm, doctorId: defaultDoctorId ? String(defaultDoctorId) : "" }
        );
    }, [isOpen, patient, defaultDoctorId]);

    const mutation = useMutation({
        mutationFn: (input: PatientInput) =>
            isEditing ? updatePatient(patient!.id, input) : createPatient(input),
        onSuccess: () => {
            toast.success(isEditing ? "Patient updated" : "Patient added");
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            // A doctor's detail page lists its own patients under ["doctors", id, "patients", ...] —
            // invalidate that prefix too so adding/reassigning a patient refreshes it.
            queryClient.invalidateQueries({ queryKey: ["doctors"] });
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
            name: form.name,
            age: Number(form.age),
            gender: form.gender,
            phone: form.phone,
            email: form.email,
            condition: form.condition,
        });
    };

    const set = (field: keyof FormState) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: event.target.value }));

    const doctors = doctorsQuery.data?.doctors ?? [];

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Patient" : "Add Patient"}
            description={isEditing ? "Update this patient's details." : "Register a new patient."}
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

                <Input
                    id="name"
                    label="Full name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={set("name")}
                    error={fieldErrors.name}
                    required
                />

                <div className="grid grid-cols-2 gap-3">
                    <Input
                        id="age"
                        label="Age"
                        type="number"
                        min={0}
                        placeholder="30"
                        value={form.age}
                        onChange={set("age")}
                        error={fieldErrors.age}
                        required
                    />
                    <Select
                        id="gender"
                        label="Gender"
                        value={form.gender}
                        onChange={(event) => setForm((prev) => ({ ...prev, gender: event.target.value }))}
                        error={fieldErrors.gender}
                        required
                    >
                        <option value="female">Female</option>
                        <option value="male">Male</option>
                        <option value="other">Other</option>
                    </Select>
                </div>

                <Input
                    id="phone"
                    label="Phone"
                    placeholder="01700000000"
                    value={form.phone}
                    onChange={set("phone")}
                    error={fieldErrors.phone}
                    required
                />
                <Input
                    id="email"
                    label="Email (optional)"
                    type="email"
                    placeholder="patient@example.com"
                    value={form.email}
                    onChange={set("email")}
                    error={fieldErrors.email}
                />
                <Input
                    id="condition"
                    label="Condition"
                    placeholder="Flu"
                    value={form.condition}
                    onChange={set("condition")}
                    error={fieldErrors.condition}
                    required
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={mutation.isPending}>
                        {isEditing ? "Save changes" : "Add patient"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

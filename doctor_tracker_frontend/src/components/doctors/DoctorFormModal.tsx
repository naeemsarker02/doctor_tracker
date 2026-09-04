"use client";

import { FormEvent, useEffect, useState } from "react";
import axios from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createDoctor, updateDoctor, type Doctor, type DoctorInput } from "@/lib/doctors";

type FieldErrors = Partial<Record<keyof DoctorInput, string>>;

const emptyForm: DoctorInput = {
    name: "",
    specialization: "",
    hospital: "",
    phone: "",
    email: "",
};

export function DoctorFormModal({
    isOpen,
    onClose,
    doctor,
}: {
    isOpen: boolean;
    onClose: () => void;
    doctor: Doctor | null;
}) {
    const queryClient = useQueryClient();
    const isEditing = Boolean(doctor);

    const [form, setForm] = useState<DoctorInput>(emptyForm);
    const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

    useEffect(() => {
        if (!isOpen) return;
        setFieldErrors({});
        setForm(
            doctor
                ? {
                      name: doctor.name,
                      specialization: doctor.specialization,
                      hospital: doctor.hospital,
                      phone: doctor.phone,
                      email: doctor.email ?? "",
                  }
                : emptyForm
        );
    }, [isOpen, doctor]);

    const mutation = useMutation({
        mutationFn: (input: DoctorInput) =>
            isEditing ? updateDoctor(doctor!.id, input) : createDoctor(input),
        onSuccess: () => {
            toast.success(isEditing ? "Doctor updated" : "Doctor added");
            queryClient.invalidateQueries({ queryKey: ["doctors"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            onClose();
        },
        onError: (err) => {
            if (axios.isAxiosError(err) && err.response?.data?.errors) {
                const errors: FieldErrors = {};
                for (const item of err.response.data.errors as { field: string; message: string }[]) {
                    errors[item.field as keyof DoctorInput] = item.message;
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
        mutation.mutate(form);
    };

    const set = (field: keyof DoctorInput) => (event: React.ChangeEvent<HTMLInputElement>) =>
        setForm((prev) => ({ ...prev, [field]: event.target.value }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEditing ? "Edit Doctor" : "Add Doctor"}
            description={isEditing ? "Update this doctor's details." : "Add a new doctor to the roster."}
        >
            <form onSubmit={handleSubmit} className="space-y-3">
                <Input
                    id="name"
                    label="Full name"
                    placeholder="Dr. Jane Smith"
                    value={form.name}
                    onChange={set("name")}
                    error={fieldErrors.name}
                    required
                />
                <Input
                    id="specialization"
                    label="Specialization"
                    placeholder="Cardiology"
                    value={form.specialization}
                    onChange={set("specialization")}
                    error={fieldErrors.specialization}
                    required
                />
                <Input
                    id="hospital"
                    label="Hospital"
                    placeholder="City Hospital"
                    value={form.hospital}
                    onChange={set("hospital")}
                    error={fieldErrors.hospital}
                    required
                />
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
                    placeholder="doctor@example.com"
                    value={form.email}
                    onChange={set("email")}
                    error={fieldErrors.email}
                />

                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="secondary" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={mutation.isPending}>
                        {isEditing ? "Save changes" : "Add doctor"}
                    </Button>
                </div>
            </form>
        </Modal>
    );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, Pencil, Stethoscope } from "lucide-react";
import { getPatient } from "@/lib/patients";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { PatientFormModal } from "@/components/patients/PatientFormModal";

export default function PatientDetailPage() {
    const params = useParams<{ id: string }>();
    const patientId = Number(params.id);

    const [editOpen, setEditOpen] = useState(false);

    const patientQuery = useQuery({
        queryKey: ["patients", patientId],
        queryFn: () => getPatient(patientId),
        enabled: Number.isFinite(patientId),
    });

    if (patientQuery.isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-40 w-full" />
            </div>
        );
    }

    if (patientQuery.isError || !patientQuery.data) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-rose-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400">
                Could not load this patient. They may not exist or may have been removed.
            </div>
        );
    }

    const patient = patientQuery.data;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <Link
                href="/dashboard/patients"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
                <ArrowLeft className="size-4" />
                Back to Patients
            </Link>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                                {patient.name}
                            </h1>
                            <Badge>{patient.condition}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {patient.age} years old · {patient.gender}
                        </p>
                    </div>
                    <Button variant="secondary" onClick={() => setEditOpen(true)}>
                        <Pencil className="size-4" />
                        Edit
                    </Button>
                </div>

                <div className="mt-4 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                    <span className="flex items-center gap-2">
                        <Phone className="size-3.5 text-slate-400" />
                        {patient.phone}
                    </span>
                    {patient.email && (
                        <span className="flex items-center gap-2">
                            <Mail className="size-3.5 text-slate-400" />
                            {patient.email}
                        </span>
                    )}
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-3 flex items-center gap-2">
                    <Stethoscope className="size-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Assigned doctor
                    </h2>
                </div>
                {patient.doctor ? (
                    <Link
                        href={`/dashboard/doctors/${patient.doctor.id}`}
                        className="flex items-center justify-between rounded-lg border border-slate-100 p-3 transition-colors hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/40"
                    >
                        <span className="font-medium text-slate-900 dark:text-white">
                            {patient.doctor.name}
                        </span>
                        <Badge>{patient.doctor.specialization}</Badge>
                    </Link>
                ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">No doctor assigned.</p>
                )}
            </div>

            <PatientFormModal isOpen={editOpen} onClose={() => setEditOpen(false)} patient={patient} />
        </div>
    );
}

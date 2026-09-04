"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Mail, Phone, Pencil, Plus, Users } from "lucide-react";
import { getDoctor, listDoctorPatients } from "@/lib/doctors";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { DoctorFormModal } from "@/components/doctors/DoctorFormModal";
import { PatientFormModal } from "@/components/patients/PatientFormModal";

export default function DoctorDetailPage() {
    const params = useParams<{ id: string }>();
    const doctorId = Number(params.id);

    const [page, setPage] = useState(1);
    const [editOpen, setEditOpen] = useState(false);
    const [addPatientOpen, setAddPatientOpen] = useState(false);

    const doctorQuery = useQuery({
        queryKey: ["doctors", doctorId],
        queryFn: () => getDoctor(doctorId),
        enabled: Number.isFinite(doctorId),
    });

    const patientsQuery = useQuery({
        queryKey: ["doctors", doctorId, "patients", page],
        queryFn: () => listDoctorPatients(doctorId, { page, limit: 10 }),
        enabled: Number.isFinite(doctorId),
        placeholderData: (prev) => prev,
    });

    if (doctorQuery.isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-32 w-full" />
            </div>
        );
    }

    if (doctorQuery.isError || !doctorQuery.data) {
        return (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-rose-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-rose-400">
                Could not load this doctor. They may not exist or may have been removed.
            </div>
        );
    }

    const doctor = doctorQuery.data;
    const patients = patientsQuery.data?.patients ?? [];
    const pagination = patientsQuery.data?.pagination;

    return (
        <div className="space-y-6">
            <Link
                href="/dashboard/doctors"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            >
                <ArrowLeft className="size-4" />
                Back to Doctors
            </Link>

            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                                {doctor.name}
                            </h1>
                            <Badge>{doctor.specialization}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{doctor.hospital}</p>
                        <div className="mt-3 flex flex-col gap-1 text-sm text-slate-600 dark:text-slate-300">
                            <span className="flex items-center gap-2">
                                <Phone className="size-3.5 text-slate-400" />
                                {doctor.phone}
                            </span>
                            {doctor.email && (
                                <span className="flex items-center gap-2">
                                    <Mail className="size-3.5 text-slate-400" />
                                    {doctor.email}
                                </span>
                            )}
                        </div>
                    </div>
                    <Button variant="secondary" onClick={() => setEditOpen(true)}>
                        <Pencil className="size-4" />
                        Edit
                    </Button>
                </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between border-b border-slate-100 p-4 dark:border-slate-800">
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Patients {pagination ? `(${pagination.total})` : ""}
                    </h2>
                    <Button size="sm" onClick={() => setAddPatientOpen(true)}>
                        <Plus className="size-4" />
                        Add Patient
                    </Button>
                </div>

                {patientsQuery.isLoading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : patients.length === 0 ? (
                    <EmptyState
                        icon={<Users className="size-5" />}
                        title="No patients yet"
                        description="Add this doctor's first patient."
                        action={
                            <Button size="sm" onClick={() => setAddPatientOpen(true)}>
                                <Plus className="size-4" />
                                Add Patient
                            </Button>
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs tracking-wide text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Condition</th>
                                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Contact</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {patients.map((patient) => (
                                    <tr key={patient.id}>
                                        <td className="px-4 py-3">
                                            <Link
                                                href={`/dashboard/patients/${patient.id}`}
                                                className="font-medium text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                            >
                                                {patient.name}
                                            </Link>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {patient.age} yrs · {patient.gender}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge>{patient.condition}</Badge>
                                        </td>
                                        <td className="hidden px-4 py-3 text-slate-600 sm:table-cell dark:text-slate-400">
                                            {patient.phone}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {pagination && pagination.total > 0 && (
                    <div className="px-4 pb-4">
                        <Pagination
                            page={pagination.page}
                            totalPages={pagination.totalPages}
                            total={pagination.total}
                            onPageChange={setPage}
                        />
                    </div>
                )}
            </div>

            <DoctorFormModal isOpen={editOpen} onClose={() => setEditOpen(false)} doctor={doctor} />
            <PatientFormModal
                isOpen={addPatientOpen}
                onClose={() => setAddPatientOpen(false)}
                patient={null}
                defaultDoctorId={doctorId}
            />
        </div>
    );
}

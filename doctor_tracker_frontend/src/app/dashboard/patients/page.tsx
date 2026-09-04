"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Users, Mail, Phone } from "lucide-react";
import { listDoctors } from "@/lib/doctors";
import { deletePatient, listPatients, type Patient } from "@/lib/patients";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PatientFormModal } from "@/components/patients/PatientFormModal";

export default function PatientsPage() {
    const queryClient = useQueryClient();

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [doctorFilter, setDoctorFilter] = useState("");
    const [page, setPage] = useState(1);

    const [formOpen, setFormOpen] = useState(false);
    const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
    const [deletingPatient, setDeletingPatient] = useState<Patient | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const doctorsQuery = useQuery({
        queryKey: ["doctors", "select-list"],
        queryFn: () => listDoctors({ page: 1, limit: 100 }),
    });

    const query = useQuery({
        queryKey: ["patients", { page, search, doctorFilter }],
        queryFn: () =>
            listPatients({
                page,
                limit: 10,
                search: search || undefined,
                doctorId: doctorFilter ? Number(doctorFilter) : undefined,
            }),
        placeholderData: (prev) => prev,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deletePatient(id),
        onSuccess: () => {
            toast.success("Patient deleted");
            queryClient.invalidateQueries({ queryKey: ["patients"] });
            queryClient.invalidateQueries({ queryKey: ["doctors"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setDeletingPatient(null);
        },
        onError: (err) => {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Could not delete this patient.";
            toast.error(message);
        },
    });

    const patients = query.data?.patients ?? [];
    const pagination = query.data?.pagination;
    const hasFilters = Boolean(search || doctorFilter);

    const openCreate = () => {
        setEditingPatient(null);
        setFormOpen(true);
    };

    const openEdit = (patient: Patient) => {
        setEditingPatient(patient);
        setFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Patients</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage patient records and their assigned doctors.
                    </p>
                </div>
                <Button onClick={openCreate} disabled={!doctorsQuery.data?.doctors.length}>
                    <Plus className="size-4" />
                    Add Patient
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                    <div className="relative max-w-sm flex-1">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by name, condition, phone..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select
                        className="max-w-[220px]"
                        value={doctorFilter}
                        onChange={(event) => {
                            setDoctorFilter(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All doctors</option>
                        {doctorsQuery.data?.doctors.map((doctor) => (
                            <option key={doctor.id} value={doctor.id}>
                                {doctor.name}
                            </option>
                        ))}
                    </Select>
                </div>

                {query.isLoading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : query.isError ? (
                    <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">
                        Failed to load patients. Try refreshing.
                    </div>
                ) : patients.length === 0 ? (
                    <EmptyState
                        icon={<Users className="size-5" />}
                        title={hasFilters ? "No patients match your filters" : "No patients yet"}
                        description={
                            hasFilters
                                ? "Try a different search term or doctor."
                                : "Add your first patient to get started."
                        }
                        action={
                            !hasFilters &&
                            Boolean(doctorsQuery.data?.doctors.length) && (
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="size-4" />
                                    Add Patient
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs tracking-wide text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
                                    <th className="px-4 py-3 font-medium">Name</th>
                                    <th className="px-4 py-3 font-medium">Condition</th>
                                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Doctor</th>
                                    <th className="hidden px-4 py-3 font-medium md:table-cell">Contact</th>
                                    <th className="px-4 py-3 font-medium">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {patients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    >
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
                                        <td className="hidden px-4 py-3 sm:table-cell">
                                            {patient.doctor ? (
                                                <Link
                                                    href={`/dashboard/doctors/${patient.doctor.id}`}
                                                    className="text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                                                >
                                                    {patient.doctor.name}
                                                </Link>
                                            ) : (
                                                <span className="text-slate-600 dark:text-slate-400">—</span>
                                            )}
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="size-3" />
                                                    {patient.phone}
                                                </span>
                                                {patient.email && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail className="size-3" />
                                                        {patient.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(patient)}
                                                    title="Edit"
                                                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingPatient(patient)}
                                                    title="Delete"
                                                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
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

            <PatientFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} patient={editingPatient} />

            <ConfirmDialog
                isOpen={Boolean(deletingPatient)}
                onClose={() => setDeletingPatient(null)}
                onConfirm={() => deletingPatient && deleteMutation.mutate(deletingPatient.id)}
                title="Delete patient?"
                description={`This will remove ${deletingPatient?.name ?? "this patient"}'s record.`}
                confirmLabel="Delete"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

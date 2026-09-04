"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Search, Pencil, Trash2, Stethoscope, Mail, Phone } from "lucide-react";
import { deleteDoctor, listDoctors, type Doctor } from "@/lib/doctors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { DoctorFormModal } from "@/components/doctors/DoctorFormModal";

export default function DoctorsPage() {
    const queryClient = useQueryClient();

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [formOpen, setFormOpen] = useState(false);
    const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
    const [deletingDoctor, setDeletingDoctor] = useState<Doctor | null>(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 350);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const query = useQuery({
        queryKey: ["doctors", { page, search }],
        queryFn: () => listDoctors({ page, limit: 10, search: search || undefined }),
        placeholderData: (prev) => prev,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteDoctor(id),
        onSuccess: () => {
            toast.success("Doctor deleted");
            queryClient.invalidateQueries({ queryKey: ["doctors"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setDeletingDoctor(null);
        },
        onError: (err) => {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Could not delete this doctor.";
            toast.error(message);
        },
    });

    const doctors = query.data?.doctors ?? [];
    const pagination = query.data?.pagination;

    const openCreate = () => {
        setEditingDoctor(null);
        setFormOpen(true);
    };

    const openEdit = (doctor: Doctor) => {
        setEditingDoctor(doctor);
        setFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Doctors</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Manage the doctors on your roster.
                    </p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Add Doctor
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="border-b border-slate-100 p-4 dark:border-slate-800">
                    <div className="relative max-w-sm">
                        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Search by name, specialization, hospital..."
                            value={searchInput}
                            onChange={(event) => setSearchInput(event.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                {query.isLoading ? (
                    <div className="space-y-3 p-4">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <Skeleton key={i} className="h-12 w-full" />
                        ))}
                    </div>
                ) : query.isError ? (
                    <div className="p-8 text-center text-sm text-rose-600 dark:text-rose-400">
                        Failed to load doctors. Try refreshing.
                    </div>
                ) : doctors.length === 0 ? (
                    <EmptyState
                        icon={<Stethoscope className="size-5" />}
                        title={search ? "No doctors match your search" : "No doctors yet"}
                        description={
                            search ? "Try a different search term." : "Add your first doctor to get started."
                        }
                        action={
                            !search && (
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="size-4" />
                                    Add Doctor
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
                                    <th className="px-4 py-3 font-medium">Specialization</th>
                                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Hospital</th>
                                    <th className="hidden px-4 py-3 font-medium md:table-cell">Contact</th>
                                    <th className="px-4 py-3 font-medium">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {doctors.map((doctor) => (
                                    <tr
                                        key={doctor.id}
                                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-3 font-medium">
                                            <Link
                                                href={`/dashboard/doctors/${doctor.id}`}
                                                className="text-slate-900 hover:text-indigo-600 dark:text-white dark:hover:text-indigo-400"
                                            >
                                                {doctor.name}
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge>{doctor.specialization}</Badge>
                                        </td>
                                        <td className="hidden px-4 py-3 text-slate-600 sm:table-cell dark:text-slate-400">
                                            {doctor.hospital}
                                        </td>
                                        <td className="hidden px-4 py-3 md:table-cell">
                                            <div className="flex flex-col gap-0.5 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1.5">
                                                    <Phone className="size-3" />
                                                    {doctor.phone}
                                                </span>
                                                {doctor.email && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Mail className="size-3" />
                                                        {doctor.email}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => openEdit(doctor)}
                                                    title="Edit"
                                                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingDoctor(doctor)}
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

            <DoctorFormModal isOpen={formOpen} onClose={() => setFormOpen(false)} doctor={editingDoctor} />

            <ConfirmDialog
                isOpen={Boolean(deletingDoctor)}
                onClose={() => setDeletingDoctor(null)}
                onConfirm={() => deletingDoctor && deleteMutation.mutate(deletingDoctor.id)}
                title="Delete doctor?"
                description={`This will remove ${deletingDoctor?.name ?? "this doctor"} from the roster. Doctors with existing patients can't be deleted until those patients are reassigned or removed.`}
                confirmLabel="Delete"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

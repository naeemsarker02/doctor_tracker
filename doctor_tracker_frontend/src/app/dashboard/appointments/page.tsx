"use client";

import { useState } from "react";
import axios from "axios";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, XCircle, CalendarClock } from "lucide-react";
import { listDoctors } from "@/lib/doctors";
import {
    APPOINTMENT_STATUSES,
    deleteAppointment,
    listAppointments,
    updateAppointment,
    type Appointment,
    type AppointmentStatus,
} from "@/lib/appointments";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { StatusBadge } from "@/components/appointments/StatusBadge";
import { AppointmentFormModal } from "@/components/appointments/AppointmentFormModal";

export default function AppointmentsPage() {
    const queryClient = useQueryClient();

    const [date, setDate] = useState("");
    const [status, setStatus] = useState("");
    const [doctorFilter, setDoctorFilter] = useState("");
    const [page, setPage] = useState(1);

    const [formOpen, setFormOpen] = useState(false);
    const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
    const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);

    const doctorsQuery = useQuery({
        queryKey: ["doctors", "select-list"],
        queryFn: () => listDoctors({ page: 1, limit: 100 }),
    });

    const query = useQuery({
        queryKey: ["appointments", { page, date, status, doctorFilter }],
        queryFn: () =>
            listAppointments({
                page,
                limit: 10,
                date: date || undefined,
                status: (status || undefined) as AppointmentStatus | undefined,
                doctorId: doctorFilter ? Number(doctorFilter) : undefined,
            }),
        placeholderData: (prev) => prev,
    });

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteAppointment(id),
        onSuccess: () => {
            toast.success("Appointment deleted");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
            setDeletingAppointment(null);
        },
        onError: (err) => {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Could not delete this appointment.";
            toast.error(message);
        },
    });

    const cancelMutation = useMutation({
        mutationFn: (id: number) => updateAppointment(id, { status: "Cancelled" }),
        onSuccess: () => {
            toast.success("Appointment cancelled");
            queryClient.invalidateQueries({ queryKey: ["appointments"] });
            queryClient.invalidateQueries({ queryKey: ["dashboard"] });
        },
        onError: (err) => {
            const message =
                axios.isAxiosError(err) && err.response?.data?.message
                    ? err.response.data.message
                    : "Could not cancel this appointment.";
            toast.error(message);
        },
    });

    const appointments = query.data?.appointments ?? [];
    const pagination = query.data?.pagination;
    const hasFilters = Boolean(date || status || doctorFilter);
    const canCreate = Boolean(doctorsQuery.data?.doctors.length);

    const openCreate = () => {
        setEditingAppointment(null);
        setFormOpen(true);
    };

    const openEdit = (appointment: Appointment) => {
        setEditingAppointment(appointment);
        setFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Appointments</h1>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        Schedule and track doctor-patient appointments.
                    </p>
                </div>
                <Button onClick={openCreate} disabled={!canCreate}>
                    <Plus className="size-4" />
                    Book Appointment
                </Button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex flex-wrap gap-3 border-b border-slate-100 p-4 dark:border-slate-800">
                    <Input
                        type="date"
                        value={date}
                        onChange={(event) => {
                            setDate(event.target.value);
                            setPage(1);
                        }}
                        className="max-w-[170px]"
                    />
                    <Select
                        className="max-w-[160px]"
                        value={status}
                        onChange={(event) => {
                            setStatus(event.target.value);
                            setPage(1);
                        }}
                    >
                        <option value="">All statuses</option>
                        {APPOINTMENT_STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </Select>
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
                        Failed to load appointments. Try refreshing.
                    </div>
                ) : appointments.length === 0 ? (
                    <EmptyState
                        icon={<CalendarClock className="size-5" />}
                        title={hasFilters ? "No appointments match your filters" : "No appointments yet"}
                        description={
                            hasFilters
                                ? "Try a different date, status, or doctor."
                                : canCreate
                                  ? "Book your first appointment."
                                  : "Add a doctor and patient first, then book an appointment."
                        }
                        action={
                            !hasFilters &&
                            canCreate && (
                                <Button size="sm" onClick={openCreate}>
                                    <Plus className="size-4" />
                                    Book Appointment
                                </Button>
                            )
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs tracking-wide text-slate-400 uppercase dark:border-slate-800 dark:text-slate-500">
                                    <th className="px-4 py-3 font-medium">Date &amp; Time</th>
                                    <th className="px-4 py-3 font-medium">Patient</th>
                                    <th className="hidden px-4 py-3 font-medium sm:table-cell">Doctor</th>
                                    <th className="px-4 py-3 font-medium">Status</th>
                                    <th className="px-4 py-3 font-medium">
                                        <span className="sr-only">Actions</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {appointments.map((appointment) => (
                                    <tr
                                        key={appointment.id}
                                        className="transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40"
                                    >
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-slate-900 dark:text-white">
                                                {appointment.appointmentDate}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                {appointment.appointmentTime.slice(0, 5)}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                                            {appointment.patient?.name ?? "—"}
                                        </td>
                                        <td className="hidden px-4 py-3 text-slate-600 sm:table-cell dark:text-slate-400">
                                            {appointment.doctor?.name ?? "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={appointment.status} />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {appointment.status !== "Cancelled" &&
                                                    appointment.status !== "Completed" && (
                                                        <button
                                                            onClick={() =>
                                                                cancelMutation.mutate(appointment.id)
                                                            }
                                                            disabled={cancelMutation.isPending}
                                                            title="Cancel"
                                                            className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-amber-50 hover:text-amber-600 disabled:opacity-50 dark:hover:bg-amber-500/10 dark:hover:text-amber-400"
                                                        >
                                                            <XCircle className="size-4" />
                                                        </button>
                                                    )}
                                                <button
                                                    onClick={() => openEdit(appointment)}
                                                    title="Edit"
                                                    className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                                                >
                                                    <Pencil className="size-4" />
                                                </button>
                                                <button
                                                    onClick={() => setDeletingAppointment(appointment)}
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

            <AppointmentFormModal
                isOpen={formOpen}
                onClose={() => setFormOpen(false)}
                appointment={editingAppointment}
            />

            <ConfirmDialog
                isOpen={Boolean(deletingAppointment)}
                onClose={() => setDeletingAppointment(null)}
                onConfirm={() => deletingAppointment && deleteMutation.mutate(deletingAppointment.id)}
                title="Delete appointment?"
                description={`This will permanently remove the appointment for ${deletingAppointment?.patient?.name ?? "this patient"}.`}
                confirmLabel="Delete"
                isLoading={deleteMutation.isPending}
            />
        </div>
    );
}

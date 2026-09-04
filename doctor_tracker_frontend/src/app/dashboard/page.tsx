"use client";

import { useQuery } from "@tanstack/react-query";
import { Stethoscope, Users, CalendarClock, CalendarCheck } from "lucide-react";
import {
    getAppointments,
    getConditions,
    getOverview,
    getPatientTrends,
    getPatientsPerDoctor,
} from "@/lib/dashboard";
import { StatCard } from "@/components/dashboard/StatCard";
import { BarList } from "@/components/dashboard/BarList";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { Panel } from "@/components/dashboard/Panel";

export default function DashboardPage() {
    const overview = useQuery({ queryKey: ["dashboard", "overview"], queryFn: getOverview });
    const perDoctor = useQuery({
        queryKey: ["dashboard", "patients-per-doctor"],
        queryFn: getPatientsPerDoctor,
    });
    const trends = useQuery({
        queryKey: ["dashboard", "patient-trends"],
        queryFn: () => getPatientTrends(14),
    });
    const conditions = useQuery({ queryKey: ["dashboard", "conditions"], queryFn: getConditions });
    const appointments = useQuery({
        queryKey: ["dashboard", "appointments"],
        queryFn: getAppointments,
    });

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Dashboard</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Overview of doctors, patients, and activity.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                <StatCard
                    label="Total Doctors"
                    icon={Stethoscope}
                    accent="indigo"
                    value={overview.isLoading ? "…" : (overview.data?.totals.doctors ?? "—")}
                />
                <StatCard
                    label="Total Patients"
                    icon={Users}
                    accent="emerald"
                    value={overview.isLoading ? "…" : (overview.data?.totals.patients ?? "—")}
                />
                <StatCard
                    label="Appointments Today"
                    icon={CalendarCheck}
                    accent="amber"
                    value={appointments.isLoading ? "…" : (appointments.data?.today ?? "—")}
                />
                <StatCard
                    label="Upcoming Appointments"
                    icon={CalendarClock}
                    accent="slate"
                    value={appointments.isLoading ? "…" : (appointments.data?.upcoming ?? "—")}
                />
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Panel
                    title="Patient Registrations (last 14 days)"
                    isLoading={trends.isLoading}
                    isError={trends.isError}
                >
                    <TrendChart data={trends.data ?? []} />
                </Panel>

                <Panel
                    title="Patients per Doctor"
                    isLoading={perDoctor.isLoading}
                    isError={perDoctor.isError}
                >
                    <BarList
                        items={(perDoctor.data ?? []).map((row) => ({
                            label: `${row.doctorName} (${row.specialization})`,
                            count: row.patientCount,
                        }))}
                    />
                </Panel>

                <Panel
                    title="Doctors by Specialization"
                    isLoading={overview.isLoading}
                    isError={overview.isError}
                >
                    <BarList
                        items={(overview.data?.doctorsBySpecialization ?? []).map((row) => ({
                            label: row.specialization,
                            count: row.count,
                        }))}
                    />
                </Panel>

                <Panel
                    title="Patient Conditions"
                    isLoading={conditions.isLoading}
                    isError={conditions.isError}
                >
                    <BarList
                        items={(conditions.data ?? []).map((row) => ({
                            label: row.condition,
                            count: row.count,
                        }))}
                    />
                </Panel>
            </div>

            <Panel title="Recently Added" isLoading={overview.isLoading} isError={overview.isError}>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                        <h3 className="mb-2 text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                            Recent Doctors
                        </h3>
                        {overview.data?.recentDoctors.length ? (
                            <ul className="space-y-1 text-sm">
                                {overview.data.recentDoctors.map((doctor) => (
                                    <li key={doctor.id} className="flex justify-between">
                                        <span className="text-slate-700 dark:text-slate-300">{doctor.name}</span>
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {doctor.specialization}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No doctors yet.</p>
                        )}
                    </div>
                    <div>
                        <h3 className="mb-2 text-xs font-medium tracking-wide text-slate-400 uppercase dark:text-slate-500">
                            Recent Patients
                        </h3>
                        {overview.data?.recentPatients.length ? (
                            <ul className="space-y-1 text-sm">
                                {overview.data.recentPatients.map((patient) => (
                                    <li key={patient.id} className="flex justify-between">
                                        <span className="text-slate-700 dark:text-slate-300">{patient.name}</span>
                                        <span className="text-slate-500 dark:text-slate-400">
                                            {patient.condition}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-slate-500 dark:text-slate-400">No patients yet.</p>
                        )}
                    </div>
                </div>
            </Panel>
        </div>
    );
}

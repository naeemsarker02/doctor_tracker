"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Stethoscope, Users, CalendarClock, Activity } from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/doctors", label: "Doctors", icon: Stethoscope },
    { href: "/dashboard/patients", label: "Patients", icon: Users },
    { href: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/60 bg-slate-950 md:flex">
            <div className="flex h-16 items-center gap-2 px-6">
                <div className="flex size-8 items-center justify-center rounded-lg bg-indigo-600">
                    <Activity className="size-4 text-white" />
                </div>
                <span className="text-sm font-semibold tracking-tight text-white">Doctor Tracker</span>
            </div>

            <nav className="flex-1 space-y-1 px-3 py-4">
                {navItems.map((item) => {
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === "/dashboard"
                            : pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-indigo-600/15 text-indigo-300"
                                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                            )}
                        >
                            <Icon className="size-4" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="border-t border-slate-800/60 px-4 py-4">
                <p className="text-xs text-slate-500">Doctor Tracker · v1</p>
            </div>
        </aside>
    );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Stethoscope, Users, CalendarClock, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";

const mobileNavItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/doctors", label: "Doctors", icon: Stethoscope },
    { href: "/dashboard/patients", label: "Patients", icon: Users },
    { href: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
];

export function TopBar() {
    const { user, logout } = useAuth();
    const pathname = usePathname();

    return (
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur-sm sm:px-6 dark:border-slate-800 dark:bg-slate-950/80">
            <nav className="flex items-center gap-1 md:hidden">
                {mobileNavItems.map((item) => {
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
                                "flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                                isActive
                                    ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300"
                                    : "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                            )}
                        >
                            <Icon className="size-3.5" />
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            <div className="hidden md:block" />

            <div className="flex items-center gap-3">
                <Link
                    href="/dashboard/profile"
                    className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800",
                        pathname === "/dashboard/profile" && "bg-slate-100 dark:bg-slate-800"
                    )}
                >
                    <Avatar name={user?.name ?? "?"} avatarUrl={user?.avatarUrl} size="sm" />
                    <div className="hidden text-right sm:block">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
                        <p className="text-xs text-slate-500 capitalize dark:text-slate-400">{user?.role}</p>
                    </div>
                </Link>
                <button
                    onClick={logout}
                    title="Log out"
                    className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                    <LogOut className="size-4" />
                </button>
            </div>
        </header>
    );
}

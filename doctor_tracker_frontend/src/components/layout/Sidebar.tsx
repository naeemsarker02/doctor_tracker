"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Stethoscope,
    Users,
    CalendarClock,
    Activity,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/cn";

const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/doctors", label: "Doctors", icon: Stethoscope },
    { href: "/dashboard/patients", label: "Patients", icon: Users },
    { href: "/dashboard/appointments", label: "Appointments", icon: CalendarClock },
];

const COLLAPSE_STORAGE_KEY = "sidebar-collapsed";

export function Sidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        // Read after mount (not a lazy useState initializer) so server and first client
        // render both start expanded - avoids a hydration mismatch against localStorage.
        try {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setCollapsed(localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");
        } catch {
            // localStorage unavailable (private mode, disabled storage) - keep default expanded
        }
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((prev) => {
            const next = !prev;
            try {
                localStorage.setItem(COLLAPSE_STORAGE_KEY, String(next));
            } catch {
                // ignore write failures - preference just won't persist this session
            }
            return next;
        });
    };

    return (
        <aside
            className={cn(
                "relative hidden h-full shrink-0 border-r border-slate-800/60 bg-slate-950 transition-[width] duration-200 ease-in-out md:block",
                collapsed ? "w-16" : "w-64"
            )}
        >
            {/* Toggle lives outside the scrollable content below, as a sibling positioned
                against this element - so it's never clipped by that container's overflow
                and never scrolls out of view with the nav items. */}
            <button
                onClick={toggleCollapsed}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                className="absolute top-5 -right-3 z-20 flex size-6 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-400 shadow-md transition-all duration-150 hover:scale-110 hover:bg-indigo-600 hover:text-white"
            >
                {collapsed ? (
                    <ChevronRight className="size-3.5" />
                ) : (
                    <ChevronLeft className="size-3.5" />
                )}
            </button>

            {/* Scrollable content: overflow-x-hidden guards against anything inside ever
                forcing a horizontal scrollbar (e.g. a long label), overflow-y-auto is the
                fallback for nav content taller than the viewport. */}
            <div className="flex h-full flex-col overflow-y-auto overflow-x-hidden">
                <div
                    className={cn(
                        "flex h-16 shrink-0 items-center gap-2 px-6",
                        collapsed && "justify-center px-0"
                    )}
                >
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
                        <Activity className="size-4 text-white" />
                    </div>
                    {!collapsed && (
                        <span className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-white">
                            Doctor Tracker
                        </span>
                    )}
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
                                title={collapsed ? item.label : undefined}
                                className={cn(
                                    "flex min-w-0 items-center gap-3 rounded-lg border-l-2 border-transparent py-2 pl-2.5 pr-3 text-sm font-medium transition-colors",
                                    collapsed && "justify-center border-l-0 px-0",
                                    isActive
                                        ? "border-indigo-500 bg-indigo-600/15 text-indigo-300"
                                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-100"
                                )}
                            >
                                <Icon className="size-4 shrink-0" />
                                {!collapsed && (
                                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                <div
                    className={cn(
                        "flex shrink-0 items-center border-t border-slate-800/60 px-4 py-3",
                        collapsed && "justify-center"
                    )}
                >
                    {!collapsed && (
                        <p className="min-w-0 truncate text-xs text-slate-500">Doctor Tracker · v1</p>
                    )}
                </div>
            </div>
        </aside>
    );
}

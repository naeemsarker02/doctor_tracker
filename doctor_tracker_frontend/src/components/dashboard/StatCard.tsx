import { ReactNode } from "react";
import { LucideIcon } from "lucide-react";

export function StatCard({
    label,
    value,
    hint,
    icon: Icon,
    accent = "indigo",
}: {
    label: string;
    value: ReactNode;
    hint?: string;
    icon: LucideIcon;
    accent?: "indigo" | "emerald" | "amber" | "slate";
}) {
    const accentStyles = {
        indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400",
        emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
        amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
        slate: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
    }[accent];

    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
                    <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                        {value}
                    </p>
                </div>
                <div className={`flex size-9 items-center justify-center rounded-lg ${accentStyles}`}>
                    <Icon className="size-4.5" />
                </div>
            </div>
            {hint && <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">{hint}</p>}
        </div>
    );
}

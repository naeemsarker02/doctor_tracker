import { cn } from "@/lib/cn";
import type { AppointmentStatus } from "@/lib/appointments";

const styles: Record<AppointmentStatus, string> = {
    Pending: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    Confirmed: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    Completed: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    Cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export function StatusBadge({ status }: { status: AppointmentStatus }) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                styles[status]
            )}
        >
            {status}
        </span>
    );
}

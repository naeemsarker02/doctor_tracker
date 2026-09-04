import { ReactNode } from "react";
import { cn } from "@/lib/cn";

const palette = [
    "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300",
    "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300",
    "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300",
    "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-500/10 dark:text-fuchsia-300",
    "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
];

// Stable per-label color so the same specialization always renders the same badge color.
function colorFor(label: string) {
    let hash = 0;
    for (let i = 0; i < label.length; i += 1) {
        hash = (hash * 31 + label.charCodeAt(i)) >>> 0;
    }
    return palette[hash % palette.length];
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
    const label = typeof children === "string" ? children : "";
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                colorFor(label),
                className
            )}
        >
            {children}
        </span>
    );
}

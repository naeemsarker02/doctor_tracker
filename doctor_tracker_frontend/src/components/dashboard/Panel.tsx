import { ReactNode } from "react";

export function Panel({
    title,
    isLoading,
    isError,
    children,
}: {
    title: string;
    isLoading: boolean;
    isError: boolean;
    children: ReactNode;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">{title}</h2>
            {isLoading && (
                <div className="space-y-2">
                    <div className="h-2 w-full animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-2 w-4/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                    <div className="h-2 w-3/5 animate-pulse rounded bg-slate-100 dark:bg-slate-800" />
                </div>
            )}
            {isError && !isLoading && (
                <p className="text-sm text-rose-600 dark:text-rose-400">
                    Failed to load. Try refreshing.
                </p>
            )}
            {!isLoading && !isError && children}
        </div>
    );
}

import { ReactNode } from "react";

export function EmptyState({
    icon,
    title,
    description,
    action,
}: {
    icon: ReactNode;
    title: string;
    description?: string;
    action?: ReactNode;
}) {
    return (
        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{title}</p>
                {description && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                )}
            </div>
            {action}
        </div>
    );
}

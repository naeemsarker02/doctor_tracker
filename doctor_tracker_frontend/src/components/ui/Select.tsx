import { SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
    ({ className, label, error, id, children, ...props }, ref) => {
        return (
            <div className="space-y-1.5">
                {label && (
                    <label htmlFor={id} className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <select
                        ref={ref}
                        id={id}
                        className={cn(
                            "w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm text-slate-900 shadow-sm outline-none transition-colors focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100",
                            error && "border-rose-400 focus:border-rose-500 focus:ring-rose-500/20",
                            className
                        )}
                        {...props}
                    >
                        {children}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-slate-400" />
                </div>
                {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
            </div>
        );
    }
);
Select.displayName = "Select";

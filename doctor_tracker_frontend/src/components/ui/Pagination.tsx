import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function Pagination({
    page,
    totalPages,
    total,
    onPageChange,
}: {
    page: number;
    totalPages: number;
    total: number;
    onPageChange: (page: number) => void;
}) {
    if (total === 0) return null;

    return (
        <div className="flex items-center justify-between border-t border-slate-100 px-1 pt-4 dark:border-slate-800">
            <p className="text-xs text-slate-500 dark:text-slate-400">
                Page {page} of {totalPages} · {total} total
            </p>
            <div className="flex items-center gap-2">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                >
                    <ChevronLeft className="size-3.5" />
                    Prev
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                >
                    Next
                    <ChevronRight className="size-3.5" />
                </Button>
            </div>
        </div>
    );
}

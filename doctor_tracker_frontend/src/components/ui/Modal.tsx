"use client";

import { ReactNode, useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

export function Modal({
    isOpen,
    onClose,
    title,
    description,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    description?: string;
    children: ReactNode;
}) {
    useEffect(() => {
        if (!isOpen) return;

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") onClose();
        };
        document.addEventListener("keydown", onKeyDown);
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", onKeyDown);
            document.body.style.overflow = "";
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="fixed inset-0 bg-slate-950/50 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
                aria-hidden
            />
            <div className="relative w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-950/10 animate-zoom-in dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h2>
                        {description && (
                            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{description}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                        aria-label="Close"
                    >
                        <X className="size-4" />
                    </button>
                </div>
                {children}
            </div>
        </div>,
        document.body
    );
}

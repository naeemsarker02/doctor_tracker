"use client";

import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

export function ConfirmDialog({
    isOpen,
    onClose,
    onConfirm,
    title,
    description,
    confirmLabel = "Confirm",
    isLoading,
    variant = "danger",
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    description: string;
    confirmLabel?: string;
    isLoading?: boolean;
    variant?: "danger" | "primary";
}) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} description={description}>
            <div className="mt-2 flex justify-end gap-2">
                <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button variant={variant} onClick={onConfirm} isLoading={isLoading}>
                    {confirmLabel}
                </Button>
            </div>
        </Modal>
    );
}

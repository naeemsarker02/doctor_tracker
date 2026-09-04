"use client";

import { ChangeEvent, FormEvent, useRef, useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Camera, KeyRound, Loader2, UserRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/ui/Avatar";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { changePassword, updateProfile, uploadAvatar } from "@/lib/profile";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

function extractFieldErrors(err: unknown) {
    if (axios.isAxiosError(err) && err.response?.data?.errors) {
        const errors: Record<string, string> = {};
        for (const item of err.response.data.errors as { field: string; message: string }[]) {
            errors[item.field] = item.message;
        }
        return errors;
    }
    return null;
}

function extractMessage(err: unknown, fallback: string) {
    return axios.isAxiosError(err) && err.response?.data?.message
        ? err.response.data.message
        : fallback;
}

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState(user?.name ?? "");
    const [email, setEmail] = useState(user?.email ?? "");
    const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});

    const avatarMutation = useMutation({
        mutationFn: uploadAvatar,
        onSuccess: (updated) => {
            updateUser({ avatarUrl: updated.avatarUrl });
            toast.success("Profile photo updated");
        },
        onError: (err) => toast.error(extractMessage(err, "Could not upload image")),
    });

    const profileMutation = useMutation({
        mutationFn: updateProfile,
        onSuccess: (updated) => {
            updateUser({ name: updated.name, email: updated.email });
            toast.success("Profile updated");
            setProfileErrors({});
        },
        onError: (err) => {
            const fieldErrors = extractFieldErrors(err);
            if (fieldErrors) {
                setProfileErrors(fieldErrors);
                return;
            }
            toast.error(extractMessage(err, "Could not update profile"));
        },
    });

    const passwordMutation = useMutation({
        mutationFn: changePassword,
        onSuccess: () => {
            toast.success("Password changed successfully");
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setPasswordErrors({});
        },
        onError: (err) => {
            const fieldErrors = extractFieldErrors(err);
            if (fieldErrors) {
                setPasswordErrors(fieldErrors);
                return;
            }
            toast.error(extractMessage(err, "Could not change password"));
        },
    });

    const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) return;

        if (!ALLOWED_TYPES.includes(file.type)) {
            toast.error("Only JPEG, PNG, or WEBP images are allowed");
            return;
        }
        if (file.size > MAX_AVATAR_BYTES) {
            toast.error("Image must be 2MB or smaller");
            return;
        }

        avatarMutation.mutate(file);
    };

    const handleProfileSubmit = (event: FormEvent) => {
        event.preventDefault();
        setProfileErrors({});
        profileMutation.mutate({ name, email });
    };

    const handlePasswordSubmit = (event: FormEvent) => {
        event.preventDefault();
        setPasswordErrors({});

        if (newPassword !== confirmPassword) {
            setPasswordErrors({ confirmPassword: "Passwords do not match" });
            return;
        }

        passwordMutation.mutate({ currentPassword, newPassword });
    };

    if (!user) return null;

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Profile</h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Manage your account details and security.
                </p>
            </div>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <Avatar name={user.name} avatarUrl={user.avatarUrl} size="xl" />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={avatarMutation.isPending}
                            title="Change photo"
                            className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition-colors hover:bg-indigo-500 disabled:opacity-50"
                        >
                            {avatarMutation.isPending ? (
                                <Loader2 className="size-4 animate-spin" />
                            ) : (
                                <Camera className="size-4" />
                            )}
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                    </div>
                    <div>
                        <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                        <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                            JPEG, PNG, or WEBP · up to 2MB
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                    <UserRound className="size-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Basic information
                    </h2>
                </div>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <Input
                        id="profile-name"
                        label="Full name"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        error={profileErrors.name}
                        required
                    />
                    <Input
                        id="profile-email"
                        label="Email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        error={profileErrors.email}
                        required
                    />
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={profileMutation.isPending}>
                            Save changes
                        </Button>
                    </div>
                </form>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="mb-4 flex items-center gap-2">
                    <KeyRound className="size-4 text-slate-400" />
                    <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        Change password
                    </h2>
                </div>
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <Input
                        id="current-password"
                        label="Current password"
                        type="password"
                        autoComplete="current-password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        error={passwordErrors.currentPassword}
                        required
                    />
                    <Input
                        id="new-password"
                        label="New password"
                        type="password"
                        autoComplete="new-password"
                        value={newPassword}
                        onChange={(event) => setNewPassword(event.target.value)}
                        error={passwordErrors.newPassword}
                        minLength={6}
                        required
                    />
                    <Input
                        id="confirm-password"
                        label="Confirm new password"
                        type="password"
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        error={passwordErrors.confirmPassword}
                        minLength={6}
                        required
                    />
                    <div className="flex justify-end">
                        <Button type="submit" isLoading={passwordMutation.isPending}>
                            Update password
                        </Button>
                    </div>
                </form>
            </section>
        </div>
    );
}

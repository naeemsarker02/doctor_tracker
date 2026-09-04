"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Activity, AlertCircle, BarChart3, ShieldCheck, Stethoscope } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const features = [
    {
        icon: Stethoscope,
        title: "Doctor & patient records",
        description: "Keep every roster and history organized in one place.",
    },
    {
        icon: BarChart3,
        title: "Live dashboard insights",
        description: "Track registrations, conditions, and trends at a glance.",
    },
    {
        icon: ShieldCheck,
        title: "Secure by default",
        description: "Rate-limited auth, validated inputs, role-aware access.",
    },
];

export default function LoginPage() {
    const { user, isLoading, login } = useAuth();
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (!isLoading && user) {
            router.replace("/dashboard");
        }
    }, [isLoading, user, router]);

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            await login(email, password);
            router.push("/dashboard");
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data?.message) {
                setError(err.response.data.message);
            } else {
                setError("Login failed. Please try again.");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="flex flex-1 bg-white dark:bg-slate-950">
            {/* Brand panel */}
            <div className="relative hidden w-1/2 overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
                <div
                    className="pointer-events-none absolute -top-24 -left-24 size-96 rounded-full bg-indigo-600/30 blur-3xl"
                    aria-hidden
                />
                <div
                    className="pointer-events-none absolute -right-24 bottom-0 size-96 rounded-full bg-violet-600/20 blur-3xl"
                    aria-hidden
                />

                <div className="relative flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-indigo-600">
                        <Activity className="size-4.5 text-white" />
                    </div>
                    <span className="text-sm font-semibold text-white">Doctor Tracker</span>
                </div>

                <div className="relative space-y-8">
                    <h1 className="text-3xl leading-tight font-semibold text-white">
                        Run your clinic operations from one clean dashboard.
                    </h1>
                    <div className="space-y-5">
                        {features.map((feature) => (
                            <div key={feature.title} className="flex items-start gap-3">
                                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white/10 text-indigo-300">
                                    <feature.icon className="size-4.5" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-white">{feature.title}</p>
                                    <p className="mt-0.5 text-sm text-slate-400">{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="relative text-xs text-slate-500">
                    &copy; {new Date().getFullYear()} Doctor Tracker. Internal admin tool.
                </p>
            </div>

            {/* Form panel */}
            <div className="flex w-full flex-1 items-center justify-center bg-slate-50 p-4 dark:bg-slate-950 lg:w-1/2">
                <div className="w-full max-w-sm">
                    <div className="mb-8 flex flex-col items-center gap-3 text-center lg:hidden">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/25">
                            <Activity className="size-5 text-white" />
                        </div>
                        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                            Doctor Tracker
                        </h1>
                    </div>

                    <div className="mb-6 hidden lg:block">
                        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                            Welcome back
                        </h2>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Sign in to your admin account
                        </p>
                    </div>

                    <form
                        onSubmit={handleSubmit}
                        className="animate-slide-up space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                    >
                        {error && (
                            <div className="flex items-start gap-2 rounded-lg bg-rose-50 px-3 py-2.5 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
                                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Input
                            id="email"
                            label="Email"
                            type="email"
                            required
                            autoComplete="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                        />

                        <Input
                            id="password"
                            label="Password"
                            type="password"
                            required
                            autoComplete="current-password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                        />

                        <Button type="submit" className="w-full" isLoading={isSubmitting}>
                            {isSubmitting ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </div>
            </div>
        </main>
    );
}

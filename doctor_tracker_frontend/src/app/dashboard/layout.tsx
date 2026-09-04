"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { Activity } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.replace("/login");
        }
    }, [isLoading, user, router]);

    if (isLoading || !user) {
        return (
            <main className="flex flex-1 flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
                <Activity className="size-6 animate-pulse text-indigo-600" />
                <p className="text-sm text-slate-500 dark:text-slate-400">Loading...</p>
            </main>
        );
    }

    return (
        <div className="flex flex-1 bg-slate-50 dark:bg-slate-950">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
                <TopBar />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
            </div>
        </div>
    );
}

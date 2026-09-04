"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
    const { user, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isLoading) return;
        router.replace(user ? "/dashboard" : "/login");
    }, [isLoading, user, router]);

    return (
        <main className="flex flex-1 items-center justify-center">
            <p className="text-sm text-zinc-500">Loading...</p>
        </main>
    );
}

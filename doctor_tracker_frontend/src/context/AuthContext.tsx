"use client";

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";
import { useRouter } from "next/navigation";
import { api, clearAuthToken, getAuthToken, setAuthToken } from "@/lib/api";

export type User = {
    id: number;
    name: string;
    email: string;
    role: string;
    avatarUrl: string | null;
};

type AuthContextValue = {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
    updateUser: (patch: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        api
            .get("/auth/me")
            .then((res) => setUser(res.data.data.user))
            .catch(() => {
                clearAuthToken();
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    const login = useCallback(async (email: string, password: string) => {
        const res = await api.post("/auth/login", { email, password });
        const { token, user: loggedInUser } = res.data.data;
        setAuthToken(token);
        setUser(loggedInUser);
    }, []);

    const logout = useCallback(() => {
        clearAuthToken();
        setUser(null);
        router.push("/login");
    }, [router]);

    const updateUser = useCallback((patch: Partial<User>) => {
        setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    }, []);

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return ctx;
}

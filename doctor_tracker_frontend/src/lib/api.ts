import axios from "axios";

const TOKEN_STORAGE_KEY = "doctor_tracker_token";

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

api.interceptors.request.use((config) => {
    if (typeof window !== "undefined") {
        const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (
            typeof window !== "undefined" &&
            error.response?.status === 401 &&
            window.location.pathname !== "/login"
        ) {
            window.localStorage.removeItem(TOKEN_STORAGE_KEY);
            window.location.href = "/login";
        }
        return Promise.reject(error);
    }
);

export const setAuthToken = (token: string) => {
    if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
};

export const clearAuthToken = () => {
    if (typeof window !== "undefined") {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
};

export const getAuthToken = () => {
    if (typeof window !== "undefined") {
        return window.localStorage.getItem(TOKEN_STORAGE_KEY);
    }
    return null;
};

const API_ORIGIN = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/api\/?$/, "");

// Backend returns relative paths like "/uploads/avatars/x.png" — resolve them
// against the API origin, since the frontend and backend are different origins.
export const getAssetUrl = (path: string | null | undefined) => {
    if (!path) return null;
    if (/^https?:\/\//.test(path)) return path;
    return `${API_ORIGIN}${path}`;
};

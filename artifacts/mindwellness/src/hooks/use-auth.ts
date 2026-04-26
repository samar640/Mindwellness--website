import { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5002';

const STORAGE_KEY = "mw_user";

// Always returns { ok, data, message } — never throws on non-JSON or network error
async function safeFetch(url: string, init?: RequestInit) {
  try {
    const res = await fetch(url, { credentials: "include", ...init });
    let data: any = null;
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      try {
        data = await res.json();
      } catch {
        data = null;
      }
    } else {
      // Not JSON (e.g. HTML error page). Drain it without crashing.
      try { await res.text(); } catch {}
    }
    if (!res.ok) {
      const message =
        (data && (data.error || data.message)) ||
        (res.status === 401 ? "Invalid email or password." :
         res.status === 409 ? "An account with this email already exists." :
         res.status === 404 ? "No account found with this email." :
         "Something went wrong. Please try again.");
      return { ok: false, data: null, message };
    }
    return { ok: true, data, message: "" };
  } catch (err) {
    return { ok: false, data: null, message: "Connection problem. Please check your internet and try again." };
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // fast path: restore from localStorage to avoid flash
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    checkAuth();
  }, []);

  const checkAuth = async () => {
    setIsLoading(true);
    const result = await safeFetch(`${API_URL}/api/auth/me`);
    const nextUser = result.ok && result.data ? (result.data as User) : null;
    setUser(nextUser);
    try {
      if (nextUser) localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setIsLoading(false);
  };

  const login = async (email: string, password: string) => {
    const result = await safeFetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!result.ok) throw new Error(result.message);
    setUser(result.data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data)); } catch {}
    return result.data;
  };

  const register = async (email: string, password: string) => {
    const result = await safeFetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    if (!result.ok) throw new Error(result.message);
    setUser(result.data);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(result.data)); } catch {}
    return result.data;
  };

  const forgotPassword = async (email: string) => {
    const result = await safeFetch(`${API_URL}/api/auth/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (!result.ok) throw new Error(result.message);
    return result.data;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const result = await safeFetch(`${API_URL}/api/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!result.ok) throw new Error(result.message);
    return result.data;
  };

  const logout = async () => {
    await safeFetch(`${API_URL}/api/auth/logout`, { method: "POST" });
    setUser(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return { user, isLoading, login, register, logout, forgotPassword, resetPassword };
}

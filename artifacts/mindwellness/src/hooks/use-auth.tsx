import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface User {
  id: string;
  email: string;
}

interface LoginOptions {
  rememberMe?: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  lastLoginEmail: string;
  login: (email: string, password: string, options?: LoginOptions) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  forgotPassword: (email: string) => Promise<unknown>;
  resetPassword: (token: string, newPassword: string) => Promise<unknown>;
}

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api`
  : "/api";
const authUrl = (path: string) => `${API_BASE}/auth/${path}`;

const USER_STORAGE_KEY = "mw_user";
const LAST_EMAIL_STORAGE_KEY = "mw_last_login_email";

const AuthContext = createContext<AuthContextValue | null>(null);

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
      try {
        await res.text();
      } catch {}
    }
    if (!res.ok) {
      const message =
        (data && (data.error || data.message)) ||
        (res.status === 401
          ? "Invalid email or password."
          : res.status === 409
            ? "An account with this email already exists."
            : res.status === 404
              ? "No account found with this email."
              : "Something went wrong. Please try again.");
      return { ok: false, data: null, message };
    }
    return { ok: true, data, message: "" };
  } catch {
    return {
      ok: false,
      data: null,
      message: "Connection problem. Please check your internet and try again.",
    };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastLoginEmail, setLastLoginEmail] = useState("");

  const persistUser = (nextUser: User | null) => {
    try {
      if (nextUser) localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(USER_STORAGE_KEY);
    } catch {}
  };

  const persistLastEmail = (email: string) => {
    const cleaned = email.trim().toLowerCase();
    if (!cleaned) return;
    setLastLoginEmail(cleaned);
    try {
      localStorage.setItem(LAST_EMAIL_STORAGE_KEY, cleaned);
    } catch {}
  };

  const checkAuth = async () => {
    setIsLoading(true);
    const result = await safeFetch(authUrl("me"));
    const nextUser = result.ok && result.data ? (result.data as User) : null;
    setUser(nextUser);
    persistUser(nextUser);
    if (nextUser?.email) persistLastEmail(nextUser.email);
    setIsLoading(false);
  };

  useEffect(() => {
    try {
      const rawUser = localStorage.getItem(USER_STORAGE_KEY);
      if (rawUser) setUser(JSON.parse(rawUser));
      const rawLastEmail = localStorage.getItem(LAST_EMAIL_STORAGE_KEY);
      if (rawLastEmail) setLastLoginEmail(rawLastEmail);
    } catch {}
    void checkAuth();
  }, []);

  const login = async (email: string, password: string, options?: LoginOptions) => {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await safeFetch(authUrl("login"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: normalizedEmail,
        password,
        rememberMe: Boolean(options?.rememberMe),
      }),
    });
    if (!result.ok) throw new Error(result.message);
    const nextUser = result.data as User;
    setUser(nextUser);
    persistUser(nextUser);
    persistLastEmail(normalizedEmail);
    return nextUser;
  };

  const register = async (email: string, password: string) => {
    const normalizedEmail = email.trim().toLowerCase();
    const result = await safeFetch(authUrl("register"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: normalizedEmail, password }),
    });
    if (!result.ok) throw new Error(result.message);
    const nextUser = result.data as User;
    setUser(nextUser);
    persistUser(nextUser);
    persistLastEmail(normalizedEmail);
    return nextUser;
  };

  const forgotPassword = async (email: string) => {
    const result = await safeFetch(authUrl("forgot-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    if (!result.ok) throw new Error(result.message);
    return result.data;
  };

  const resetPassword = async (token: string, newPassword: string) => {
    const result = await safeFetch(authUrl("reset-password"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, newPassword }),
    });
    if (!result.ok) throw new Error(result.message);
    return result.data;
  };

  const logout = async () => {
    await safeFetch(authUrl("logout"), { method: "POST" });
    setUser(null);
    persistUser(null);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isLoading,
      lastLoginEmail,
      login,
      register,
      logout,
      checkAuth,
      forgotPassword,
      resetPassword,
    }),
    [user, isLoading, lastLoginEmail],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

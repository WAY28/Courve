"use client";

import { useRouter } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { adminLogin, getAdminMe, type Result, type User } from "@/lib/api";

// Separate from the customer session, and kept in sessionStorage so the admin
// session ends when the browser tab is closed.
const STORAGE_KEY = "courve-admin-token";

type AdminAuthState = {
  admin: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    if (!stored) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    getAdminMe(stored).then((res) => {
      if (res.ok) {
        setToken(stored);
        setAdmin(res.data);
      } else {
        try {
          sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminLogin({ email, password });
    if (!res.ok) return res.error;
    setToken(res.data.token);
    setAdmin(res.data.user);
    try {
      sessionStorage.setItem(STORAGE_KEY, res.data.token);
    } catch {
      // ignore
    }
    return null;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setAdmin(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ admin, token, loading, login, logout }),
    [admin, token, loading, login, logout]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

/**
 * For pages inside the admin area: redirects to the admin login when there is
 * no session, and `guard` signs the admin out if the API says the session is
 * no longer valid (expired token, revoked role).
 */
export function useAdminSession() {
  const { admin, token, loading, logout } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !token) router.replace("/admin/masuk");
  }, [loading, token, router]);

  const guard = useCallback(
    <T,>(res: Result<T>): Result<T> => {
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        logout();
        router.replace("/admin/masuk");
      }
      return res;
    },
    [logout, router]
  );

  const ready = !loading && !!admin && !!token;
  return { token: ready ? token : null, ready, guard };
}

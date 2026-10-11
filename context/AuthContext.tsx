"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  getCurrentUser,
  loginUser,
  registerUser,
  type AuthResult,
  type User,
} from "@/lib/api";

const STORAGE_KEY = "piyama-token";

type AuthState = {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (name: string, email: string, password: string) => Promise<string | null>;
  logout: () => void;
  updateUser: (user: User) => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let stored: string | null = null;
    try {
      stored = localStorage.getItem(STORAGE_KEY);
    } catch {
      // storage unavailable
    }
    if (!stored) {
      Promise.resolve().then(() => setLoading(false));
      return;
    }
    getCurrentUser(stored).then((res) => {
      if (res.ok) {
        setToken(stored);
        setUser(res.data);
      } else {
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });
  }, []);

  const applyAuth = useCallback((auth: AuthResult) => {
    setToken(auth.token);
    setUser(auth.user);
    try {
      localStorage.setItem(STORAGE_KEY, auth.token);
    } catch {
      // ignore
    }
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await loginUser({ email, password });
      if (!res.ok) return res.error;
      applyAuth(res.data);
      return null;
    },
    [applyAuth]
  );

  const register = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await registerUser({ name, email, password });
      if (!res.ok) return res.error;
      applyAuth(res.data);
      return null;
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, updateUser: setUser }),
    [user, token, loading, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

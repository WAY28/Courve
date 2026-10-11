"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CheckIcon } from "@/components/Icons";

type Toast = { message: string; href?: string; actionLabel?: string };

const ToastContext = createContext<{ show: (toast: Toast) => void } | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<(Toast & { id: number }) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((t: Toast) => {
    if (timer.current) clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), 4500);
  }, []);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex justify-center px-4"
      >
        {toast && (
          <div
            key={toast.id}
            className="toast-in pointer-events-auto flex items-center gap-3 rounded-2xl bg-foreground py-3 pl-4 pr-3 text-sm text-white shadow-xl"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-dark text-white">
              <CheckIcon size={14} />
            </span>
            <span>{toast.message}</span>
            {toast.href && (
              <Link
                href={toast.href}
                onClick={() => setToast(null)}
                className="rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/25"
              >
                {toast.actionLabel ?? "Lihat"}
              </Link>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

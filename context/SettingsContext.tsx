"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { getShopSettings } from "@/lib/api";
import { buildWaLink } from "@/lib/whatsapp";

type WhatsApp = {
  /** False until the settings request has finished. */
  ready: boolean;
  /** Shop number (digits, international format) or "" when the admin has not set one. */
  number: string;
  /** wa.me link with prefilled text, or null when no number is set. */
  link: (text: string) => string | null;
};

const SettingsContext = createContext<WhatsApp | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [number, setNumber] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getShopSettings().then((res) => {
      if (res.ok) setNumber(res.data.whatsappNumber);
      setReady(true);
    });
  }, []);

  const link = useCallback((text: string) => (number ? buildWaLink(number, text) : null), [number]);
  const value = useMemo(() => ({ ready, number, link }), [ready, number, link]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useWhatsApp() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useWhatsApp must be used within SettingsProvider");
  return ctx;
}

"use client";

import type { ReactNode } from "react";
import { useWhatsApp } from "@/context/SettingsContext";

/** Link to the shop's WhatsApp; shows a plain note if the admin has not set a number yet. */
export default function WaLink({
  text,
  className,
  children,
}: {
  text: string;
  className?: string;
  children: ReactNode;
}) {
  const { ready, link } = useWhatsApp();
  const href = link(text);
  if (!ready) return <span className="inline-block h-6 w-40 animate-pulse rounded bg-border" aria-hidden="true" />;
  if (!href) {
    return <span className="text-sm text-muted">Nomor WhatsApp toko belum diatur. Silakan coba lagi nanti.</span>;
  }
  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}

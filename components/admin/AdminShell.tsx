"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { MoonMark } from "@/components/Icons";
import { useAdminAuth } from "@/context/AdminAuthContext";

const nav = [
  { href: "/admin", label: "Ringkasan" },
  { href: "/admin/pesanan", label: "Pesanan" },
  { href: "/admin/produk", label: "Produk" },
  { href: "/admin/pelanggan", label: "Pelanggan" },
  { href: "/admin/ulasan", label: "Ulasan" },
  { href: "/admin/pengaturan", label: "Pengaturan" },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { admin, logout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-foreground text-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <MoonMark size={28} />
            <span className="font-display text-lg font-bold">Courve</span>
            <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold tracking-wide">ADMIN</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="rounded-full px-3 py-2 text-white/80 hover:bg-white/10 hover:text-white">
              Lihat toko
            </Link>
            {admin && (
              <button
                onClick={() => {
                  logout();
                  router.replace("/admin/masuk");
                }}
                className="rounded-full border border-white/30 px-4 py-2 font-medium hover:bg-white/10"
              >
                Keluar
              </button>
            )}
          </div>
        </div>
        {admin && (
          <nav aria-label="Menu admin" className="border-t border-white/10">
            <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
              {nav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={isActive(item.href) ? "page" : undefined}
                    className={`block whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? "border-white text-white"
                        : "border-transparent text-white/70 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { CartIcon, CloseIcon, MenuIcon, MoonMark, SearchIcon, UserIcon, HeartIcon } from "@/components/Icons";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { href: "/", label: "Beranda" },
  { href: "/katalog", label: "Katalog" },
  { href: "/lacak", label: "Lacak pesanan" },
];

function SearchForm({ onSubmit, className }: { onSubmit?: () => void; className?: string }) {
  return (
    <form action="/katalog" role="search" onSubmit={onSubmit} className={className}>
      <label htmlFor="site-search" className="sr-only">
        Cari produk
      </label>
      <SearchIcon size={16} className="shrink-0 text-muted" />
      <input
        id="site-search"
        name="q"
        type="search"
        placeholder="Cari piyama..."
        className="w-full min-w-0 bg-transparent text-sm outline-none placeholder:text-muted"
      />
    </form>
  );
}

export default function Header() {
  const { items } = useCart();
  const { user } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const cartCount = items.reduce((sum, i) => sum + i.qty, 0);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      <div className="bg-foreground px-4 py-2 text-center text-xs text-white/90">
        Ongkir flat Rp 15.000
        <span className="hidden sm:inline"> &middot; Bayar lewat Transfer Bank, COD, atau E-Wallet</span>
      </div>

      <header className="sticky top-0 z-40 border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
              <MoonMark size={30} />
              <span className="font-display text-xl font-bold tracking-tight text-foreground">
                Courve
              </span>
            </Link>

            <nav aria-label="Navigasi utama" className="hidden gap-7 md:flex">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`relative py-1 text-sm font-medium transition-colors after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:origin-left after:rounded-full after:bg-accent after:transition-transform ${
                    isActive(link.href)
                      ? "text-foreground after:scale-x-100"
                      : "text-muted after:scale-x-0 hover:text-foreground hover:after:scale-x-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SearchForm className="hidden h-11 w-56 items-center gap-2 rounded-full border border-border bg-background px-4 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25 lg:flex" />

            <Link
              href={user ? "/akun" : "/masuk"}
              className="hidden h-11 items-center gap-2 rounded-full border border-border px-4 text-sm font-medium transition-colors hover:border-accent sm:flex"
            >
              <UserIcon size={17} />
              {user ? user.name.split(" ")[0] : "Masuk"}
            </Link>

            <Link
              href="/wishlist"
              className="hidden h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:border-accent sm:flex"
              aria-label="Wishlist"
            >
              <HeartIcon size={20} />
            </Link>

            <Link
              href="/keranjang"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-border transition-colors hover:border-accent"
              aria-label={`Keranjang belanja, ${cartCount} item`}
            >
              <CartIcon size={20} />
              {cartCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-secondary px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Tutup menu" : "Buka menu"}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-border md:hidden"
            >
              {open ? <CloseIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>

        {open && (
          <div id="mobile-menu" className="border-t border-border bg-surface md:hidden">
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-4">
              <SearchForm
                onSubmit={() => setOpen(false)}
                className="mb-3 flex h-12 items-center gap-2 rounded-full border border-border bg-background px-4"
              />
              {[
                ...navLinks,
                { href: "/wishlist", label: "Wishlist" },
                { href: user ? "/akun" : "/masuk", label: user ? `Akun (${user.name.split(" ")[0]})` : "Masuk / Daftar" },
              ].map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-base font-medium hover:bg-accent-tint"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </header>
    </>
  );
}

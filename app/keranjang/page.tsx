"use client";

import Image from "@/components/ProductImage";
import Link from "next/link";
import { useEffect } from "react";
import CartNotices from "@/components/CartNotices";
import { ArrowRightIcon, CartIcon, TrashIcon } from "@/components/Icons";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/api";

const SHIPPING_FEE = 15000;

function CartSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
      <div className="skeleton h-9 w-64" />
      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <div className="skeleton h-36" />
          <div className="skeleton h-36" />
        </div>
        <div className="skeleton h-72" />
      </div>
    </div>
  );
}

export default function KeranjangPage() {
  const { items, hydrated, dispatch, refresh } = useCart();

  useEffect(() => {
    if (hydrated) refresh();
  }, [hydrated, refresh]);

  if (!hydrated) return <CartSkeleton />;

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center sm:px-6">
        <div className="text-left">
          <CartNotices />
        </div>
        <span className="mx-auto mt-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent-tint text-accent">
          <CartIcon size={36} />
        </span>
        <h1 className="font-display mt-6 text-2xl font-bold">Keranjangmu masih kosong</h1>
        <p className="mt-2 text-sm text-muted">
          Yuk, pilih piyama favoritmu dan mulai belanja.
        </p>
        <Link href="/katalog" className="btn-primary mt-7">
          Lihat katalog
          <ArrowRightIcon size={18} />
        </Link>
      </div>
    );
  }

  const count = items.reduce((n, i) => n + i.qty, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const total = subtotal + SHIPPING_FEE;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="text-xs text-muted">
        <Link href="/" className="hover:text-foreground">
          Beranda
        </Link>{" "}
        / <span className="text-foreground">Keranjang</span>
      </nav>
      <h1 className="font-display mt-4 text-3xl font-bold tracking-tight">
        Keranjang belanja <span className="text-lg font-medium text-muted">({count} item)</span>
      </h1>

      <CartNotices />

      <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <ul className="flex flex-col gap-4">
          {items.map((item) => {
            const key = `${item.slug}-${item.size}`;
            return (
              <li key={key} className="card flex gap-4 p-4 sm:gap-5 sm:p-5">
                <Link
                  href={`/produk/${item.slug}`}
                  className="relative h-28 w-24 shrink-0 overflow-hidden rounded-xl bg-accent-soft sm:h-32 sm:w-28"
                >
                  <Image src={item.image} alt={item.name} fill sizes="112px" className="object-cover" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/produk/${item.slug}`}
                        className="font-semibold leading-snug hover:text-accent-dark"
                      >
                        {item.name}
                      </Link>
                      <div className="mt-1 text-sm text-muted">
                        Ukuran {item.size} &middot; {formatPrice(item.price)}
                      </div>
                    </div>
                    <button
                      onClick={() => dispatch({ type: "REMOVE", slug: item.slug, size: item.size })}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-secondary-soft hover:text-secondary-dark"
                      aria-label={`Hapus ${item.name} ukuran ${item.size}`}
                    >
                      <TrashIcon size={18} />
                    </button>
                  </div>

                  <div className="mt-auto flex flex-wrap items-center justify-between gap-3 pt-3">
                    <div
                      role="group"
                      aria-label={`Jumlah ${item.name}`}
                      className="inline-flex h-10 items-center overflow-hidden rounded-lg border border-input"
                    >
                      <button
                        onClick={() =>
                          dispatch({ type: "SET_QTY", slug: item.slug, size: item.size, qty: item.qty - 1 })
                        }
                        disabled={item.qty <= 1}
                        className="flex h-full w-10 items-center justify-center hover:bg-accent-tint disabled:opacity-40"
                        aria-label="Kurangi jumlah"
                      >
                        −
                      </button>
                      <output className="flex h-full w-10 items-center justify-center text-sm font-semibold">
                        {item.qty}
                      </output>
                      <button
                        onClick={() =>
                          dispatch({ type: "SET_QTY", slug: item.slug, size: item.size, qty: item.qty + 1 })
                        }
                        disabled={item.stock !== undefined && item.qty >= item.stock}
                        className="flex h-full w-10 items-center justify-center hover:bg-accent-tint disabled:opacity-40"
                        aria-label="Tambah jumlah"
                      >
                        +
                      </button>
                    </div>
                    <div className="font-display text-lg font-bold text-accent-dark">
                      {formatPrice(item.price * item.qty)}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="card p-6 lg:sticky lg:top-28">
          <h2 className="font-display text-xl font-bold">Ringkasan pesanan</h2>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal ({count} item)</dt>
              <dd className="font-medium">{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Ongkos kirim</dt>
              <dd className="font-medium">{formatPrice(SHIPPING_FEE)}</dd>
            </div>
            <div className="mt-1 flex justify-between border-t border-border pt-4 text-base">
              <dt className="font-semibold">Total</dt>
              <dd className="font-display text-2xl font-bold text-accent-dark">{formatPrice(total)}</dd>
            </div>
          </dl>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Lanjut ke checkout
            <ArrowRightIcon size={18} />
          </Link>
          <Link
            href="/katalog"
            className="mt-3 block text-center text-sm font-semibold text-accent-dark underline-offset-4 hover:underline"
          >
            Lanjut belanja
          </Link>
        </aside>
      </div>
    </div>
  );
}

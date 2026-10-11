"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SalesReportSection from "@/components/admin/SalesReportSection";
import StatusBadge from "@/components/StatusBadge";
import { useAdminSession } from "@/context/AdminAuthContext";
import { formatPrice, getAdminStats, type AdminStats, type OrderStatus } from "@/lib/api";

const statusOrder: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

function Stat({ label, value, href, tone }: { label: string; value: string; href?: string; tone?: "warn" }) {
  const body = (
    <>
      <div className="text-xs text-muted">{label}</div>
      <div className={`font-display mt-1 text-2xl font-bold ${tone === "warn" ? "text-secondary-dark" : ""}`}>{value}</div>
    </>
  );
  return href ? (
    <Link href={href} className="card block p-5 transition-colors hover:border-accent">
      {body}
    </Link>
  ) : (
    <div className="card p-5">{body}</div>
  );
}

export default function AdminDashboardPage() {
  const { token, ready, guard } = useAdminSession();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    getAdminStats(token).then((r) => {
      const res = guard(r);
      if (res.ok) setStats(res.data);
      else setError(res.error);
    });
  }, [token, guard]);

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="skeleton h-10 w-56" />
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="skeleton h-24" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Ringkasan toko</h1>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-secondary-dark">
          {error}
        </p>
      )}
      {!stats && !error && <div className="skeleton mt-6 h-64" aria-busy="true" />}

      {stats && (
        <>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Pendapatan semua waktu (tanpa pesanan batal)" value={formatPrice(stats.totals.revenue)} />
            <Stat label="Total pesanan" value={String(stats.totals.orders)} href="/admin/pesanan" />
            <Stat
              label="Perlu diproses (menunggu bayar / dibayar)"
              value={String(stats.totals.needsAction)}
              href="/admin/pesanan?status=PENDING"
              tone={stats.totals.needsAction > 0 ? "warn" : undefined}
            />
            <Stat label="Pelanggan" value={String(stats.totals.customers)} href="/admin/pelanggan" />
            <Stat label="Produk" value={String(stats.totals.products)} href="/admin/produk" />
            <Stat
              label="Ukuran stok habis"
              value={String(stats.totals.outOfStock)}
              href="/admin/produk"
              tone={stats.totals.outOfStock > 0 ? "warn" : undefined}
            />
          </div>

          {token && <SalesReportSection token={token} guard={guard} />}

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <section className="card p-6" aria-labelledby="status">
              <h2 id="status" className="font-display text-lg font-bold">
                Pesanan per status <span className="text-sm font-normal text-muted">(semua waktu)</span>
              </h2>
              <ul className="mt-4 flex flex-col gap-3">
                {statusOrder.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-3">
                    <Link href={`/admin/pesanan?status=${s}`} className="hover:opacity-80">
                      <StatusBadge status={s} />
                    </Link>
                    <span className="font-display text-xl font-bold">{stats.byStatus[s]}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="card p-6" aria-labelledby="stok">
              <h2 id="stok" className="font-display text-lg font-bold">
                Stok menipis <span className="text-sm font-normal text-muted">(sisa {stats.lowStockThreshold} atau kurang)</span>
              </h2>
              {stats.lowStock.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Semua stok aman.</p>
              ) : (
                <ul className="mt-4 flex flex-col gap-3">
                  {stats.lowStock.map((r) => (
                    <li key={`${r.slug}-${r.size}`} className="flex items-center gap-3 text-sm">
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium">{r.product}</span>{" "}
                        <span className="text-muted">ukuran {r.size}</span>
                        {!r.published && <span className="ml-1 text-xs text-muted">(disembunyikan)</span>}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                          r.stock === 0 ? "bg-secondary-soft text-secondary-dark" : "bg-accent-soft text-accent-dark"
                        }`}
                      >
                        {r.stock === 0 ? "Habis" : `Sisa ${r.stock}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <Link href="/admin/produk" className="mt-4 inline-block text-sm font-semibold text-accent-dark hover:underline">
                Kelola stok
              </Link>
            </section>
          </div>
        </>
      )}
    </div>
  );
}

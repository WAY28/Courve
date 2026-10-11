"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import StatusBadge, { statusLabels } from "@/components/StatusBadge";
import { SearchIcon } from "@/components/Icons";
import { useAdminSession } from "@/context/AdminAuthContext";
import {
  formatPrice,
  getAdminOrders,
  updateOrderStatus,
  type OrderStatus,
  type OrdersPage,
} from "@/lib/api";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];
const PAGE_SIZE = 8;

const paymentLabels: Record<string, string> = {
  transfer: "Transfer Bank",
  cod: "COD",
  ewallet: "E-Wallet",
};

export default function OrdersView() {
  const { token, ready, guard } = useAdminSession();
  const params = useSearchParams();
  const initial = params.get("status");

  const [status, setStatus] = useState<OrderStatus | "">(
    STATUSES.includes(initial as OrderStatus) ? (initial as OrderStatus) : ""
  );
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<OrdersPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    const res = guard(
      await getAdminOrders(token, { status: status || undefined, q: q || undefined, page, pageSize: PAGE_SIZE })
    );
    if (res.ok) {
      setData(res.data);
      setError(null);
    } else {
      setError(res.error);
    }
  }, [token, status, q, page, guard]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function changeStatus(orderNumber: string, next: OrderStatus) {
    if (!token) return;
    if (
      next === "CANCELLED" &&
      !window.confirm(`Batalkan pesanan ${orderNumber}? Stok barang akan dikembalikan dan status tidak bisa diubah lagi.`)
    ) {
      return;
    }
    const res = guard(await updateOrderStatus(token, orderNumber, next));
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await load();
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-busy="true">
        <div className="skeleton h-10 w-56" />
        <div className="skeleton mt-6 h-40" />
      </div>
    );
  }

  const allCount = data ? STATUSES.reduce((n, s) => n + data.counts[s], 0) : 0;

  const chip = (active: boolean) =>
    `inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${
      active ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent"
    }`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="eyebrow">Admin</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Pesanan</h1>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          setQ(qInput.trim());
          setPage(1);
        }}
        className="mt-6 flex gap-2"
      >
        <label htmlFor="cari-pesanan" className="sr-only">
          Cari pesanan
        </label>
        <div className="flex h-12 flex-1 items-center gap-2 rounded-xl border border-input bg-surface px-4 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25">
          <SearchIcon size={16} className="shrink-0 text-muted" />
          <input
            id="cari-pesanan"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Cari nomor pesanan, nama, atau nomor HP"
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted"
          />
        </div>
        <button type="submit" className="btn-primary">
          Cari
        </button>
        {q && (
          <button
            type="button"
            onClick={() => {
              setQInput("");
              setQ("");
              setPage(1);
            }}
            className="btn-outline"
          >
            Reset
          </button>
        )}
      </form>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter status">
        <button
          onClick={() => {
            setStatus("");
            setPage(1);
          }}
          aria-pressed={status === ""}
          className={chip(status === "")}
        >
          Semua {data && <span className="font-semibold">({allCount})</span>}
        </button>
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
            aria-pressed={status === s}
            className={chip(status === s)}
          >
            {statusLabels[s]} {data && <span className="font-semibold">({data.counts[s]})</span>}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-secondary-dark">
          {error}
        </p>
      )}
      {!data && !error && <div className="skeleton mt-6 h-40" aria-busy="true" />}

      {data && data.orders.length === 0 && (
        <div className="card mt-6 border-dashed px-6 py-14 text-center text-sm text-muted">
          {q || status ? "Tidak ada pesanan yang cocok dengan filter." : "Belum ada pesanan masuk."}
        </div>
      )}

      {data && data.orders.length > 0 && (
        <>
          <p className="mt-6 text-sm text-muted" aria-live="polite">
            {data.total} pesanan ditemukan
          </p>
          <ul className="mt-3 flex flex-col gap-4">
            {data.orders.map((order) => (
              <li key={order.orderNumber} className="card p-5 sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="font-mono text-sm font-semibold">{order.orderNumber}</div>
                    <div className="text-xs text-muted">
                      {new Date(order.createdAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={order.status} />
                    {order.allowedStatuses.length > 0 ? (
                      <>
                        <label className="sr-only" htmlFor={`status-${order.orderNumber}`}>
                          Ubah status {order.orderNumber}
                        </label>
                        <select
                          id={`status-${order.orderNumber}`}
                          value=""
                          onChange={(e) => changeStatus(order.orderNumber, e.target.value as OrderStatus)}
                          className="h-10 rounded-lg border border-input bg-surface px-3 text-sm"
                        >
                          <option value="" disabled>
                            Ubah status…
                          </option>
                          {order.allowedStatuses.map((s) => (
                            <option key={s} value={s}>
                              {statusLabels[s]}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <span className="text-xs text-muted">Status final</span>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2">
                  <div>
                    <div className="font-semibold">{order.customerName}</div>
                    <div className="text-muted">{order.phone}</div>
                    <div className="mt-1 text-muted">
                      {order.address}, {order.city} {order.postalCode}
                    </div>
                  </div>
                  <div>
                    {order.items.map((i, idx) => (
                      <div key={idx}>
                        {i.name} <span className="text-muted">({i.size}) × {i.qty}</span>
                      </div>
                    ))}
                    <div className="mt-2 border-t border-border pt-2 font-bold">
                      {formatPrice(order.total)}{" "}
                      <span className="font-normal text-muted">
                        · {paymentLabels[order.paymentMethod] ?? order.paymentMethod}
                      </span>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {data.totalPages > 1 && (
            <nav aria-label="Halaman pesanan" className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={data.page <= 1}
                className="btn-outline btn-sm"
              >
                Sebelumnya
              </button>
              <span className="text-sm text-muted">
                Halaman {data.page} dari {data.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
                disabled={data.page >= data.totalPages}
                className="btn-outline btn-sm"
              >
                Berikutnya
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import StatusBadge from "@/components/StatusBadge";
import { formatPrice, trackOrder, type TrackedOrder } from "@/lib/api";
import WaLink from "@/components/WaLink";

const STEPS = ["PENDING", "PAID", "SHIPPED", "COMPLETED"] as const;
const STEP_LABELS: Record<(typeof STEPS)[number], string> = {
  PENDING: "Menunggu pembayaran",
  PAID: "Dibayar",
  SHIPPED: "Dikirim",
  COMPLETED: "Selesai",
};

export default function LacakPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);
    const res = await trackOrder({ orderNumber, phone });
    setLoading(false);
    if (res.ok) setOrder(res.data);
    else setError(res.error);
  }

  const stepIndex = order ? STEPS.indexOf(order.status as (typeof STEPS)[number]) : -1;

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6">
      <p className="eyebrow">Pesanan</p>
      <h1 className="font-display mt-2 text-3xl font-bold tracking-tight">Lacak pesanan</h1>
      <p className="mt-2 text-sm text-muted">
        Masukkan nomor pesanan dan nomor HP yang kamu pakai saat checkout. Tidak perlu punya akun.
      </p>

      <form onSubmit={submit} className="card mt-6 flex flex-col gap-4 p-6">
        <div>
          <label htmlFor="track-no" className="label">
            Nomor pesanan
          </label>
          <input
            id="track-no"
            required
            placeholder="PY-12345678"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            className="field font-mono"
          />
        </div>
        <div>
          <label htmlFor="track-phone" className="label">
            Nomor HP
          </label>
          <input
            id="track-phone"
            required
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="08xxxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="field"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm font-medium text-secondary-dark">
            {error}
          </p>
        )}
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? "Mencari..." : "Cari pesanan"}
        </button>
      </form>

      {order && (
        <section className="card mt-6 p-6" aria-labelledby="hasil-lacak">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="hasil-lacak" className="font-mono text-base font-semibold">
              {order.orderNumber}
            </h2>
            <StatusBadge status={order.status} />
          </div>

          {order.status === "CANCELLED" ? (
            <p className="mt-4 text-sm text-muted">Pesanan ini sudah dibatalkan.</p>
          ) : (
            <ol className="mt-5 grid grid-cols-4 gap-2 text-center text-xs" aria-label="Tahapan pesanan">
              {STEPS.map((s, i) => (
                <li key={s} aria-current={i === stepIndex ? "step" : undefined}>
                  <span
                    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-full font-bold ${
                      i <= stepIndex ? "bg-accent text-white" : "bg-border text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <span className={`mt-1.5 block ${i === stepIndex ? "font-semibold" : "text-muted"}`}>
                    {STEP_LABELS[s]}
                  </span>
                </li>
              ))}
            </ol>
          )}

          <ul className="mt-5 flex flex-col gap-1.5 border-t border-border pt-4 text-sm">
            {order.items.map((item, i) => (
              <li key={i} className="flex justify-between gap-4">
                <span>
                  {item.name} <span className="text-muted">({item.size}) × {item.qty}</span>
                </span>
                <span className="shrink-0 text-muted">{formatPrice(item.price * item.qty)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-border pt-4 font-bold">
            <span>Total</span>
            <span className="text-accent-dark">{formatPrice(order.total)}</span>
          </div>
          <div className="mt-5">
            <WaLink text={`Halo Courve, saya ingin menanyakan pesanan ${order.orderNumber}.`} className="btn-outline btn-sm">
              Tanya admin lewat WhatsApp
            </WaLink>
          </div>
        </section>
      )}
    </div>
  );
}

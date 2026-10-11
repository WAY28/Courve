"use client";

import { useEffect, useState } from "react";
import RevenueChart from "@/components/admin/RevenueChart";
import StatusBadge from "@/components/StatusBadge";
import {
  downloadSalesCsv,
  formatPrice,
  getSalesReport,
  RANGE_OPTIONS,
  type OrderStatus,
  type RangeKey,
  type Result,
  type SalesReport,
} from "@/lib/api";

const STATUSES: OrderStatus[] = ["PENDING", "PAID", "SHIPPED", "COMPLETED", "CANCELLED"];

function Delta({ change, previous }: { change: number | null; previous: number }) {
  if (change === null) {
    return <span className="text-xs text-muted">{previous === 0 ? "Belum ada pembanding" : "—"}</span>;
  }
  if (change === 0) return <span className="text-xs text-muted">Sama dengan periode sebelumnya</span>;
  const up = change > 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-sage-dark" : "text-secondary-dark"}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      {up ? "Naik" : "Turun"} {Math.abs(change)}% dari periode sebelumnya
    </span>
  );
}

function Metric({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-accent-tint p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="font-display mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 min-h-4">{children}</div>
    </div>
  );
}

export default function SalesReportSection({
  token,
  guard,
}: {
  token: string;
  guard: <T>(res: Result<T>) => Result<T>;
}) {
  const [range, setRange] = useState<RangeKey>("7d");
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getSalesReport(token, range).then((r) => {
      if (cancelled) return;
      const res = guard(r);
      if (res.ok) {
        setReport(res.data);
        setError(null);
      } else {
        setError(res.error);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [token, range, guard]);

  async function exportCsv() {
    setExporting(true);
    const res = guard(await downloadSalesCsv(token, range));
    if (!res.ok) setError(res.error);
    setExporting(false);
  }

  const rangeLabel = RANGE_OPTIONS.find((o) => o.key === range)?.label ?? "";
  const since = report
    ? new Intl.DateTimeFormat("id-ID", {
        timeZone: "Asia/Jakarta",
        day: "numeric",
        month: "long",
        year: "numeric",
        ...(report.granularity === "hour" ? { hour: "2-digit", minute: "2-digit", hour12: false } : {}),
      }).format(new Date(report.from))
    : "";

  return (
    <section className="card mt-6 p-6" aria-labelledby="laporan-judul">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="laporan-judul" className="font-display text-xl font-bold">
            Laporan penjualan
          </h2>
          <p className="mt-1 text-sm text-muted" aria-live="polite">
            {report ? `${rangeLabel} terakhir · sejak ${since}` : "Memuat laporan…"}
          </p>
        </div>
        <button onClick={exportCsv} disabled={exporting || !report} className="btn-outline btn-sm">
          {exporting ? "Menyiapkan…" : "Unduh CSV"}
        </button>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Rentang waktu laporan">
        {RANGE_OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => setRange(o.key)}
            aria-pressed={range === o.key}
            className={`inline-flex min-h-10 items-center rounded-full border px-4 text-sm font-medium ${
              range === o.key
                ? "border-accent bg-accent text-white"
                : "border-border bg-surface hover:border-accent"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm font-medium text-secondary-dark">
          {error}
        </p>
      )}
      {!report && !error && <div className="skeleton mt-5 h-72" aria-busy="true" />}

      {report && (
        <div className={loading ? "opacity-60" : undefined} aria-busy={loading}>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Pendapatan" value={formatPrice(report.summary.revenue)}>
              <Delta change={report.summary.revenueChange} previous={report.summary.previousRevenue} />
            </Metric>
            <Metric label="Pesanan (tanpa yang batal)" value={String(report.summary.orders)}>
              <Delta change={report.summary.ordersChange} previous={report.summary.previousOrders} />
            </Metric>
            <Metric label="Rata-rata per pesanan" value={formatPrice(report.summary.averageOrder)} />
            <Metric label="Produk terjual" value={`${report.summary.itemsSold} pcs`}>
              {report.summary.cancelled > 0 && (
                <span className="text-xs text-muted">{report.summary.cancelled} pesanan dibatalkan</span>
              )}
            </Metric>
          </div>

          <div className="mt-6">
            <RevenueChart buckets={report.buckets} granularity={report.granularity} rangeLabel={rangeLabel} />
          </div>

          <div className="mt-6 grid gap-6 border-t border-border pt-6 lg:grid-cols-2">
            <div>
              <h3 className="font-display text-lg font-bold">Produk terlaris</h3>
              {report.topProducts.length === 0 ? (
                <p className="mt-3 text-sm text-muted">Belum ada penjualan pada periode ini.</p>
              ) : (
                <ol className="mt-3 flex flex-col gap-3">
                  {report.topProducts.map((p, i) => (
                    <li key={p.name} className="flex items-center gap-3 text-sm">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-tint font-bold text-accent-dark">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">{p.name}</span>
                      <span className="shrink-0 text-muted">{p.qty} terjual</span>
                      <span className="shrink-0 font-semibold">{formatPrice(p.revenue)}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">Pesanan pada periode ini</h3>
              <ul className="mt-3 flex flex-col gap-3">
                {STATUSES.map((s) => (
                  <li key={s} className="flex items-center justify-between gap-3">
                    <StatusBadge status={s} />
                    <span className="font-display text-xl font-bold">{report.byStatus[s]}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
